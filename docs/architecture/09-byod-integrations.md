# 09 — BYOD Integrations & Per-Tenant Secrets

> **Status:** Designed, not yet implemented (~13 hours estimated effort)
> **Decision date:** 2026-03-09

---

## Overview

Lyriosa uses a **Bring Your Own Device (BYOD)** model for third-party integrations. Each conservatorium operates its own payment terminal, email sender, and SMS account. Lyriosa never holds merchant-of-record status — money flows directly to each conservatorium's bank account.

This document covers:
1. Which integrations are per-tenant vs. shared
2. Secrets architecture (Google Secret Manager — never Firestore)
3. Runtime fallback pattern (tenant key → Lyriosa shared key)
4. Tiered pricing this enables
5. Implementation plan

---

## 1. Integration Ownership Model

| Service | Ownership | Reason |
|---------|-----------|--------|
| **Cardcom / Tranzila / Pelecard / HYP** | ✅ Always per-conservatorium | Bank of Israel regulation — money must flow to conservatorium's own merchant account. Lyriosa acting as merchant of record requires a payment institution license. |
| **SendGrid / Resend (email)** | ✅ BYOD optional | Branded outbound email from conservatorium's own domain (`info@cons-name.co.il`). Falls back to Lyriosa shared key. |
| **Twilio (SMS / WhatsApp)** | ✅ BYOD optional | Branded SMS sender ID / WhatsApp Business profile. Falls back to Lyriosa shared. |
| **Google Calendar** | ✅ BYOD optional | Sync to conservatorium's own Google Workspace calendar. |
| **Firebase Auth / Firestore** | ❌ Shared | Multi-tenant infrastructure. Per-tenant isolation via `conservatoriumId` claims, not separate projects. |
| **Google Secret Manager** | ❌ Shared | Single GCP project, per-tenant secret naming convention (see §3). |
| **Gemini / Genkit AI** | ❌ Shared | Cost is negligible (~$1–5/mo total). Not worth per-tenant complexity. |
| **Firebase Storage** | ⚠️ Shared bucket, per-tenant path | `/conservatoriums/{cid}/...` path isolation + Storage Security Rules. |

---

## 2. The Secrets Problem — Why Not Firestore

Storing API keys in Firestore (even encrypted at rest) is **wrong**:

| Risk | Detail |
|------|--------|
| Access control | Any Firestore read permission exposes all tenant keys |
| Audit trail | No record of which service accessed which key |
| Compliance | Violates PCI-DSS (payment credentials) and PDPPA (data processor obligations) |
| Backup exposure | Firestore exports include all fields — keys end up in backup buckets |
| Log leakage | Accidental logging of document fields would expose keys |

**Rule:** Firestore stores capability flags only. Secrets live in Google Secret Manager exclusively.

---

## 3. Secret Manager Architecture

### Naming Convention

```
cons_{conservatoriumId}_{service}_{field}

Examples:
  cons_cons-15_cardcom_terminal_number
  cons_cons-15_cardcom_api_password
  cons_cons-15_cardcom_webhook_secret
  cons_cons-15_sendgrid_api_key
  cons_cons-15_twilio_auth_token
  cons_cons-15_google_calendar_service_account
```

### IAM Policy

- **Only** the Lyriosa Cloud Run service account (`harmonia-app@harmonia-production.iam.gserviceaccount.com`) has `secretmanager.versions.access` role
- Conservatorium admins **cannot** read back their own secrets via the UI (write-only onboarding)
- All access logged to Cloud Audit Logs automatically

### What Firestore Stores (safe, non-secret)

```typescript
// conservatoriums/{cid}/integrations (Firestore document)
{
  payment: {
    provider: 'cardcom',          // which provider
    hasCredentials: true,         // flag only — never the key
    fromName: 'קונסרבטוריון הוד השרון',
    terminalDisplayNumber: '****1234',  // last 4 digits for UI display only
  },
  email: {
    provider: 'sendgrid',
    hasCredentials: true,
    fromEmail: 'info@cons-hod-hasharon.co.il',
    fromName: 'קונסרבטוריון הוד השרון',
  },
  sms: {
    provider: 'twilio',
    hasCredentials: true,
    fromNumber: '+97250xxxxxxx',
    whatsappNumber: '+97250xxxxxxx',
  }
}
```

### Runtime Secret Fetch Pattern

```typescript
// src/lib/secrets.ts (to be created)
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getTenantSecret(
  conservatoriumId: string,
  service: string,
  field: string
): Promise<string | null> {
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/cons_${conservatoriumId}_${service}_${field}/versions/latest`;
  try {
    const [version] = await client.accessSecretVersion({ name });
    return version.payload?.data?.toString() ?? null;
  } catch {
    return null; // secret not configured — caller falls back to shared key
  }
}
```

### Fallback Pattern in Dispatcher / Payment

```typescript
// Dispatcher (SMS example)
const authToken =
  await getTenantSecret(conservatoriumId, 'twilio', 'auth_token')
  ?? process.env.TWILIO_AUTH_TOKEN;  // Lyriosa shared fallback

