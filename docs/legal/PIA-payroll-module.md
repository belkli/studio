# Privacy Impact Assessment — Payroll Module

**Document version:** 1.0
**Date:** 2026-03-20
**Prepared by:** Lyriosa Engineering / Legal
**Status:** Draft — Requires review by Israeli legal counsel and DSO

---

## 1. Module Overview

The Lyriosa payroll module enables conservatorium administrators to:
- Generate monthly payroll reports for music teachers
- Export reports as CSV files compatible with Israeli payroll systems (Hilan, Merav Digital)
- View teacher compensation rates, lesson counts, overtime, and absences

---

## 2. Personal Data Processed

| Data Category | Fields | Legal Basis | Retention |
|---------------|--------|-------------|-----------|
| Teacher identity | Name, Israeli ID number (ת.ז.) | Contract performance (Section 18(a)(1), PDPPA) | Duration of employment + 7 years (tax law) |
| Work records | Lesson dates/times, duration, overtime hours | Contract performance | 7 years (Israeli Wage Protection Law) |
| Absences | Sick leave days, absence count | Contract performance | 7 years |
| Compensation rates | Rate per hour/lesson | Contract performance | Duration of employment |

---

## 3. Sensitive Data Risks

### 3.1 Israeli ID Numbers in CSV Export
**Risk:** CSV files containing Israeli national ID numbers (ת.ז.) are subject to PDPPA Chapter D-1 restrictions on transfer.
**Mitigation (implemented):**
- Confirmation dialog before export warns: "Export contains Israeli ID numbers — for payroll use only"
- CSV disclaimer header row: "שעות עבודה בפועל בלבד — אינו כולל זמן עבודה מחוץ לשיעורים. מסמך זה מכיל מספרי תעודת זהות — לשימוש שכר בלבד."
- Export logged to ComplianceLog: `{ exportedBy, timestamp, recordCount, includesIdNumbers: true }`

### 3.2 Access Control
**Risk:** Unauthorized access to payroll data.
**Mitigation:**
- Payroll export requires `conservatorium_admin` or `site_admin` role
- Tenant isolation: admins can only export data for their own conservatorium
- `site_admin` can scope to specific conservatoria via UI selector

### 3.3 Works Council Notification (if applicable)
**Requirement (Labor Relations Law, Section 24):** Employers using computerized attendance systems must notify the works council.
**Action required:** Conservatoria with 25+ employees must confirm they have notified their works council before enabling the attendance/payroll module. This is tracked as `onboardingChecklist.complianceConfirmed`.

---

## 4. Data Flows

```
Teacher lesson data → Supabase DB → Payroll report computation (client-side) → CSV export (client-side download)
```

No payroll data is transmitted to third-party processors for CSV generation. The CSV is generated client-side from data already loaded for the UI session.

---

## 5. Sub-processors

| Sub-processor | Purpose | Location | DPA |
|---------------|---------|----------|-----|
| Supabase | Database storage | EU (Frankfurt) | Supabase DPA (SCCs) |
| Vercel | Application hosting | Global CDN | Vercel DPA |

---

## 6. Rights of Data Subjects (Teachers)

Teachers may exercise the following rights under PDPPA:
- **Right to access:** View payroll records via teacher self-view in dashboard
- **Right to correction:** Request correction via conservatorium admin
- **Right to erasure:** Subject to 7-year tax/labor law retention requirements

Teachers can access their own payroll data via the teacher payroll view (`/dashboard/teacher/payroll`), which shows what data was included in the last payroll export.

---

## 7. Residual Risks

| Risk | Severity | Mitigation Status |
|------|----------|-------------------|
| CSV file forwarded to unauthorized parties | Medium | Warning in dialog + header; cannot be technically prevented |
| Works council notification missed by conservatoria | Low | Onboarding checklist item (not yet enforced) |
| Exported data cached in browser download history | Low | Acceptable — standard browser behavior |

---

## 8. Approval

This PIA must be reviewed by the appointed Data Security Officer before the payroll module is enabled for production use.

**DSO review date:** ___________
**DSO signature:** ___________
**Next review date:** 2027-03-20 (annual review)
