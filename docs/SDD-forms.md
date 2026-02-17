# Forms - System Design Document

This document outlines the specifications for the different forms within the הרמוניה application.

## 1. General Principles

- **Role-Based Access Control (RBAC):** Form access, creation, and editing are strictly controlled by user roles.
- **Data Pre-population:** To ensure data integrity and improve user experience, forms should be pre-populated with user and institutional data wherever possible.
- **Form Status Workflow:** All forms follow a defined status lifecycle: `טיוטה` -> `ממתין לאישור מורה` -> `ממתין לאישור מנהל` -> `מאושר` / `נדחה`.

## 2. User Roles & Permissions

- **Student:**
    - Can create **only** "Recital" forms.
    - Can only create forms for themselves. All personal data is pre-filled and read-only.
    - Can view and edit their own forms in `טיוטה` (Draft) status.
    - Can view the status of their submitted forms.
    - Cannot see forms or data belonging to other students.

- **Teacher:**
    - Can create "Recital" and "Conference" forms on behalf of their assigned students.
    - When creating a form, they must select a student from a list of *their* students. All of the selected student's data is then pre-filled and locked.
    - Can view all forms submitted by their students.
    - Can approve forms, moving them from `ממתין לאישור מורה` to `ממתין לאישור מנהל`.
    - Can edit forms submitted by their students.

- **Conservatorium Admin:**
    - Has all the permissions of a Teacher for all students within their conservatorium.
    - Is the final approval authority for all forms within their conservatorium.
    - Can move a form status to `מאושר` (Approved) or `נדחה` (Rejected).
    - Can create and manage "Conference" forms for the entire conservatorium.
    - Can add/manage "Delegated Admins" who can assist with form management but not final approval.

- **Site Admin:**
    - Has super-user permissions.
    - Can view, create, edit, and manage all forms for all users and all conservatoriums.
    - Can manage Conservatorium Admins.
    - Responsible for managing system-wide templates and forms (future feature).

## 3. Form Types

### 3.1. Recital Form (`טופס רסיטל בגרות`)

This form is for individual student recital submissions.

**Key Fields:**
- Academic Year (pre-filled to current)
- Grade (י, יא, יב)
- Student Details (pre-filled, locked)
- School Details (pre-filled, locked)
- Instrument & Teacher Details (pre-filled, locked)
- Repertoire List (user-input)
- Additional music details (e.g., "preparing for recital in area of...")

### 3.2. Conference / Event Form (`טופס פרטי משתתף בכנס`)

This form is for group participation in events like workshops, orchestra gatherings, etc.

**Key Fields:**
- Event Details (Name, Date, Location)
- Host Details (Conservatorium, Manager)
- Group/Ensemble Details (Conductor, Accompanist, Number of participants)
- Program/Repertoire for the event
- Logistical Needs (Special equipment, stage setup)

## 4. Future Features

- **Digital Signatures:** A system for cryptographic or verifiable signatures for approvals.
- **Dynamic Form Builder:** A tool for Site Admins to create and edit form templates without code changes.
- **Repertoire Database:** Integration with an API or internal database for composers and compositions to ensure data consistency and provide autocomplete suggestions.
