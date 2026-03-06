# SDD-01: Identity, Family & Role Management

**Module:** 01  
**Dependencies:** None (foundational)  
**Priority:** P0 — Must ship first

---

## 1. Overview & Rationale

The identity layer is the foundation of the entire system. It must handle a unique challenge: the same conservatorium serves children (whose parents pay and consent), teenagers (who increasingly manage their own musical life), and adult students — all needing different experiences and permission levels. Simultaneously, teachers and administrators need fine-grained access control without overlap.

This module defines every user type, how they authenticate, how families are linked, and how the system respects Israeli privacy norms while enabling self-service.

---

## 2. User Roles

### 2.1 Role Taxonomy

```
SITE_ADMIN
└── CONSERVATORIUM_ADMIN
    ├── TEACHER
    │   └── STUDENT_OVER_13 (has own login)
    │   └── STUDENT_UNDER_13 (no login — managed via parent)
    └── PARENT
        └── STUDENT_UNDER_13 (child profile, no login)
        └── STUDENT_OVER_13 (linked but autonomous)
```

### 2.2 Role Definitions

| Role | Auth | Can Login | Key Capabilities |
|------|------|-----------|-----------------|
| `SITE_ADMIN` | Email+Password | ✅ | Full access across all conservatoriums. Manages admins. |
| `CONSERVATORIUM_ADMIN` | Email+Password | ✅ | Full access within their conservatorium. Approves forms, manages users, views reports. |
| `TEACHER` | Email+Password | ✅ | Manages own schedule, students, attendance, lesson notes, forms for their students. |
| `PARENT` | Email+Password | ✅ | Registers children, pays invoices, books lessons, views child progress. Cannot see other families' data. |
| `STUDENT_OVER_13` | Email+Password | ✅ | Books lessons, submits forms, views own schedule and practice log, messages teacher. |
| `STUDENT_UNDER_13` | N/A | ❌ | Virtual profile only. All actions performed by linked Parent. |

### 2.3 Age-Gate Logic

- **Source of truth:** `User.dateOfBirth`
- **Under 13:** Profile is created by a `PARENT`. No email, no login, no direct SMS. All notifications go to `PARENT`.
- **Turning 13:** A Cloud Function runs nightly. When a `STUDENT_UNDER_13` turns 13, it triggers the **Age-Upgrade Flow**:
  1. Parent receives an in-app notification and email: *"[Child name] has turned 13. Invite them to manage their own account?"*
  2. Parent can choose: **Invite Now** | **Keep Managing for Now** | **Remind in 30 days**
  3. If **Invite Now**: system sends onboarding email to child's email address (collected at this step). Child sets a password. Role upgrades to `STUDENT_OVER_13`.
  4. Parent retains financial control (invoices, payment methods) even after upgrade.
- **Over 18:** Student is fully independent. Parent link is optionally retained for family billing.

---

## 3. Authentication

### 3.1 Methods

| Method | Used By | Notes |
|--------|---------|-------|
| Email + Password | All logged-in roles | Firebase Auth |
| Google OAuth | Optional for all | Especially useful for teachers already using Google Workspace |
| Magic Link (Email) | Parents with low tech comfort | One-click login from email |
| Phone OTP (SMS) | `STUDENT_OVER_13`, `PARENT` | Fallback when email access is difficult. Via Twilio. |

### 3.2 Registration Flows

**Flow A: Parent Registering a Child**
1. Parent visits `/register`
2. Selects "I am registering my child"
3. Fills: Parent personal details + payment info
4. Fills: Child details (name, DOB, instrument interest, school)
5. System checks DOB → creates `STUDENT_UNDER_13` profile linked to Parent
6. Admin approval queue notified
7. Parent receives confirmation email with pending status

**Flow B: Student 13+ Self-Registering**
1. Student visits `/register`
2. Selects "I am registering myself"
3. Fills: personal details, DOB, instrument, school
4. Optionally adds parent's email (required if under 18 for payment consent)
5. System creates `STUDENT_OVER_13` profile
6. If parent email provided, parent receives "Consent & Payment Setup" email
7. Admin approval queue notified

**Flow C: Teacher Self-Registering**
1. Teacher visits `/register/teacher`
2. Fills: professional details, instruments, grade levels, bio, hourly rate preference
3. Uploads: profile photo, teaching license (optional)
4. Admin approves before access is granted

### 3.3 Pending Approval State

All new accounts land in `approved: false`. The system handles this gracefully:
- Login succeeds but redirects to `/pending-approval` page
- Page shows: estimated wait time, contact info, what to do next
- Admin gets a notification badge on their dashboard

---

## 4. Family Portal

### 4.1 Multi-Child Management

A parent with multiple children sees a **Family Hub** at `/dashboard/family`:
- One card per child showing: upcoming lessons, balance, pending forms
- Single monthly invoice combining all children's charges
- Quick-switch between child views
- One payment method on file covers all children

### 4.2 Consent Ledger (`ConsentLedger`)

```typescript
{
  id: string;
  studentId: string;         // STUDENT_OVER_13
  parentId: string;
  consentType: ConsentType;  // PHONE_FOR_SMS | PHOTO_PUBLICATION | TRIP_PERMISSION | ...
  grantedAt: Timestamp;
  revokedAt?: Timestamp;
  documentUrl?: string;      // signed PDF stored in Firebase Storage
}
```

For every sensitive data or permission (e.g., using a minor's phone number for SMS scheduling), a logged consent record is required.

### 4.3 Financial Responsibility Rules

| Student Age | Who Pays | Who Can Change Payment Method |
|-------------|----------|-------------------------------|
| Under 13 | Parent only | Parent only |
| 13–17 | Parent by default; student can co-pay from own card | Parent only |
| 18+ | Student (or parent if linked and agreed) | Student |

---

## 5. User Profile Pages

### 5.1 Student Profile (`/dashboard/profile`)
- Personal info, photo
- Instrument(s) and grade level
- Assigned teacher
- Package/credits summary
- Upcoming lessons preview
- Practice log summary (from Module 09)

### 5.2 Teacher Profile (`/dashboard/teacher/profile`)
- Bio, photo, teaching philosophy
- Instruments and specialties
- Availability grid (editable inline)
- Students roster summary
- Ratings average (future: from parent/student feedback)

### 5.3 Admin User Management (`/admin/users`)
- Paginated, searchable table of all users in the conservatorium
- Filters: Role, Status (Approved/Pending/Suspended), Instrument
- Inline approve/reject for pending users
- Edit modal for any user's details
- Bulk actions: Approve selected, Export CSV

---

## 6. Security Rules (Firestore)

```
users/{userId}:
  - read: userId == request.auth.uid 
          || isTeacherOf(userId) 
          || isAdminOf(userId.conservatoriumId)
  - write: userId == request.auth.uid (own fields only)
           || isAdminOf(userId.conservatoriumId)

families/{familyId}:
  - read/write: familyId.parentId == request.auth.uid
                || isAdminOf(conservatoriumId)
```

---

## 7. UI Components Required

| Component | Route | Description |
|-----------|-------|-------------|
| `RegistrationWizard` | `/register` | Multi-step form for all registration types |
| `PendingApprovalPage` | `/pending-approval` | Friendly holding page |
| `FamilyHub` | `/dashboard/family` | Multi-child overview |
| `UserTable` | `/admin/users` | Searchable admin user list |
| `AgeUpgradeModal` | Triggered by system | Parent prompt when child turns 13 |
| `ConsentDialog` | Various | Standardized consent capture |
| `ProfileEditor` | `/dashboard/profile` | Self-service profile editing |
