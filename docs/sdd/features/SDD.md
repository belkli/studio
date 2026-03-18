# הרמוניה - System Design Document

## 1. Introduction

**הַרמוֹנְיָה (Lyriosa)** is a modern, web-based management system designed to streamline the administrative processes for music conservatoriums in Israel. It provides a centralized platform for students, teachers, and administrators to manage the submission, review, and approval of various musical performance forms, primarily focusing on recital and conference/event participation.

The system is built with a clear user role hierarchy, a structured workflow for form approvals, and intelligent features to enhance user experience, such as a searchable composition library and automated calculations.

---

## 2. System Architecture

-   **Frontend:** Next.js (App Router), React, TypeScript
-   **UI Library:** shadcn/ui, providing a consistent and accessible component library.
-   **Styling:** Tailwind CSS, configured for a Right-to-Left (RTL) first approach to natively support Hebrew.
-   **State Management:** React Hooks and Context API for global state like authentication (`useAuth`).
-   **Form Handling:** React Hook Form with Zod for robust validation.
-   **AI Features:** Genkit for AI-powered features, currently used for suggesting musical compositions.
-   **Backend (Mocked):** The application currently operates with a mock backend. All data (users, forms, compositions) is sourced from static files in `src/lib/data.ts`. The architecture is designed for a future transition to a real backend (e.g., Firebase).

---

## 3. Core Concepts & Models

### 3.1. User Roles & Permissions

The system is built around a clear Role-Based Access Control (RBAC) model.

| Role | Key Permissions |
| :--- | :--- |
| **Student** (`student`) | - Can create and edit their own Recital forms in `טיוטה` (Draft) status.<br>- Cannot create forms for other users or of other types.<br>- Can view the status of their submitted forms. |
| **Teacher** (`teacher`) | - Can create Recital and Conference forms on behalf of their assigned students.<br>- Can view all forms submitted by their students.<br>- Can approve Recital forms, moving them to the next stage (`ממתין לאישור מנהל`). |
| **Conservatorium Admin** (`conservatorium_admin`)| - Has all permissions of a Teacher for *all* students within their conservatorium.<br>- Is the final approval authority for all forms.<br>- Manages user registration requests (approval/rejection) for their conservatorium. |
| **Site Admin** (`site_admin`) | - Super-user with full permissions across all conservatoriums.<br>- Manages Conservatorium Admins.<br>- Can view, edit, and manage all data in the system. |

### 3.2. Data Models

