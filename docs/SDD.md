# הרמוניה - System Design Document

## 1. Introduction

הַרמוֹנְיָה is a web-based management system for music conservatoriums in Israel. It streamlines the process of submitting, managing, and approving various musical performance forms, such as recitals and event participation.

The system is designed with a clear hierarchy of user roles and permissions to ensure data security and a smooth workflow.

## 2. System Architecture

- **Frontend:** Next.js, React, TypeScript
- **UI Components:** shadcn/ui, Tailwind CSS
- **Styling:** Tailwind CSS with CSS-in-JS for dynamic parts. The application is built to be Right-to-Left (RTL) first.
- **Backend (Mocked):** Application logic currently uses mock data located in `src/lib/data.ts`.
- **AI Features:** Genkit for intelligent suggestions (e.g., repertoire).

## 3. User & Data Management

### 3.1. User Roles

The system defines four primary user roles:
1.  **Student (`student`):** The end-user who participates in recitals. Limited permissions.
2.  **Teacher (`teacher`):** Manages a roster of students. Can submit forms on their behalf and provide the first level of approval.
3.  **Conservatorium Admin (`conservatorium_admin`):** Manages an entire conservatorium, including all teachers and students within it. Provides the final approval for forms.
4.  **Site Admin (`site_admin`):** A super-user with access to all data across all conservatoriums. Responsible for system administration.

### 3.2. Data Models

Core data models are defined in `src/lib/types.ts`.
- **User:** Represents a user account. Contains personal details, role, and associations (e.g., a teacher's list of student IDs).
- **FormSubmission:** Represents a single form submission. Contains all data related to the form, its status, and the associated user.
- **Conservatorium:** Represents a music institution.
- **School:** Represents a general education school that students attend.

### 3.3. Registration & Authentication

- **Registration:**
    - Students and Teachers can self-register. Their accounts are placed in a pending state until approved by a Conservatorium Admin.
    - Israeli ID numbers are validated using a checksum algorithm.
    - Conservatorium Admins cannot self-register; they must be created by a Site Admin.
- **Authentication:**
    - The current system uses a mock login.
    - Future implementation will use Firebase Authentication with providers like Email/Password, Google, and Magic Links.

## 4. Core Features

- **Dashboard:** A central hub displaying relevant statistics and recent activity based on the user's role.
- **Form Management:** A comprehensive system for creating, viewing, filtering, and managing submissions.
- **Approval Workflow:** A multi-step approval process from Teacher to Conservatorium Admin.
- **User Management:** (Admin-only) A page to view and manage all users in the system.
- **Library:** (Future Feature) A repository for musical scores, learning materials, and other resources.
- **AI-Powered Suggestions:** An integrated Genkit flow suggests musical compositions to assist with form filling.

## 5. UI/UX Principles

- **RTL First:** All components and layouts are designed with Right-to-Left (Hebrew) language support as the primary consideration. Logical CSS properties (`margin-inline-start`, `text-align: end`) are used over directional ones.
- **Responsive Design:** The application is responsive and functional across devices, from mobile to desktop.
- **Clarity and Consistency:** The UI aims for a clean, consistent, and intuitive user experience, with stable layouts and clear navigation.
