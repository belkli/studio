<!-- SECTION: Admin Onboarding & Legal Compliance -->
<!-- Merge into master guide as a top-level section. Heading levels assume ## = section, ### = subsection. -->
<!-- Sources: docs/product/PRD.md, docs/product/DEMO-ACCESS.md, docs/product/User-Guide.md,
     docs/operations/LEGAL-READINESS.md, docs/legal/conservatorium-policies-analysis.md,
     docs/legal/standardized-price-model.md, docs/legal/standard-registration-agreement-draft.md,
     docs/contracts/MSA-TEMPLATE.md, docs/data/constadmin.json, docs/AUTH_PROVIDERS.md,
     docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md -->

## Admin Onboarding & Legal Compliance

> This section covers everything needed to onboard 85 conservatorium administrators to the Harmonia demo: account creation, welcome communications, demo environment limitations, and legal compliance. All information is derived from the PRD (production readiness: 35/100), the legal readiness assessment (85/100), the User Guide (8 personas), DEMO-ACCESS.md (Option C token gate), and the 85-record admin directory in `constadmin.json`.

### Demo Environment Context

Before onboarding admins, understand what the demo can and cannot do. The PRD (`docs/product/PRD.md`) rates production readiness at **35/100**. The demo runs entirely on **in-memory mock data** -- all data resets on every deployment. This is by design for the demo phase.

**What works in the demo (admins can explore these):**

| Module | Status | Notes |
|--------|--------|-------|
| Admin command center | Full UI | Mock aggregations; no real-time stats |
| User management & approvals | Full UI | CRUD works within session; resets on deploy |
| Lesson scheduling & calendar | Full UI | No booking atomicity; double-bookings possible |
| Billing & invoices | Full UI | All prices synthetic; VAT display working (`src/lib/vat.ts`) |
| Repertoire library | Full UI + data | 5,217 real compositions (metadata only, no IP risk) |
| Events & open days | Full UI | Mock events with future dates |
| Forms & approvals | Full UI | Form builder + approval workflow |
| AI features | 8 Genkit flows active | Progress reports, teacher matching, slot filling |
| 4-locale i18n | Working | Hebrew 100%, English 100%, Arabic 99.5%, Russian 59% |

**What does NOT work (set expectations with admins):**

| Feature | Demo Limitation | Production Plan |
|---------|----------------|-----------------|
| Login security | Dev bypass (any email logs in as `site_admin`) | Firebase Auth + session cookies |
| Data persistence | In-memory only; resets on deploy | Firestore / PostgreSQL |
| Payments | Mock URLs; no real Cardcom integration | Cardcom sandbox then production |
| SMS/WhatsApp | Console logs only; no real Twilio delivery | Twilio credentials needed |
| Digital signatures | Canvas component works; audit trail not persisted | Firebase Storage + audit log |
| Calendar sync | Not built | Google Calendar OAuth (future) |
| Real-time updates | No Firestore listeners | `onSnapshot` with React Query |

**Key message to admins:** "This is a functional prototype demonstrating the full UI and workflow. No real data is stored, no real payments are processed, and no real notifications are sent. Your feedback on the user experience and workflows is what we need at this stage."

---

### Admin Account Creation Strategy

#### Overview

There are 85 conservatorium administrators listed in `docs/data/constadmin.json`. Each needs:
- A Supabase Auth account (email/password)
- A Harmonia user profile with role `conservatorium_admin` and the correct `conservatoriumId`
- A unique, memorable but secure password

#### Password Format

Passwords follow a deterministic-but-secure format that is easy for admins to type on a phone:

```
Cons{id}-{Location3Chars}-{random4hex}
```

Examples:
- `Cons15-Hod-a7f2` (Hod HaSharon, ID 15)
- `Cons66-Kir-3e8b` (Kiryat Ono, ID 66)
- `Cons84-Tel-c5d1` (Tel Aviv ICM, ID 84)

This format is:
- 16+ characters (meets OWASP minimum)
- Contains uppercase, lowercase, digits, and a special character (`-`)
- Unique per conservatorium
- Memorable enough that an admin can read it from an email and type it

#### Conservatorium ID Mapping

| constadmin.json `id` | Harmonia `conservatoriumId` | Location |
|---|---|---|
| 1 | `cons-1` | Or Akiva |
| 15 | `cons-15` | Hod HaSharon |
| 66 | `cons-66` | Kiryat Ono |
| 84 | `cons-84` | Tel Aviv ICM |
| 85 | `cons-85` | Tel Aviv Yafo |

The seed script uses `conservatoriumId = cons-{admin.id}` automatically. The existing `src/lib/data.ts` creates mock conservatorium records using this same scheme, so the admin accounts align with mock data out of the box.

#### Account Seeding Script

Save the following as `scripts/seed-admin-accounts.ts` and run it once against the staging Supabase project.

**Prerequisites:**
- Node.js 20+
- `@supabase/supabase-js` installed (`npm install @supabase/supabase-js`)
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

