# 03 -- Admin Onboarding & Legal Compliance Guide

**Version:** 1.0
**Date:** 2026-03-14
**Author:** UX & Legal Agent
**Status:** Ready for review

> This guide walks you through everything needed to onboard 85 conservatorium administrators to the Lyriosa demo, from account creation to legal compliance. Every section is a checklist. Code scripts are included where applicable.

---

## Table of Contents

1. [Admin Account Creation Strategy](#1-admin-account-creation-strategy)
2. [Welcome Email Template](#2-welcome-email-template)
3. [PDF Presentation Outline](#3-pdf-presentation-outline-for-admins)
4. [Legal Review Checklist for Demo](#4-legal-review-checklist-for-demo)
5. [OAuth Setup Guide (Google + Microsoft)](#5-oauth-setup-guide-google--microsoft)
6. [Demo Gate Options Comparison](#6-demo-gate-options-comparison)

---

## 1. Admin Account Creation Strategy

### 1.1 Overview

There are 85 conservatorium administrators listed in `docs/data/constadmin.json`. Each needs:
- A Supabase Auth account (email/password)
- A Lyriosa user profile with role `conservatorium_admin` and the correct `conservatoriumId`
- A unique, memorable but secure password

### 1.2 Password Format

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

### 1.3 Account Seeding Script

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
  // Take first 3 ASCII-safe chars from location (transliterate Hebrew)
  const locationTag = transliterate(admin.location).slice(0, 3);
  const randomHex = randomBytes(2).toString('hex'); // 4 hex chars
  return `Cons${admin.id}-${locationTag}-${randomHex}`;
}

function transliterate(hebrew: string): string {
  // Simple Hebrew-to-Latin map for password generation
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
    // Skip already processed
    if (alreadyDone.has(admin.id)) {
      skipped++;
      continue;
    }

    // Use the first email if multiple are separated by "; "
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
        credentials.push({
          conservatoriumId,
          adminId: admin.id,
          location: admin.location,
          managerName: admin.manager_name,
          email: primaryEmail,
          password,
          status: 'error',
          error: error.message,
        });
        errors++;
      } else {
        console.log(`[OK] cons-${admin.id} (${admin.location}) => ${data.user.id}`);
        credentials.push({
          conservatoriumId,
          adminId: admin.id,
          location: admin.location,
          managerName: admin.manager_name,
          email: primaryEmail,
          password,
          supabaseUserId: data.user.id,
          status: 'created',
        });
        created++;
      }
    } catch (err: any) {
      console.error(`[EXCEPTION] cons-${admin.id}: ${err.message}`);
      credentials.push({
        conservatoriumId,
        adminId: admin.id,
        location: admin.location,
        managerName: admin.manager_name,
        email: primaryEmail,
        password,
        status: 'error',
        error: err.message,
      });
      errors++;
    }

    // Write after each to support resume
    writeFileSync(outputPath, JSON.stringify(credentials, null, 2), 'utf-8');
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`Credentials saved to: ${outputPath}`);
  console.log('*** IMPORTANT: Keep admin-credentials.json SECURE. Add to .gitignore. ***');
}

main();
```

### 1.4 Running the Script

```bash
# 1. Install dependency (if not already)
npm install @supabase/supabase-js

# 2. Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# 3. Run the script
npx tsx scripts/seed-admin-accounts.ts

# 4. Verify output
cat docs/data/admin-credentials.json | head -20
```

### 1.5 Security Checklist for Credentials

- [ ] Add `docs/data/admin-credentials.json` to `.gitignore` immediately
- [ ] Store the credentials file in a password manager (1Password, Bitwarden) or encrypted vault
- [ ] Delete the local file after distributing credentials to admins
- [ ] Rotate all passwords after the demo period ends
- [ ] Never send credentials in the same channel as the login URL (split between email + SMS if possible)

### 1.6 Mapping Conservatorium IDs to Admin Users

The mapping is straightforward:

| constadmin.json `id` | Lyriosa `conservatoriumId` | Example |
|---|---|---|
| 1 | `cons-1` | Or Akiva |
| 15 | `cons-15` | Hod HaSharon |
| 66 | `cons-66` | Kiryat Ono |
| 84 | `cons-84` | Tel Aviv ICM |
| 85 | `cons-85` | Tel Aviv Yafo |

The seed script uses this mapping automatically: `conservatoriumId = cons-{admin.id}`.

The existing `src/lib/data.ts` already creates mock conservatorium records using this same scheme, so the admin accounts will align with mock data out of the box.

---

## 2. Welcome Email Template

### 2.1 Email Metadata

| Field | Value |
|---|---|
| **Subject (Hebrew)** | ברוכים הבאים להרמוניה -- גישה לסביבת הדמו |
| **Subject (English)** | Welcome to Lyriosa -- Demo Environment Access |
| **From** | Lyriosa Team <noreply@harmonia.co.il> |
| **Reply-To** | support@harmonia.co.il |

### 2.2 HTML Email Template

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים להרמוניה</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }
    .body {
      padding: 32px 24px;
      color: #1f2937;
      line-height: 1.7;
    }
    .credentials-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      direction: ltr;
      text-align: left;
    }
    .credentials-box p {
      margin: 6px 0;
      font-size: 14px;
    }
    .credentials-box .label {
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .credentials-box .value {
      color: #1e293b;
      font-weight: 600;
      font-size: 16px;
      font-family: 'Courier New', monospace;
    }
    .cta-button {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
    }
    .features {
      margin: 24px 0;
      padding: 0;
    }
    .features li {
      padding: 6px 0;
      font-size: 15px;
      list-style: none;
    }
    .features li::before {
      content: "✦ ";
      color: #4f46e5;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    .disclaimer {
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
      color: #854d0e;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-placeholder">&#9835;</div>
      <h1>הרמוניה</h1>
      <p>פלטפורמת ניהול קונסרבטוריון</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p>שלום <strong>{{ADMIN_NAME}}</strong>,</p>

      <p>
        אנחנו שמחים להזמין אותך להכיר את <strong>הרמוניה</strong> --
        פלטפורמת ניהול הקונסרבטוריון החדשה שלנו.
        הכנו עבורך סביבת הדגמה עם נתונים לדוגמה כדי שתוכל/י
        לחוות את כל האפשרויות.
      </p>

      <!-- Login credentials -->
      <div class="credentials-box">
        <p class="label">Login URL</p>
        <p class="value">{{LOGIN_URL}}</p>

        <p class="label" style="margin-top: 12px;">Email (Username)</p>
        <p class="value">{{ADMIN_EMAIL}}</p>

        <p class="label" style="margin-top: 12px;">Password</p>
        <p class="value">{{PASSWORD}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{LOGIN_URL}}" class="cta-button">כניסה לסביבת ההדגמה</a>
      </div>

      <div class="divider"></div>

      <!-- Key features -->
      <p><strong>מה ניתן לעשות בסביבת ההדגמה:</strong></p>
      <ul class="features">
        <li>ניהול תלמידים, מורים וכיתות -- הרשמה, שיבוץ, ומעקב</li>
        <li>תזמון שיעורים ובדיקת זמינות מורים -- כולל שיעורי החזר</li>
        <li>מערכת חיוב, חשבוניות, ומעקב תשלומים -- כולל מע"מ</li>
        <li>ספריית רפרטואר עם למעלה מ-5,000 יצירות מתורגמות</li>
      </ul>

      <div class="divider"></div>

      <!-- Demo disclaimer -->
      <div class="disclaimer">
        <strong>שימו לב:</strong> זוהי סביבת הדגמה בלבד. כל הנתונים הם
        סינתטיים ואינם מייצגים תלמידים, מורים או הורים אמיתיים.
        שינויים שתבצע/י בסביבה עשויים להתאפס מעת לעת.
      </div>

      <!-- Support -->
      <p>
        לשאלות או להערות, ניתן להשיב לדוא"ל זה או לפנות אלינו:
        <br>
        <strong>support@harmonia.co.il</strong>
      </p>

      <p>בברכה,<br><strong>צוות הרמוניה</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>הרמוניה פלטפורם בע"מ</p>
      <p>
        קיבלת דוא"ל זה כי נשלח אליך קוד גישה לסביבת ההדגמה
        של הרמוניה. אם קיבלת אותו בטעות, אנא התעלם/י ממנו.
      </p>
    </div>
  </div>
</body>
</html>
```

### 2.3 Email Sending Script

Use this script to send the welcome emails via SendGrid (or any SMTP provider):

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
  conservatoriumId: string;
  adminId: number;
  location: string;
  managerName: string;
  email: string;
  password: string;
  supabaseUserId?: string;
  status: string;
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
      from: { email: 'noreply@harmonia.co.il', name: 'Lyriosa' },
      reply_to: { email: 'support@harmonia.co.il', name: 'Lyriosa Support' },
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
    // Rate limit: SendGrid free tier = 100/day
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nDone.');
}

main();
```

### 2.4 Email Send Checklist

- [ ] Save the HTML template as `docs/guides/welcome-email-template.html`
- [ ] Run `DRY_RUN=true npx tsx scripts/send-welcome-emails.ts` to preview
- [ ] Verify the HTML renders correctly in Gmail, Outlook, and Apple Mail
- [ ] Verify RTL (Hebrew) renders correctly
- [ ] Send a test email to yourself first
- [ ] Get approval from project lead before sending to all 85 admins
- [ ] Run `npx tsx scripts/send-welcome-emails.ts` to send

---

## 3. PDF Presentation Outline for Admins

Create a 6-page PDF presentation (use Canva, Google Slides, or Figma) to attach to the welcome email or send separately.

### Page 1: Welcome

| Element | Content |
|---------|---------|
| **Title** | ברוכים הבאים להרמוניה |
| **Subtitle** | פלטפורמת ניהול הקונסרבטוריון החדשה |
| **Visual** | Lyriosa logo + hero screenshot of dashboard |
| **Body** | "הרמוניה היא מערכת ניהול דיגיטלית שתחליף את ניהול הקונסרבטוריון בגיליונות אלקטרוניים, WhatsApp, ודף נייר. הכל במקום אחד." |

### Page 2: How to Log In

| Element | Content |
|---------|---------|
| **Title** | כניסה למערכת |
| **Visual** | [Screenshot placeholder: login page with email/password fields highlighted] |
| **Steps** | 1. פתח את הקישור שקיבלת בדוא"ל 2. הזן את כתובת הדוא"ל שלך 3. הזן את הסיסמה שקיבלת 4. לחץ "כניסה" |
| **Note** | "ניתן לשנות את השפה בתפריט העליון: עברית, English, عربية, Русский" |

### Page 3: Dashboard Overview

| Element | Content |
|---------|---------|
| **Title** | לוח הבקרה שלך |
| **Visual** | [Screenshot placeholder: admin dashboard with callouts] |
| **Callouts** | A. מספר תלמידים פעילים B. שיעורים השבוע C. אישורים ממתינים D. חשבוניות פתוחות E. פעולות מהירות |

### Page 4: Key Features

| Element | Content |
|---------|---------|
| **Title** | יכולות עיקריות |
| **4 cards** | |
| Card 1 | **ניהול תלמידים ומורים** -- הרשמה, שיבוץ, מעקב נוכחות, ניהול זמינות |
| Card 2 | **תזמון שיעורים** -- לוח שנה שבועי, שיעורי החזר, התראות אוטומטיות |
| Card 3 | **חיוב ותשלומים** -- חבילות שיעורים, חשבוניות, מע"מ, מלגות |
| Card 4 | **רפרטואר ובחינות** -- ספריית 5,000+ יצירות, מעקב התקדמות, ציוני בחינות |

### Page 5: What to Expect Next

| Element | Content |
|---------|---------|
| **Title** | מה הלאה? |
| **Timeline** | |
| Phase 1 | סביבת הדגמה -- עכשיו -- חקור את המערכת עם נתונים לדוגמה |
| Phase 2 | משוב ותיקונים -- 2-4 שבועות -- נשמע ממך ונתאים |
| Phase 3 | הגדרת הנתונים שלך -- לאחר אישור -- יבוא נתונים אמיתיים |
| Phase 4 | השקה חיה -- לפי תיאום -- מעבר למערכת בפועל |

### Page 6: Contact & Support

| Element | Content |
|---------|---------|
| **Title** | צור קשר |
| **Email** | support@harmonia.co.il |
| **Phone** | [Project lead phone number -- placeholder] |
| **Hours** | ימים א'-ה' 09:00-17:00 |
| **In-app** | לחץ על סימן השאלה בתחתית המסך לעזרה מובנית |
| **Feedback** | "נשמח לשמוע ממך! השתמש בטופס המשוב בתפריט ההגדרות." |

### Presentation Checklist

- [ ] Create slides in Google Slides / Canva / Figma (RTL layout)
- [ ] Take actual screenshots from the staging environment
- [ ] Export as PDF (A4 landscape)
- [ ] Save as `docs/guides/harmonia-admin-intro-he.pdf`
- [ ] Create English version: `docs/guides/harmonia-admin-intro-en.pdf`
- [ ] Attach to welcome email or host on a public URL
- [ ] Review with project lead before distribution

---

## 4. Legal Review Checklist for Demo

### 4.1 Synthetic Data Verification

Before any admin touches the demo, verify that NO real PII is present:

- [ ] **Student names** -- confirm all names in `src/lib/data.ts` are fictional (they are: e.g. "David HaMelech", "Miriam Cohen")
- [ ] **Parent names** -- confirm all parent names are fictional
- [ ] **ID numbers** -- confirm no real Israeli ID numbers (ת"ז) appear anywhere in mock data
- [ ] **Email addresses** -- confirm all emails use `@example.com` or similar non-deliverable domains
- [ ] **Phone numbers** -- confirm all phone numbers are fictional (050-000-XXXX pattern)
- [ ] **Teacher names** -- the 71 directory teachers use real names from conservatorium websites; verify these are publicly available information (they are: staff listings on public websites)
- [ ] **Conservatorium admin data** -- `constadmin.json` contains real manager names, emails, and phone numbers; this data must NOT appear in the demo UI visible to other admins (each admin should only see their own conservatorium)

### 4.2 Demo Disclaimer Banner

Add a persistent banner to the staging environment that cannot be dismissed:

**Implementation:**
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

### 4.3 Privacy Notice for Admin Testers

Create a notice that admins must acknowledge before using the demo:

**Text (Hebrew):**

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

### 4.4 Data Retention Policy for Demo

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

### 4.5 Consent Form for Admin Testers

Admins exploring the demo will provide feedback. Collect consent:

**Text:**
> בלחיצה על "כניסה לסביבת ההדגמה", אני מסכים/ה:
> - [ ] לשימוש בסביבת ההדגמה בהתאם לתנאים שלעיל
> - [ ] לאיסוף משוב שאספק (טקסט, הערות, דיווחי באגים) לצורך שיפור הפלטפורמה
> - [ ] לאיסוף נתוני שימוש אנונימיים (דפים, לחיצות)

- [ ] Add consent checkboxes to demo gate page
- [ ] Store consent records in database (reuse existing `ConsentRecord` type)
- [ ] Log consent timestamp and IP for audit trail

### 4.6 Terms of Use for Demo Access

A lightweight TOU for the demo environment (separate from the full production TOS):

- [ ] Draft demo TOU covering:
  - Permitted use: evaluation only, no production data
  - Prohibited use: no real PII, no scraping, no vulnerability testing without authorization
  - No warranty: demo is provided "as is" with no SLA
  - Data loss: user accepts that data may be reset
  - Intellectual property: all platform IP remains Lyriosa's property
  - Confidentiality: admin agrees not to share screenshots or data with competitors
  - Termination: Lyriosa may revoke demo access at any time
- [ ] Add TOU link to demo gate page
- [ ] Add TOU acceptance to consent form

### 4.7 Cross-Reference: LEGAL-READINESS.md Compliance

Current score from `docs/operations/LEGAL-READINESS.md`: **85/100**

| Area | Demo Impact | Action for Demo |
|------|-------------|-----------------|
| PDPPA | Demo uses synthetic data -- lower risk | Add demo disclaimer |
| Consumer Protection | No real transactions in demo | N/A for demo |
| Accessibility | Same code as production | Ensure accessibility panel works |
| Contractual | Demo TOU suffices | Draft lightweight TOU |
| IP | Same compositions library | Metadata only -- no risk |
| Digital Signatures | Demo signatures are tests | Add "demo" watermark to signed PDFs |
| Data Residency | Staging may use different region | Document staging data location |

---

## 5. OAuth Setup Guide (Google + Microsoft)

> Reference: `docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md` and `docs/AUTH_PROVIDERS.md`

### 5.1 Google Sign-In Setup

#### Step 1: Create Google Cloud Project

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a new project: `harmonia-production` (or use existing Firebase project)
- [ ] Enable the **Google Identity** API:
  - APIs & Services > Library > search "Google Identity" > Enable

#### Step 2: Create OAuth Credentials

- [ ] Go to APIs & Services > Credentials
- [ ] Click "Create Credentials" > "OAuth client ID"
- [ ] Application type: **Web application**
- [ ] Name: `Lyriosa Web Client`
- [ ] Authorized JavaScript origins:
  ```
  https://harmonia.web.app
  https://harmonia-staging.web.app
  http://localhost:9002    (for local dev)
  ```
- [ ] Authorized redirect URIs:
  ```
  https://harmonia.web.app/__/auth/handler
  https://harmonia-staging.web.app/__/auth/handler
  http://localhost:9002/__/auth/handler
  ```
- [ ] Copy the **Client ID** and **Client Secret**

#### Step 3: Configure in Firebase

- [ ] Go to Firebase Console > Authentication > Sign-in method
- [ ] Click "Google" > Enable
- [ ] Paste the Web Client ID from Step 2
- [ ] Paste the Web Client Secret from Step 2
- [ ] Save

#### Step 4: Configure OAuth Consent Screen

- [ ] Go to APIs & Services > OAuth consent screen
- [ ] User type: **External** (for production) or **Internal** (for Google Workspace orgs)
- [ ] App name: `Lyriosa`
- [ ] User support email: `support@harmonia.co.il`
- [ ] Developer contact email: `dev@harmonia.co.il`
- [ ] Scopes: `email`, `profile`, `openid`
- [ ] If External: submit for verification (required for 100+ users)

### 5.2 Microsoft (Azure AD) Sign-In Setup

#### Step 1: Register App in Azure AD

- [ ] Go to [Azure Portal](https://portal.azure.com)
- [ ] Navigate to Azure Active Directory > App registrations
- [ ] Click "New registration"
  - Name: `Lyriosa`
  - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
  - Redirect URI: `https://harmonia.web.app/__/auth/handler` (Web platform)
- [ ] Copy the **Application (client) ID**

#### Step 2: Create Client Secret

- [ ] In the app registration, go to Certificates & secrets
- [ ] Click "New client secret"
- [ ] Description: `Lyriosa Firebase Auth`
- [ ] Expiry: 24 months (set calendar reminder to rotate)
- [ ] Copy the **Secret Value** (shown only once)

#### Step 3: Configure API Permissions

- [ ] Go to API permissions
- [ ] Add permissions:
  - Microsoft Graph > Delegated > `email`
  - Microsoft Graph > Delegated > `openid`
  - Microsoft Graph > Delegated > `profile`
  - Microsoft Graph > Delegated > `User.Read`
- [ ] Click "Grant admin consent" (if you are a tenant admin)

#### Step 4: Add Redirect URIs

- [ ] Go to Authentication > Add platform > Web
- [ ] Add redirect URIs:
  ```
  https://harmonia.web.app/__/auth/handler
  https://harmonia-staging.web.app/__/auth/handler
  http://localhost:9002/__/auth/handler
  ```
- [ ] Check: "ID tokens" and "Access tokens" under Implicit grant

#### Step 5: Configure in Firebase

- [ ] Go to Firebase Console > Authentication > Sign-in method
- [ ] Click "Microsoft" > Enable
- [ ] Paste the Application (client) ID from Step 1
- [ ] Paste the Client Secret from Step 2
- [ ] Save

### 5.3 Supabase OAuth (Alternative Auth Provider)

If using `AUTH_PROVIDER=supabase` instead of Firebase:

#### Google
- [ ] Go to Supabase Dashboard > Authentication > Providers > Google
- [ ] Enable Google provider
- [ ] Paste Client ID and Client Secret from Google Cloud Console
- [ ] Authorized redirect URL (copy from Supabase): `https://xxxx.supabase.co/auth/v1/callback`
- [ ] Add this URL to Google Cloud Console > Authorized redirect URIs

#### Microsoft
- [ ] Go to Supabase Dashboard > Authentication > Providers > Azure
- [ ] Enable Azure provider
- [ ] Paste Client ID and Client Secret from Azure Portal
- [ ] Authorized redirect URL: `https://xxxx.supabase.co/auth/v1/callback`
- [ ] Add this URL to Azure Portal > Redirect URIs

### 5.4 OAuth Verification Checklist

- [ ] Test Google sign-in on localhost
- [ ] Test Microsoft sign-in on localhost
- [ ] Test Google sign-in on staging URL
- [ ] Test Microsoft sign-in on staging URL
- [ ] Verify new OAuth user lands on "Complete registration" wizard
- [ ] Verify existing email user can link Google account
- [ ] Verify existing email user can link Microsoft account
- [ ] Verify admin accounts (role `conservatorium_admin`) work with OAuth
- [ ] Verify OAuth popup works on mobile browsers
- [ ] Verify error handling: "account exists with different credential"
- [ ] Rotate client secrets before production launch

### 5.5 OAuth Security Notes

| Concern | Mitigation |
|---------|-----------|
| Admin self-registration | OAuth login does NOT auto-create admin accounts. Admins must be pre-created by `site_admin`. OAuth only _logs in_ to existing admin accounts. |
| Token storage | Firebase/Supabase SDKs handle token refresh. No manual token storage needed. |
| Client secret exposure | Client secrets are stored server-side only (Firebase config or Supabase server). Never exposed in client bundle. |
| Consent screen | Google requires verification for apps with 100+ users. Apply early (takes 2-6 weeks). |
| Microsoft tenant | Using "Any organizational directory + personal accounts" allows all Microsoft users. Restrict to specific tenants if needed. |

---

## 6. Demo Gate Options Comparison

> Reference: `docs/product/DEMO-ACCESS.md` (full implementation details for Option C)

### 6.1 Comparison Table

| Option | Mechanism | Pros | Cons | Effort | Recommendation |
|--------|-----------|------|------|--------|----------------|
| **A: Vercel Password Protection** | Vercel's built-in deployment protection with a single shared password | Free on Pro plan; zero code; instant setup | Only 1 password for all 85 admins; no per-conservatorium tracking; requires Vercel (second hosting provider); admins share same password | ~5 min | Good for **Phase 1** (internal testing only) |
| **B: Firebase Preview Channel + Basic Auth** | Deploy to Firebase Hosting preview channel with `DEMO_PASSWORD` env var checked in proxy | Free; auto-expires; easy reset by redeploying | Single shared password; URL guessable if leaked; no per-conservatorium tracking | ~15 min | Good for **Phase 1** (internal testing) |
| **C: Firebase + Custom Invite Token Gate** | Per-conservatorium tokens in `DEMO_TOKENS` env var; proxy checks `demo-access` cookie; gate page for token entry | Per-conservatorium tracking; personalized URLs; revocable tokens; reuses existing Firebase infra; no third-party dependency | ~30 min implementation; requires managing 85 tokens | ~30 min | **Best for final demo** (recommended in DEMO-ACCESS.md) |

### 6.2 Recommended Rollout Strategy

```
Phase 0 (Internal QA)     → Option B: single password, Firebase preview channel
                             Password: shared among dev team only
                             Duration: 1-2 weeks

Phase 1 (Pilot: 5 admins) → Option C: per-conservatorium tokens for 5 pilot admins
                             Generate 5 tokens, send personalized invite URLs
                             Collect feedback, fix critical issues
                             Duration: 2 weeks

Phase 2 (Full demo: 85)   → Option C: extend to all 85 conservatoriums
                             Generate 85 tokens, send via welcome email
                             Track which admins are actively using the demo
                             Duration: 4-8 weeks

Phase 3 (Production)      → Remove demo gate entirely
                             Migrate admin accounts to production Firebase project
                             Real Firebase Auth (email/password + OAuth)
```

### 6.3 Token Generation Script (for Option C)

```bash
#!/bin/bash
# scripts/generate-demo-tokens.sh
#
# Generates DEMO_TOKENS env var value for all 85 conservatoriums.
# Output: comma-separated "cons-{id}:{token}" pairs.

echo "# Paste this into your staging .env file:"
echo -n "DEMO_TOKENS="

for i in $(seq 1 85); do
  TOKEN=$(openssl rand -hex 4)
  if [ $i -gt 1 ]; then echo -n ","; fi
  echo -n "cons-${i}:${TOKEN}"
done

echo ""
echo ""
echo "# Invite URLs (send to each admin):"
for i in $(seq 1 85); do
  TOKEN=$(openssl rand -hex 4)
  echo "cons-${i}: https://harmonia-staging.web.app?invite=${TOKEN}"
done
```

**Note:** The script above generates tokens twice (once for env var, once for URLs). For a consistent set, save the tokens to a file first:

```bash
# Better version: consistent tokens
#!/bin/bash
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

### 6.4 Demo Gate Implementation Checklist

All implementation code is provided in `docs/product/DEMO-ACCESS.md`. Follow these steps:

- [ ] Add `DEMO_TOKENS` env var to staging Firebase/Vercel config
- [ ] Add demo gate logic to `src/proxy.ts` (code in DEMO-ACCESS.md section 3.2)
- [ ] Create `src/app/[locale]/demo-gate/page.tsx` (code in DEMO-ACCESS.md section 3.3)
- [ ] Create `src/app/api/demo-verify/route.ts` (code in DEMO-ACCESS.md section 3.4)
- [ ] Generate tokens using the script above
- [ ] Test: visit staging URL without token -- should redirect to demo gate
- [ ] Test: visit staging URL with `?invite=valid-token` -- should set cookie and proceed
- [ ] Test: visit staging URL after cookie set -- should proceed without gate
- [ ] Test: visit staging URL with `?invite=invalid-token` -- should show error
- [ ] Deploy to staging
- [ ] Send invite URLs to pilot admins

---

## Appendix A: File Reference

| File | Purpose |
|------|---------|
| `docs/data/constadmin.json` | Source of truth for 85 conservatorium admin records |
| `docs/data/admin-credentials.json` | Generated: admin login credentials (DO NOT COMMIT) |
| `docs/product/DEMO-ACCESS.md` | Full demo gate architecture and implementation code |
| `docs/operations/LEGAL-READINESS.md` | Legal compliance assessment (score: 85/100) |
| `docs/legal/standard-registration-agreement-draft.md` | Standard enrollment contract (Hebrew, draft) |
| `docs/legal/conservatorium-policies-analysis.md` | Analysis of 13 conservatorium bylaws |
| `docs/legal/standardized-price-model.md` | Recommended pricing defaults from PDF corpus |
| `docs/contracts/MSA-TEMPLATE.md` | MSA skeleton for lawyer review |
| `docs/AUTH_PROVIDERS.md` | Auth provider configuration (Firebase / Supabase / dev) |
| `docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md` | OAuth integration design document |
| `docs/product/User-Guide.md` | End-user guide (8 personas) |
| `docs/operations/DEPLOYMENT.md` | Deployment guide (local, staging, production) |

## Appendix B: Pre-Launch Legal Checklist Summary

Extracted from `docs/operations/LEGAL-READINESS.md` -- items relevant to the demo phase:

### Must Complete Before Demo Launch

- [ ] Verify NO real student PII in demo data
- [ ] Add demo disclaimer banner to staging
- [ ] Draft demo Terms of Use
- [ ] Add privacy notice to demo gate page
- [ ] Generate and distribute admin credentials securely
- [ ] Test demo gate with 3 pilot admins

### Must Complete Before Production Launch

- [ ] Register database with Israeli Registrar of Databases
- [ ] Appoint Data Security Officer (DPO)
- [ ] Complete security risk assessment
- [ ] Have MSA template reviewed by Israeli lawyer
- [ ] Draft production Terms of Service
- [ ] Have Privacy Policy reviewed by privacy lawyer
- [ ] Create DPA template for conservatoriums
- [ ] Commission WCAG 2.1 AA accessibility audit
- [ ] Sign DPAs with sub-processors (Firebase, Cardcom, Twilio, SendGrid)
- [ ] Deploy Firestore Security Rules with tenant isolation
- [ ] Confirm Firebase data residency (europe-west1 or me-central1)
- [ ] Obtain professional liability (E&O) and cyber liability insurance
- [ ] Set up Google OAuth consent screen verification (2-6 weeks lead time)
- [ ] Set up Microsoft Azure AD app registration

---

*This guide was produced by the UX & Legal Agent. All scripts should be tested in a non-production environment before use. Legal sections require review by qualified Israeli legal counsel.*
