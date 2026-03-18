# **App Name**: Lyriosa

## Core Features:

- Secure User Authentication: Firebase Authentication with support for email/password, Google, Microsoft OAuth, and magic links to ensure secure access for all user roles.
- Role-Based Dashboards: Customized dashboards for Students, Teachers, Conservatorium Admins, and Site Admins, each displaying relevant information and actions prioritized by role.
- Dynamic Form Generation and Submission: A system to dynamically generate forms for recitals, concerts, and events, with auto-filled fields, smart suggestions for compositions using a seeded library tool, and real-time validation.
- Approval Workflow with Digital Signatures: A multi-stage approval process allowing teachers and admins to review and approve forms with digital signatures, generating PDF exports that mimic legacy Excel layouts.
- Real-time Notifications: In-app and email notifications for form submissions, approvals, and rejections, ensuring users stay informed of updates and actions.
- Secure Data Storage with Firestore: Firestore database with row-level security rules to ensure that users only access data relevant to their role and conservatorium.
- Composition Library with Fuzzy Search: A searchable library of compositions, with fuzzy Hebrew search using Algolia or Firestore full-text, allowing users to easily find and select pieces for their forms.

## Style Guidelines:

- Primary color: Blue (#3B82F6) for CTAs and main interactive elements, conveying trust and professionalism, like the evening atmosphere of a concert hall.
- Background color: Desaturated indigo (#E5E7EB), a softer, muted version of the indigo gradient used in the hero section.
- Accent color: Green (#10B981) to indicate success, such as when a form has been approved or a task has been completed.
- Body and headline font: 'Rubik' for a modern, accessible, and readable experience, fully supporting Hebrew script and RTL layout. Note: currently only Google Fonts are supported.
- RTL (right-to-left) layout applied globally, ensuring the Hebrew content is properly aligned and presented, mirroring the original document's structure.
- Responsive design with mobile-friendly components, including a hamburger navigation menu and full-width buttons for ease of use on smaller screens.
- Consistent use of icons to represent actions, status, and navigation items, providing visual cues to enhance user understanding and streamline workflows.