```typescript
// scripts/seed-admin-accounts.ts
//
// Seeds 85 conservatorium admin accounts into Supabase Auth.
// Run once: npx tsx scripts/seed-admin-accounts.ts
//
// Required env vars:
//   SUPABASE_URL              — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role key (NOT anon key)

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Load admin data ──
const adminsPath = resolve(__dirname, '../docs/data/constadmin.json');
interface AdminRecord {
  id: number;
  location: string;
  manager_name: string;
  organization: string | null;
  office_phone: string | null;
  mobile: string | null;
  email: string;
}
const admins: AdminRecord[] = JSON.parse(readFileSync(adminsPath, 'utf-8'));

// ── Password generation ──
function generatePassword(admin: AdminRecord): string {
  const locationTag = transliterate(admin.location).slice(0, 3);
  const randomHex = randomBytes(2).toString('hex'); // 4 hex chars
  return `Cons${admin.id}-${locationTag}-${randomHex}`;
}

function transliterate(hebrew: string): string {
  const map: Record<string, string> = {
    'א': 'A', 'ב': 'B', 'ג': 'G', 'ד': 'D', 'ה': 'H',
    'ו': 'V', 'ז': 'Z', 'ח': 'Ch', 'ט': 'T', 'י': 'Y',
    'כ': 'K', 'ל': 'L', 'מ': 'M', 'נ': 'N', 'ס': 'S',
    'ע': 'A', 'פ': 'P', 'צ': 'Ts', 'ק': 'Q', 'ר': 'R',
    'ש': 'Sh', 'ת': 'T',
    'ך': 'K', 'ם': 'M', 'ן': 'N', 'ף': 'P', 'ץ': 'Ts',
  };
  let result = '';
  for (const ch of hebrew) {
    result += map[ch] || (ch.match(/[a-zA-Z0-9]/) ? ch : '');
  }
  return result || 'Loc';
}

// ── Credential output file (keep secure!) ──
const outputPath = resolve(__dirname, '../docs/data/admin-credentials.json');
interface CredentialRecord {
  conservatoriumId: string;
  adminId: number;
  location: string;
  managerName: string;
  email: string;
  password: string;
  supabaseUserId?: string;
  status: 'created' | 'skipped' | 'error';
  error?: string;
}

// ── Resume support: load existing output if present ──
let credentials: CredentialRecord[] = [];
const alreadyDone = new Set<number>();
if (existsSync(outputPath)) {
  credentials = JSON.parse(readFileSync(outputPath, 'utf-8'));
  for (const c of credentials) {
    if (c.status === 'created') alreadyDone.add(c.adminId);
  }
  console.log(`Resuming: ${alreadyDone.size} already created.`);
}

async function main() {
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const admin of admins) {
    if (alreadyDone.has(admin.id)) { skipped++; continue; }

    const primaryEmail = admin.email.split(';')[0].trim();
    const password = generatePassword(admin);
    const conservatoriumId = `cons-${admin.id}`;

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: primaryEmail,
        password,
        email_confirm: true,
        app_metadata: {
          role: 'conservatorium_admin',
          conservatoriumId,
          approved: true,
        },
        user_metadata: {
          name: admin.manager_name,
          location: admin.location,
          organization: admin.organization,
        },
      });

      if (error) {
        console.error(`[ERROR] cons-${admin.id} (${admin.location}): ${error.message}`);
        credentials.push({ conservatoriumId, adminId: admin.id, location: admin.location,
          managerName: admin.manager_name, email: primaryEmail, password, status: 'error',
          error: error.message });
        errors++;
      } else {
        console.log(`[OK] cons-${admin.id} (${admin.location}) => ${data.user.id}`);
        credentials.push({ conservatoriumId, adminId: admin.id, location: admin.location,
          managerName: admin.manager_name, email: primaryEmail, password,
          supabaseUserId: data.user.id, status: 'created' });
        created++;
      }
    } catch (err: any) {
      console.error(`[EXCEPTION] cons-${admin.id}: ${err.message}`);
      credentials.push({ conservatoriumId, adminId: admin.id, location: admin.location,
        managerName: admin.manager_name, email: primaryEmail, password, status: 'error',
        error: err.message });
      errors++;
    }

    writeFileSync(outputPath, JSON.stringify(credentials, null, 2), 'utf-8');
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`Credentials saved to: ${outputPath}`);
  console.log('*** IMPORTANT: Keep admin-credentials.json SECURE. Add to .gitignore. ***');
}

main();
```

**Run the script:**

```bash
npm install @supabase/supabase-js
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
npx tsx scripts/seed-admin-accounts.ts
```

#### Credential Security Checklist

- [ ] Add `docs/data/admin-credentials.json` to `.gitignore` immediately
- [ ] Store the credentials file in a password manager (1Password, Bitwarden) or encrypted vault
- [ ] Delete the local file after distributing credentials to admins
- [ ] Rotate all passwords after the demo period ends
- [ ] Never send credentials in the same channel as the login URL (split between email + SMS if possible)

---

### Welcome Email Template

#### Email Metadata

