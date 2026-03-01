# Harmonia - Remaining Tasks for Production Launch

**Project Status:** The frontend and UI for all features specified in the System Design Documents (SDD-01 to SDD-17) are now complete. The application functions as a high-fidelity prototype running on mock data.

The following checklist outlines the necessary steps to transition the Harmonia prototype into a fully functional, production-ready application. These tasks primarily involve backend development and integration with live, third-party services.

---

## 1. Backend & Database Integration

The current `useAuth.tsx` hook serves as a mock backend. The next step is to replace this with a live Firebase backend.

*   [ ] **Connect to Firestore Database:**
    *   Replace all mock data arrays in `useAuth.tsx` (e.g., `mockUsers`, `mockLessons`, `mockFormSubmissions`) with real-time queries to Firestore collections.
    *   Utilize Firestore's real-time capabilities to ensure the UI updates instantly when data changes. The `backend.json` file provides the complete schema for this.

*   [ ] **Implement Write Operations:**
    *   Convert all data manipulation functions currently in `useAuth.tsx` (e.g., `addUser`, `updateForm`, `addLesson`) into asynchronous functions that perform Firestore write operations (`setDoc`, `addDoc`, `updateDoc`, `deleteDoc`).
    *   Ensure all write operations are secure and validate data according to the application's business logic.

*   [ ] **Enable Firebase Authentication:**
    *   Replace the mock email-based login system in `login-form.tsx` and `useAuth.tsx`.
    *   Implement a full Firebase Authentication solution to handle user sign-up, sign-in (including password and OAuth providers like Google), session management, and password resets.
    *   Integrate Firebase Auth state with the application's context to manage the currently logged-in user.

---

## 2. Live API Integrations

The prototype currently simulates interactions with external services. These must be connected to live APIs.

*   [ ] **Payment Gateway Integration (SDD-05):**
    *   Integrate the billing system with a real Israeli payment provider (e.g., **Cardcom**, **Tranzila**).
    *   Implement API calls for processing credit card payments for packages, ad-hoc lessons, and event tickets.
    *   Build out the logic for creating and managing recurring subscription charges.
    *   Securely handle payment tokens for card-on-file functionality.

*   [ ] **Two-Way Calendar Sync (SDD-03):**
    *   Integrate with the **Google Calendar API** and **Apple Calendar (CalDAV)**.
    *   Implement OAuth flows for teachers to securely connect their external calendars.
    *   Develop the background service (likely a Firebase Scheduled Function) to periodically sync events and update teacher availability in Harmonia.

*   [ ] **SMS & WhatsApp Notifications (SDD-07):**
    *   Wire the notification system to a communications API provider like **Twilio**.
    *   Implement the logic to send real SMS and WhatsApp messages for alerts (e.g., lesson cancellations, reminders) based on user preferences.

*   [ ] **Tax & Legal Reporting (SDD-17):**
    *   Connect the donation module to the official **Israel Tax Authority's Section 46 API** (`מערכת תרומות ישראל`).
    *   Implement the automated reporting of eligible donations to ensure donors receive their tax credits.

---

## 3. Deployment & Infrastructure

Final steps to make the application live, secure, and scalable.

*   [ ] **Configure Firestore Security Rules:**
    *   Write and deploy comprehensive `firestore.rules` based on the role-based access control (RBAC) defined in the SDDs.
    *   These rules are critical to protect user data and ensure users can only access and modify data they are authorized to see.

*   [ ] **Set up Cloud Functions & Scheduled Tasks:**
    *   Deploy scheduled Firebase Functions for all necessary background jobs, including:
        *   Nightly check for students turning 13 to trigger the age-upgrade flow (SDD-01).
        *   Hourly generation of AI-driven admin alerts (SDD-10).
        *   Monthly processing of subscription renewals and payroll generation (SDD-05, SDD-03).
        *   Daily aggregation for the "Available Now" slots pool (SDD-12).

*   [ ] **Deploy to Production Hosting:**
    *   Configure and deploy the final Next.js application to a production hosting environment, such as **Firebase App Hosting** or Vercel.
    *   Set up custom domains and necessary environment variables for production API keys.