-   **`User`**: Represents any user of the system. Contains personal details, `role`, conservatorium affiliation, and relationships (e.g., a teacher's list of student IDs).
-   **`FormSubmission`**: The central data model for any form. Contains form type, student details, status, submission date, a `repertoire` array of `Composition` objects, and approval history.
-   **`Composition`**: Represents a musical piece, with fields for `composer`, `title`, `duration`, and `genre`.
-   **`Conservatorium`**: Represents a music institution, including its name and pricing tier (`A`, `B`, or `C`).
-   **`Notification`**: (Mocked) Represents an in-app notification for a user.

### 3.3. Form Status Workflow

All forms follow a defined lifecycle, indicated by their `status`:

1.  **`טיוטה` (Draft):** The form is being edited by the creator and has not been submitted.
2.  **`ממתין לאישור מורה` (Pending Teacher Approval):** A Recital form submitted by a student, awaiting review from their teacher.
3.  **`ממתין לאישור מנהל` (Pending Admin Approval):** A form approved by a teacher (or a Conference form submitted directly), awaiting final approval from the Conservatorium Admin.
4.  **`מאושר` (Approved):** The form has received final approval from the Conservatorium Admin.
5.  **`נדחה` (Rejected):** The form was rejected at either the teacher or admin stage.

---

## 4. Features & Functionality

### 4.1. Authentication & User Management

-   **Registration (`/register`):** A multi-step form allows users to register as a Student or Teacher. Accounts are created with an `approved: false` status.
-   **Login (`/login`):** A mock login system authenticates users based on their email. It correctly handles approved users, pending users, and non-existent users.
-   **User Approval Workflow (`/dashboard/users`):**
    -   Conservatorium Admins have a dedicated interface to view pending registration requests.
    -   Admins can approve or reject new users. Upon approval, the user gains access to the system.
-   **User Editing:** Admins can edit details for users within their scope.

### 4.2. Form Creation (`/dashboard/forms/new`)

-   **Form Type Selection:** Teachers and Admins can choose to create a "Recital" form or a "Conference/Event" form. Students are restricted to creating Recital forms for themselves.
-   **Student Selection:** When a Teacher or Admin creates a Recital form, they must first select a student from a searchable list of users they manage. The student's data is then automatically pre-filled and locked.

### 4.3. Recital Form (`recital-form.tsx`)

-   **Pre-filled Data:** All student-related fields (personal info, school, instrument, teacher) are automatically populated and disabled to ensure data integrity.
-   **Repertoire Management:**
    -   Users can add, remove, and edit compositions in a structured list.
    -   **Searchable Fields:** Both "Composer" and "Composition" fields are backed by a searchable `Combobox` component, allowing users to quickly find pieces from the mock database.
    -   **Field Dependencies:** The "Composition" search is automatically filtered by the selected "Composer".
-   **Real-time Duration Calculation:** The total performance duration is automatically summed as the user fills out the repertoire.
-   **Duration Validation:** The system displays a contextual warning if the total duration is outside the recommended range for the student's grade level.
-   **Auto-Save:** A sticky status bar indicates when changes are unsaved and allows the user to manually save a draft.

### 4.4. Conference/Event Form (`kenes-form.tsx`)

-   **Form Structure:** Includes dedicated sections for Event Details, Ensemble Details, and Logistical Needs.
-   **Repertoire Management:** Utilizes the same robust, searchable repertoire management component as the Recital form for a consistent user experience.
-   **Automated Price Calculation:**
    -   The system automatically calculates the participation fee in real-time.
    -   The calculation is based on a price matrix using three factors: **Conservatorium Tier**, **Number of Participants** (Ensemble Size), and **Total Performance Duration**.
    -   A summary box clearly displays the inputs and the final calculated price.
-   **Auto-Save:** Includes the same "Save Draft" functionality.

### 4.5. Form Management & Approval (`/dashboard/forms` & `/dashboard/approvals`)

-   **Centralized List:** The `/dashboard/forms` page provides a filterable and searchable list of all forms accessible to the logged-in user.
-   **Dedicated Approval Queue:** The `/dashboard/approvals` page provides a focused view for Teachers and Admins to see only the forms awaiting their action.
-   **Detailed Form View (`/dashboard/forms/[id]`):**
    -   Displays all form data in a read-only format.
    -   Shows a step-by-step approval history.
    -   Provides role-based action buttons (Approve, Reject, Sign).
-   **Digital Signature Capture:** For final admin approval, a dialog opens with a canvas element, allowing the admin to provide a handwritten signature.
-   **PDF Generation:** Once a form is approved and signed, a "Download PDF" button appears. This generates a professional, RTL-formatted PDF of the form, including the captured signature and the conservatorium's official stamp.

---

## 5. UI/UX Principles

-   **RTL-First:** All layouts, text alignment, and components are designed for Hebrew.
-   **Responsive Design:** The application is fully responsive and provides a seamless experience on desktop, tablet, and mobile devices.
-   **Component-Based:** Built with reusable components from `shadcn/ui` for a consistent and professional look.
-   **Clear Visual Feedback:** The system provides constant feedback through:
    -   **`StatusBadge`**: Color-coded badges for form statuses.
    -   **`Toaster`**: Non-intrusive notifications for actions (e.g., "Form saved").
    -   **`SaveStatusBar`**: A sticky bar that clearly shows the save state of a draft form.
    -   **`Notice`**: Contextual information and warning boxes to guide the user.

---

## 6. Future Enhancements (Appendix)

This section outlines planned features that would transition the application from a mock-data prototype to a production-ready system.

-   **Firebase Backend Integration:**
    -   **Firestore:** Replace all mock data from `src/lib/data.ts` with live Firestore collections for users, forms, etc.
    -   **Firebase Authentication:** Implement a full authentication solution to replace the mock login.
    -   **Firebase Storage:** Store uploaded files, such as digital signatures and conservatorium stamps.
-   **Full-Fledged Notification System:**
    -   Implement real-time in-app notifications (e.g., using a bell icon in the header).
    -   Integrate an email service (e.g., via Firebase Extensions) to send email alerts for critical events.
-   **Composition Library Management:**
    -   Create an admin interface for managing the composition library (approving user submissions, editing entries, bulk importing).
    -   Integrate with an external API (like Open Opus) to enrich the library.
-   **Dynamic Form Builder:** A tool for Site Admins to create and modify form templates without code changes.
-   **Digital Signatures:** Store captured signature images in Firebase Storage and link them to the form document.
-   **Advanced Reporting & Analytics:** A dedicated section for admins to view financial reports, usage statistics, and other insights.