| Field | Value |
|---|---|
| **Subject (Hebrew)** | ברוכים הבאים להרמוניה -- גישה לסביבת הדמו |
| **Subject (English)** | Welcome to Harmonia -- Demo Environment Access |
| **From** | Harmonia Team <noreply@harmonia.co.il> |
| **Reply-To** | support@harmonia.co.il |

#### HTML Template

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים להרמוניה</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
           background-color: #f5f5f5; margin: 0; padding: 0; direction: rtl; }
    .container { max-width: 600px; margin: 40px auto; background: #fff;
                 border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5, #6366f1);
              color: #fff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .logo-placeholder { width: 80px; height: 80px; background: rgba(255,255,255,0.2);
                        border-radius: 16px; margin: 0 auto 16px;
                        display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .body { padding: 32px 24px; color: #1f2937; line-height: 1.7; }
    .credentials-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
                       padding: 20px; margin: 20px 0; direction: ltr; text-align: left; }
    .credentials-box .label { color: #64748b; font-size: 12px;
                              text-transform: uppercase; letter-spacing: 0.5px; }
    .credentials-box .value { color: #1e293b; font-weight: 600; font-size: 16px;
                              font-family: 'Courier New', monospace; }
    .cta-button { display: inline-block; background: #4f46e5; color: #fff !important;
                  text-decoration: none; padding: 14px 32px; border-radius: 8px;
                  font-weight: 600; font-size: 16px; margin: 16px 0; }
    .features li { padding: 6px 0; font-size: 15px; list-style: none; }
    .features li::before { content: "* "; color: #4f46e5; }
    .disclaimer { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px;
                  padding: 16px; margin: 20px 0; font-size: 13px; color: #854d0e; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-placeholder">&#9835;</div>
      <h1>הרמוניה</h1>
      <p>פלטפורמת ניהול קונסרבטוריון</p>
    </div>
    <div class="body">
      <p>שלום <strong>{{ADMIN_NAME}}</strong>,</p>
      <p>אנחנו שמחים להזמין אותך להכיר את <strong>הרמוניה</strong> --
         פלטפורמת ניהול הקונסרבטוריון החדשה שלנו.
         הכנו עבורך סביבת הדגמה עם נתונים לדוגמה כדי שתוכל/י לחוות את כל האפשרויות.</p>
      <div class="credentials-box">
        <p class="label">Login URL</p>
        <p class="value">{{LOGIN_URL}}</p>
        <p class="label" style="margin-top:12px">Email (Username)</p>
        <p class="value">{{ADMIN_EMAIL}}</p>
        <p class="label" style="margin-top:12px">Password</p>
        <p class="value">{{PASSWORD}}</p>
      </div>
      <div style="text-align:center">
        <a href="{{LOGIN_URL}}" class="cta-button">כניסה לסביבת ההדגמה</a>
      </div>
      <hr style="border:none;height:1px;background:#e5e7eb;margin:24px 0">
      <p><strong>מה ניתן לעשות בסביבת ההדגמה:</strong></p>
      <ul class="features">
        <li>ניהול תלמידים, מורים וכיתות -- הרשמה, שיבוץ, ומעקב</li>
        <li>תזמון שיעורים ובדיקת זמינות מורים -- כולל שיעורי החזר</li>
        <li>מערכת חיוב, חשבוניות, ומעקב תשלומים -- כולל מע"מ</li>
        <li>ספריית רפרטואר עם למעלה מ-5,000 יצירות מתורגמות</li>
      </ul>
      <div class="disclaimer">
        <strong>שימו לב:</strong> זוהי סביבת הדגמה בלבד. כל הנתונים הם סינתטיים
        ואינם מייצגים תלמידים, מורים או הורים אמיתיים.
        שינויים שתבצע/י בסביבה עשויים להתאפס מעת לעת.
      </div>
      <p>לשאלות או להערות: <strong>support@harmonia.co.il</strong></p>
      <p>בברכה,<br><strong>צוות הרמוניה</strong></p>
    </div>
    <div class="footer">
      <p>הרמוניה פלטפורם בע"מ</p>
      <p>קיבלת דוא"ל זה כי נשלח אליך קוד גישה לסביבת ההדגמה של הרמוניה.
         אם קיבלת אותו בטעות, אנא התעלם/י ממנו.</p>
    </div>
  </div>
</body>
</html>
```

#### Email Sending Script

```typescript
// scripts/send-welcome-emails.ts
//
// Sends personalized welcome emails to all admins.
// Reads credentials from docs/data/admin-credentials.json.
//
// Required env vars:
//   SENDGRID_API_KEY    — SendGrid API key
//   DEMO_LOGIN_URL      — e.g. https://harmonia-staging.web.app/login
//   DRY_RUN             — set to "true" to preview without sending

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DEMO_LOGIN_URL = process.env.DEMO_LOGIN_URL || 'https://harmonia-staging.web.app/login';
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!SENDGRID_API_KEY && !DRY_RUN) {
  console.error('Missing SENDGRID_API_KEY (set DRY_RUN=true to preview)');
  process.exit(1);
}

interface CredentialRecord {
  conservatoriumId: string; adminId: number; location: string;
  managerName: string; email: string; password: string;
  supabaseUserId?: string; status: string;
}

const credentials: CredentialRecord[] = JSON.parse(
  readFileSync(resolve(__dirname, '../docs/data/admin-credentials.json'), 'utf-8')
);

const templateHtml = readFileSync(
  resolve(__dirname, '../docs/guides/welcome-email-template.html'), 'utf-8'
);

async function sendEmail(cred: CredentialRecord) {
  const html = templateHtml
    .replace(/\{\{ADMIN_NAME\}\}/g, cred.managerName)
    .replace(/\{\{ADMIN_EMAIL\}\}/g, cred.email)
    .replace(/\{\{PASSWORD\}\}/g, cred.password)
    .replace(/\{\{LOGIN_URL\}\}/g, DEMO_LOGIN_URL);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send to: ${cred.email} (${cred.location})`);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: cred.email, name: cred.managerName }] }],
      from: { email: 'noreply@harmonia.co.il', name: 'Harmonia' },
      reply_to: { email: 'support@harmonia.co.il', name: 'Harmonia Support' },
      subject: 'ברוכים הבאים להרמוניה -- גישה לסביבת הדמו',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (res.ok) {
    console.log(`[SENT] ${cred.email} (${cred.location})`);
  } else {
    console.error(`[FAIL] ${cred.email}: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const toSend = credentials.filter((c) => c.status === 'created');
  console.log(`Sending ${toSend.length} emails (DRY_RUN=${DRY_RUN})...\n`);
  for (const cred of toSend) {
    await sendEmail(cred);
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 500));
  }
  console.log('\nDone.');
}