// Payment (Cardcom example)
const terminalNumber =
  await getTenantSecret(conservatoriumId, 'cardcom', 'terminal_number')
  ?? process.env.CARDCOM_TERMINAL_NUMBER;  // should never hit fallback for payments
```

---

## 4. Admin Onboarding Flow (UI → Secret Manager)

```
Conservatorium admin opens Settings → Integrations
  → Enters Cardcom terminal number + API password
  → Clicks "Save credentials"
  → Server Action: saveIntegrationCredentials(conservatoriumId, provider, credentials)
      → verifyAuth() — must be conservatorium_admin for this conservatoriumId
      → secretmanager.addSecretVersion('cons_{id}_cardcom_terminal_number', value)
      → secretmanager.addSecretVersion('cons_{id}_cardcom_api_password', value)
      → Firestore update: integrations.payment = { provider, hasCredentials: true, terminalDisplayNumber: last4 }
      → Never logs the credential value
  → UI shows: "✅ Cardcom connected (terminal ****1234)"
```

The admin can **update** credentials (creates new secret version) but can **never read back** the full value — only the masked display field from Firestore.

---

## 5. Supported Payment Providers

All four major Israeli acquirers are supported. Each conservatorium uses whichever their bank provides:

| Provider | Market share | Integration status |
|----------|-------------|-------------------|
| **Cardcom** | ~40% | ✅ Fully coded (`src/lib/payments/cardcom.ts`) |
| **Tranzila** | ~25% | 🔲 Redirect URL stub only |
| **Pelecard** | ~20% | 🔲 Redirect URL stub only |
| **HYP (formerly iCredit)** | ~15% | 🔲 Redirect URL stub only |

Priority: implement Tranzila next (second largest, many municipal conservatoriums use it).

---

## 6. Tiered Product Offering

| Tier | Monthly Price | Payment | Email | SMS | White-label |
|------|--------------|---------|-------|-----|-------------|
| **Basic** | ₪800 | Lyriosa terminal (not possible — see §1) | Lyriosa sender | Lyriosa number | ❌ |
| **Standard** | ₪1,200 | Their own terminal (required) | Lyriosa sender (`noreply@harmonia.co.il`) | Lyriosa number | ❌ |
| **Professional** | ₪1,800 | Their own terminal | Their domain (`info@cons.co.il`) | Their number | Partial |
| **Enterprise** | Negotiated | Their own terminal | Their domain | Their number | Full |

> **Note:** Basic tier cannot exist for payments — every conservatorium must bring their own terminal. The question is only whether email/SMS is branded.

---

## 7. Cost Impact

### Lyriosa infrastructure savings (BYOD email/SMS)

| Scale | Without BYOD | With BYOD | Saving |
|-------|-------------|----------|--------|
| 5 conservatoriums | $270/mo | $240/mo | $30/mo |
| 20 conservatoriums | $1,100/mo | $910/mo | $190/mo |
| 85 conservatoriums | $4,550/mo | $3,750/mo | $800/mo |

### Secret Manager cost

- $0.06/month per active secret version
- 85 cons × 6 secrets = 510 secrets = **~$31/mo at full scale**
- Access operations at 500 payments/day = ~15,000/mo = **~$0.09/mo** (negligible)
- **Total Secret Manager: ~$31/mo at full scale**

### Net saving at full scale

$800/mo BYOD saving − $31/mo Secret Manager = **~$770/mo net saving**

---

## 8. Implementation Plan

~13 hours total effort. Can be a single sprint.

| Task | File(s) | Effort |
|------|---------|--------|
| Add `integrations` field to `Conservatorium` type | `src/lib/types.ts` | 1h |
| Create `src/lib/secrets.ts` (Secret Manager client + `getTenantSecret`) | New file | 2h |
| Server Action: `saveIntegrationCredentials` | `src/app/actions/integrations.ts` | 2h |
| Update `dispatcher.ts` to use fallback pattern | `src/lib/notifications/dispatcher.ts` | 1h |
| Update `cardcom.ts` to use fallback pattern | `src/lib/payments/cardcom.ts` | 1h |
| Settings UI: Integrations tab per conservatorium | `src/app/[locale]/dashboard/settings/conservatorium/` | 4h |
| IAM: grant Cloud Run SA `secretmanager.versions.access` | GCP console / terraform | 0.5h |
| Tests | `tests/lib/secrets.test.ts` | 1.5h |

### Dependencies
- Firebase project must exist (Phase 4 blocker)
- GCP billing account linked
- `@google-cloud/secret-manager` npm package (not yet installed)

---

## 9. Security Checklist

- [ ] Cloud Run service account has `secretmanager.versions.access` — no other roles
- [ ] No secret value ever written to Firestore, logs, or error messages
- [ ] Admin UI shows masked value only (last 4 chars)
- [ ] `saveIntegrationCredentials` action enforces `conservatoriumId` match on auth claims
- [ ] Secret names include `conservatoriumId` — cross-tenant access structurally impossible
- [ ] Cloud Audit Logs enabled for Secret Manager — alerts on anomalous access patterns
- [ ] Credentials rotatable without downtime (new secret version, old version disabled after 24h)