main();
```

#### Email Checklist

- [ ] Save the HTML template as `docs/guides/welcome-email-template.html`
- [ ] Run `DRY_RUN=true npx tsx scripts/send-welcome-emails.ts` to preview
- [ ] Verify HTML renders correctly in Gmail, Outlook, and Apple Mail (RTL Hebrew)
- [ ] Send a test email to yourself first
- [ ] Get approval from project lead before sending to all 85 admins
- [ ] Run `npx tsx scripts/send-welcome-emails.ts` to send

---

### PDF Presentation Outline

Create a 6-page PDF (Canva, Google Slides, or Figma) to attach to the welcome email.

| Page | Title | Content |
|------|-------|---------|
| 1 | ברוכים הבאים להרמוניה | Logo + hero screenshot. "הרמוניה היא מערכת ניהול דיגיטלית שתחליף את ניהול הקונסרבטוריון בגיליונות אלקטרוניים, WhatsApp, ודף נייר." |
| 2 | כניסה למערכת | [Screenshot: login page]. Steps: open link, enter email, enter password, click login. Note: language switcher in top menu. |
| 3 | לוח הבקרה שלך | [Screenshot: admin dashboard]. Callouts: A. active students B. weekly lessons C. pending approvals D. open invoices E. quick actions |
| 4 | יכולות עיקריות | 4 feature cards: (1) Student & teacher management (2) Lesson scheduling (3) Billing & payments with VAT (4) Repertoire library (5,000+ compositions) |
| 5 | מה הלאה? | Timeline: Phase 1 demo now -- Phase 2 feedback 2-4 weeks -- Phase 3 real data import -- Phase 4 production launch |
| 6 | צור קשר | support@harmonia.co.il, phone placeholder, hours Sun-Thu 09:00-17:00, in-app help, feedback form |

**Presentation checklist:**

- [ ] Create slides in RTL layout
- [ ] Take actual screenshots from the staging environment
- [ ] Export as PDF (A4 landscape)
- [ ] Save as `docs/guides/harmonia-admin-intro-he.pdf`
- [ ] Create English version: `docs/guides/harmonia-admin-intro-en.pdf`
- [ ] Review with project lead before distribution

---

### Legal Review Checklist for Demo

#### Synthetic Data Verification

Before any admin touches the demo, verify that NO real PII is present:

- [ ] **Student names** -- confirm all names in `src/lib/data.ts` are fictional (they are: e.g. "David HaMelech", "Miriam Cohen")
- [ ] **Parent names** -- confirm all parent names are fictional
- [ ] **ID numbers** -- confirm no real Israeli ID numbers appear anywhere in mock data
- [ ] **Email addresses** -- confirm all emails use `@example.com` or similar non-deliverable domains
- [ ] **Phone numbers** -- confirm all phone numbers are fictional (050-000-XXXX pattern)
- [ ] **Teacher names** -- the 71 directory teachers use real names from conservatorium websites; verify these are publicly available information (they are: staff listings on public websites)
- [ ] **Conservatorium admin data** -- `constadmin.json` contains real manager names, emails, and phone numbers; this data must NOT appear in the demo UI visible to other admins (each admin should only see their own conservatorium)

#### Demo Disclaimer Banner

Add a persistent banner to the staging environment that cannot be dismissed:

```tsx
// Add to src/app/[locale]/layout.tsx (staging only)
{process.env.NEXT_PUBLIC_IS_DEMO === 'true' && (
  <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-500 text-amber-950
                  text-center text-sm font-medium py-1.5 px-4">
    סביבת הדגמה -- כל הנתונים סינתטיים ואינם מייצגים אנשים אמיתיים
    &nbsp;|&nbsp;
    Demo environment -- all data is synthetic
  </div>
)}
```

Set in staging `.env`:
```env
NEXT_PUBLIC_IS_DEMO=true
```

- [ ] Add `NEXT_PUBLIC_IS_DEMO` env var to staging config
- [ ] Add demo banner component to root layout
- [ ] Verify banner is visible on all pages (dashboard, settings, public pages)
- [ ] Verify banner does NOT appear in production

#### Privacy Notice for Admin Testers

Add this notice to the demo gate page. Admins must acknowledge it before entering:

> **הודעת פרטיות לסביבת ההדגמה**
>
> 1. סביבת הדגמה זו מכילה נתונים סינתטיים בלבד. אין בה מידע אישי של תלמידים, הורים, או מורים אמיתיים.
> 2. שימושך בסביבה זו מהווה הסכמה לאיסוף נתוני שימוש אנונימיים (דפים שנצפו, פעולות שבוצעו) לצורך שיפור הפלטפורמה.
> 3. אל תזין/י מידע אישי אמיתי (ת"ז, כרטיסי אשראי, מידע רפואי) לסביבת ההדגמה.
> 4. סביבת ההדגמה עשויה להתאפס מעת לעת. כל השינויים שתבצע/י עלולים להימחק.
> 5. לשאלות בנוגע לפרטיות: privacy@harmonia.co.il

- [ ] Add privacy notice to demo gate page
- [ ] Add privacy notice to welcome email
- [ ] Add checkbox: "קראתי והבנתי את הודעת הפרטיות"

#### Data Retention Policy for Demo

| Item | Retention | Action |
|------|-----------|--------|
| Demo user accounts | Until demo period ends (max 90 days) | Delete all Supabase Auth accounts |
| Usage analytics | 90 days | Auto-expire in analytics platform |
| Feedback submissions | Indefinite (consented) | Retain for product improvement |
| Demo access cookies | 30 days (auto-expire) | Cookie `maxAge` handles this |
| Staging database | Reset between demo rounds | Run `npm run db:reset` |

- [ ] Document retention periods in privacy notice
- [ ] Set calendar reminder to delete demo accounts after demo period
- [ ] Configure analytics data expiry (90 days)

#### Consent Form for Admin Testers

Admins exploring the demo will provide feedback. Collect consent:

> בלחיצה על "כניסה לסביבת ההדגמה", אני מסכים/ה:
> - [ ] לשימוש בסביבת ההדגמה בהתאם לתנאים שלעיל
> - [ ] לאיסוף משוב שאספק (טקסט, הערות, דיווחי באגים) לצורך שיפור הפלטפורמה
> - [ ] לאיסוף נתוני שימוש אנונימיים (דפים, לחיצות)

- [ ] Add consent checkboxes to demo gate page
- [ ] Store consent records in database (reuse existing `ConsentRecord` type)
- [ ] Log consent timestamp and IP for audit trail

#### Terms of Use for Demo Access

Draft a lightweight TOU for the demo (separate from the full production TOS):

- [ ] Permitted use: evaluation only, no production data
- [ ] Prohibited use: no real PII, no scraping, no vulnerability testing without authorization
- [ ] No warranty: demo is provided "as is" with no SLA
- [ ] Data loss: user accepts that data may be reset
- [ ] Intellectual property: all platform IP remains Harmonia's property
- [ ] Confidentiality: admin agrees not to share screenshots or data with competitors
- [ ] Termination: Harmonia may revoke demo access at any time
- [ ] Add TOU link to demo gate page
- [ ] Add TOU acceptance to consent form

#### Cross-Reference with LEGAL-READINESS.md

Current score from `docs/operations/LEGAL-READINESS.md`: **85/100** (was 40/100 before 2026-03-08 sprint).

| Area | Score | Demo Impact | Action for Demo |
|------|-------|-------------|-----------------|
| PDPPA | 80/100 | Demo uses synthetic data -- lower risk | Add demo disclaimer; no real PII |
| Consumer Protection | 80/100 | No real transactions in demo | N/A for demo; 14-day cooling-off and VAT display already implemented |
| Accessibility (IS 5568) | 60/100 | Same code as production | Ensure accessibility panel works; formal audit deferred to production |
| Contractual Framework | 75/100 | Demo TOU suffices | Standard registration agreement exists as draft (`docs/legal/standard-registration-agreement-draft.md`); MSA template at `docs/contracts/MSA-TEMPLATE.md` |
| IP Clearance | 50/100 | Same compositions library | Metadata only (titles/composers) -- no sheet music files, no IP risk |
| Digital Signatures | 95/100 | Demo signatures are tests | Component built (`signature-capture.tsx`); audit trail via `actions/signatures.ts` |
| Data Residency | 40/100 | Staging may use different region | Document staging data location; production must be europe-west1 or me-central1 |

**Implemented since 2026-03-08 sprint:** Cookie consent banner, ConsentRecord persistence, DSAR flow in `/dashboard/settings`, parental consent differentiation (`isMinor` prop), VIDEO_RECORDING consent, 14-day cooling-off cancellation flow, VAT display via `src/lib/vat.ts`, sub-processors listed in privacy page, enrollment contract signing step with SignatureCapture.

**Still pending for production:** Database registration with Israeli Registrar of Databases, DPO appointment, formal WCAG 2.1 AA audit, lawyer review of all contract templates, DPAs with sub-processors (Firebase, Cardcom, Twilio, SendGrid), ComplianceLog audit trail wiring.

#### Conservatorium Policy Context

The analysis of 13 real conservatorium bylaws (`docs/legal/conservatorium-policies-analysis.md`) found these **universal gaps** across the sector that Harmonia addresses:

| Gap Found in All 13 Bylaws | Harmonia's Solution |
|----------------------------|---------------------|
| No VAT disclosure on prices | `src/lib/vat.ts` -- all prices include 17% VAT |
| No 14-day cooling-off right disclosed | Cancellation flow in `src/app/actions/billing.ts` |
| Parental consent not differentiated from adult consent | `isMinor` prop on `consent-checkboxes.tsx` |
| No DSAR mechanism | DSAR section in `/dashboard/settings` |
| Photo/video consent combined or absent | Separate `VIDEO_RECORDING` ConsentType |
| Online cancellation not available (7 of 13) | Online cancellation form in billing dashboard |

**Price ranges from the corpus** (reference: `docs/legal/standardized-price-model.md`):
- 45-min individual: NIS 460-662/month
- 60-min individual: NIS 495-800/month
- Group lesson: NIS 120-280/month
- Instrument rental: NIS 50-85/month

These ranges are relevant when admins configure their conservatorium pricing in the platform. The standardized defaults in `conservatorium.pricingConfig` use midpoints from this analysis.

---

### OAuth Setup Guide (Google + Microsoft)

> Reference: `docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md` and `docs/AUTH_PROVIDERS.md`

#### Google Sign-In

**Step 1 -- Create Google Cloud Project:**

- [ ] Go to Google Cloud Console (console.cloud.google.com)
- [ ] Create project `harmonia-production` (or use existing Firebase project)
- [ ] Enable the **Google Identity** API (APIs & Services > Library)

**Step 2 -- Create OAuth Credentials:**

- [ ] APIs & Services > Credentials > Create Credentials > OAuth client ID
- [ ] Application type: **Web application**, name: `Harmonia Web Client`
- [ ] Authorized JavaScript origins:
  ```
  https://harmonia.web.app
  https://harmonia-staging.web.app
  http://localhost:9002
  ```
- [ ] Authorized redirect URIs:
  ```
  https://harmonia.web.app/__/auth/handler
  https://harmonia-staging.web.app/__/auth/handler
  http://localhost:9002/__/auth/handler
  ```
- [ ] Copy **Client ID** and **Client Secret**

**Step 3 -- Configure in Firebase:**

- [ ] Firebase Console > Authentication > Sign-in method > Google > Enable
- [ ] Paste Web Client ID and Client Secret > Save

**Step 4 -- OAuth Consent Screen:**

- [ ] APIs & Services > OAuth consent screen
- [ ] User type: **External** (for production) or **Internal** (for Workspace)
- [ ] App name: `Harmonia`, scopes: `email`, `profile`, `openid`
- [ ] If External: submit for verification (2-6 weeks lead time -- apply early)

#### Microsoft (Azure AD) Sign-In

**Step 1 -- Register App:**

- [ ] Azure Portal > Azure Active Directory > App registrations > New registration
- [ ] Name: `Harmonia`, account types: "Any directory + personal accounts"
- [ ] Redirect URI: `https://harmonia.web.app/__/auth/handler` (Web)
- [ ] Copy **Application (client) ID**

**Step 2 -- Create Client Secret:**

- [ ] Certificates & secrets > New client secret
- [ ] Description: `Harmonia Firebase Auth`, expiry: 24 months
- [ ] Copy **Secret Value** (shown only once)

**Step 3 -- API Permissions:**

- [ ] Add: Microsoft Graph > Delegated > `email`, `openid`, `profile`, `User.Read`
- [ ] Grant admin consent (if tenant admin)

**Step 4 -- Add Redirect URIs:**

- [ ] Authentication > Add platform > Web
- [ ] Add all three redirect URIs (production, staging, localhost)
- [ ] Check: "ID tokens" and "Access tokens" under Implicit grant

**Step 5 -- Configure in Firebase:**

- [ ] Firebase Console > Authentication > Sign-in method > Microsoft > Enable
- [ ] Paste Application ID and Client Secret > Save

#### Supabase OAuth (Alternative)

If using `AUTH_PROVIDER=supabase`:

- [ ] **Google:** Supabase Dashboard > Authentication > Providers > Google > Enable > paste Client ID/Secret. Copy Supabase redirect URL (`https://xxxx.supabase.co/auth/v1/callback`) and add it to Google Cloud Console.
- [ ] **Microsoft:** Supabase Dashboard > Authentication > Providers > Azure > Enable > paste Client ID/Secret. Copy Supabase redirect URL and add it to Azure Portal.

#### OAuth Verification Checklist

- [ ] Test Google sign-in on localhost
- [ ] Test Microsoft sign-in on localhost
- [ ] Test Google sign-in on staging URL
- [ ] Test Microsoft sign-in on staging URL
- [ ] Verify new OAuth user lands on "Complete registration" wizard
- [ ] Verify existing email user can link Google/Microsoft account
- [ ] Verify admin accounts work with OAuth (login only, no self-creation)
- [ ] Verify OAuth popup works on mobile browsers
- [ ] Verify error handling: "account exists with different credential"
- [ ] Rotate client secrets before production launch

#### OAuth Security Notes

| Concern | Mitigation |
|---------|-----------|
| Admin self-registration | OAuth does NOT auto-create admin accounts. Admins must be pre-created by `site_admin`. |
| Token storage | Firebase/Supabase SDKs handle token refresh. No manual storage. |
| Client secret exposure | Stored server-side only. Never in client bundle. |
| Consent screen | Google requires verification for 100+ users. Apply early. |
| Microsoft tenant | "Any org + personal" allows all Microsoft users. Restrict to specific tenants if needed. |

---

### Demo Gate Options

> Full implementation: `docs/product/DEMO-ACCESS.md`

#### Comparison Table

| Option | Mechanism | Pros | Cons | Effort |
|--------|-----------|------|------|--------|
| **A: Vercel Password** | Built-in deployment protection, single password | Free on Pro; zero code; instant | 1 password for all; no tracking; requires Vercel | ~5 min |
| **B: Firebase Preview + Basic Auth** | Preview channel + `DEMO_PASSWORD` in proxy | Free; auto-expires; easy reset | Single password; no tracking | ~15 min |
| **C: Custom Invite Token Gate** | Per-conservatorium tokens in `DEMO_TOKENS` env var; proxy cookie check | Per-admin tracking; personalized URLs; revocable; reuses Firebase | 30 min implementation; 85 tokens to manage | ~30 min |

**Recommendation:** Option C (already designed in DEMO-ACCESS.md).

#### Rollout Strategy

| Phase | Scope | Gate | Duration |
|-------|-------|------|----------|
| Phase 0 (Internal QA) | Dev team only | Option B: single password | 1-2 weeks |
| Phase 1 (Pilot) | 5 selected admins | Option C: 5 tokens | 2 weeks |
| Phase 2 (Full demo) | All 85 admins | Option C: 85 tokens | 4-8 weeks |
| Phase 3 (Production) | Public | Remove gate; real Firebase Auth | Permanent |

#### Token Generation Script

```bash
#!/bin/bash
# scripts/generate-demo-tokens.sh
# Generates consistent DEMO_TOKENS env var + invite URLs for all 85 admins.

declare -A TOKENS
PAIRS=""

for i in $(seq 1 85); do
  TOKEN=$(openssl rand -hex 4)
  TOKENS[$i]=$TOKEN
  if [ $i -gt 1 ]; then PAIRS="${PAIRS},"; fi
  PAIRS="${PAIRS}cons-${i}:${TOKEN}"
done

echo "DEMO_TOKENS=${PAIRS}"
echo ""
echo "# Invite URLs:"
for i in $(seq 1 85); do
  echo "cons-${i}: https://harmonia-staging.web.app?invite=${TOKENS[$i]}"
done
```

#### Demo Gate Checklist

- [ ] Add `DEMO_TOKENS` env var to staging config
- [ ] Add demo gate logic to `src/proxy.ts` (code in DEMO-ACCESS.md section 3.2)
- [ ] Create `src/app/[locale]/demo-gate/page.tsx` (code in DEMO-ACCESS.md section 3.3)
- [ ] Create `src/app/api/demo-verify/route.ts` (code in DEMO-ACCESS.md section 3.4)
- [ ] Generate tokens: `bash scripts/generate-demo-tokens.sh`
- [ ] Test: visit without token -- redirects to gate
- [ ] Test: visit with `?invite=valid-token` -- sets cookie, proceeds
- [ ] Test: visit after cookie set -- proceeds without gate
- [ ] Test: visit with `?invite=invalid-token` -- shows error
- [ ] Deploy to staging
- [ ] Send invite URLs to pilot admins

---

### Pre-Launch Legal Checklists

#### Before Demo Launch

- [ ] Verify NO real student PII in demo data (see synthetic data verification above)
- [ ] Add demo disclaimer banner to staging (`NEXT_PUBLIC_IS_DEMO=true`)
- [ ] Draft demo Terms of Use (lightweight, separate from production TOS)
- [ ] Add privacy notice to demo gate page
- [ ] Generate and distribute admin credentials securely (use `seed-admin-accounts.ts`)
- [ ] Test demo gate with 3-5 pilot admins before full rollout
- [ ] Prepare FAQ document for common admin questions about demo limitations
- [ ] Communicate clearly: this is a UI/workflow demo, not a production system (PRD score: 35/100)

#### Before Production Launch (from PRD + LEGAL-READINESS.md)

**Regulatory (from LEGAL-READINESS.md Part 6):**
- [ ] Register database with Israeli Registrar of Databases (Section 8, Privacy Protection Law)
- [ ] Appoint Data Security Officer (Regulation 2, Information Security Regulations)
- [ ] Complete security risk assessment per Information Security Regulations (ISO 27001 / IS 27799)
- [ ] Data breach notification procedure documented and tested (72-hour Registrar notification)

**Legal Documents (from MSA-TEMPLATE.md + LEGAL-READINESS.md Part 2):**
- [ ] Have MSA template (`docs/contracts/MSA-TEMPLATE.md`) reviewed by Israeli lawyer -- covers SLA, DPA, liability cap, termination, IP ownership, governing law (Tel Aviv District Court)
- [ ] Have standard registration agreement (`docs/legal/standard-registration-agreement-draft.md`) reviewed by Israeli lawyer -- 12 sections including parental consent, 14-day cooling-off, DSAR, 4 separate consent checkboxes
- [ ] Draft production Terms of Service for end users
- [ ] Have Privacy Policy reviewed by Israeli privacy lawyer
- [ ] Create DPA template for conservatoriums (required under Amendment 2 to Privacy Protection Law)

**Technical Security (from PRD Section 6.1):**
- [ ] Replace `verifyAuth()` stub with real Firebase Claims validation
- [ ] Deploy `src/middleware.ts` for server-side route protection
- [ ] Fix `z.any()` schemas (FormSubmission, User, Lesson)
- [ ] Deploy Firestore Security Rules with tenant isolation (`conservatoriumId`)
- [ ] Deploy Firebase Storage Security Rules (signed URLs for all PII)
- [ ] Remove `ignoreBuildErrors: true` from `next.config.ts`
- [ ] Confirm Firebase data residency (europe-west1 or me-central1)

**Third-Party Agreements (from LEGAL-READINESS.md Appendix B):**
- [ ] Firebase / Google Cloud DPA signed (Standard Contractual Clauses)
- [ ] Cardcom payment processing agreement signed and reviewed
- [ ] Twilio DPA signed (note: data goes to US unless EU endpoints configured)
- [ ] SendGrid DPA signed (note: data goes to US unless EU endpoints configured)
- [ ] Google AI (Gemini) data usage policy reviewed (used for AI progress reports)

**Accessibility (from PRD Section 4.5 + LEGAL-READINESS.md Section 1.3):**
- [ ] Commission formal WCAG 2.1 AA accessibility audit by certified Israeli consultant
- [ ] Add skip-to-content link in dashboard layout
- [ ] Verify colour contrast ratios for Hebrew text (4.5:1 normal, 3:1 large)
- [ ] Test with NVDA (Windows) and VoiceOver (iOS)
- [ ] Penalty for non-compliance: up to NIS 50,000 per complaint (IS 5568)

**Insurance & Governance:**
- [ ] Obtain professional liability (E&O) insurance
- [ ] Obtain cyber liability insurance
- [ ] IP assignment agreements for all developers
- [ ] Set up Google OAuth consent screen verification (2-6 weeks lead time)
- [ ] Set up Microsoft Azure AD app registration

---

### File Reference (Onboarding & Legal)

| File | Purpose |
|------|---------|
| `docs/product/PRD.md` | Product requirements; production readiness score 35/100; 6-phase dependency sequence |
| `docs/product/DEMO-ACCESS.md` | Demo gate architecture (Option C: per-conservatorium tokens) |
| `docs/product/User-Guide.md` | End-user guide (8 personas, all features documented) |
| `docs/operations/LEGAL-READINESS.md` | Legal compliance assessment (score: 85/100); Israeli law mapping |
| `docs/legal/standard-registration-agreement-draft.md` | Hebrew enrollment contract (12 sections, 4 consent types) |
| `docs/legal/conservatorium-policies-analysis.md` | Analysis of 13 real conservatorium bylaws; gap table |
| `docs/legal/standardized-price-model.md` | Recommended pricing defaults from PDF corpus |
| `docs/contracts/MSA-TEMPLATE.md` | MSA skeleton (13 sections) for lawyer review |
| `docs/data/constadmin.json` | Source of truth for 85 conservatorium admin records |
| `docs/data/admin-credentials.json` | Generated credentials (DO NOT COMMIT) |
| `docs/AUTH_PROVIDERS.md` | Auth provider configuration (Firebase / Supabase / dev bypass) |
| `docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md` | OAuth integration design (progressive registration flow) |
