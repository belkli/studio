export interface HelpArticle {
    id: string;
    category: string;
    title: string;
    content: string; // Markdown content
}

export const helpArticles: HelpArticle[] = [
    {
        id: 'booking-first-lesson',
        category: 'Scheduling & Lessons',
        title: 'How to Book a Lesson',
        content: `
## Booking Your First Lesson

1.  Navigate to the **Schedule** page from the sidebar.
2.  Click on the "Book a new lesson" button.
3.  Select the student (if you are a parent), instrument, teacher, and lesson duration.
4.  Use the calendar to pick a date.
5.  Available time slots for your selected teacher will appear. Choose one that works for you.
6.  Confirm the booking. A credit will be deducted from your package.
        `
    },
    {
        id: 'cancellation-policy',
        category: 'Scheduling & Lessons',
        title: 'Understanding the Cancellation Policy',
        content: `
## Cancellation Policy

-   **On-Time Cancellation:** If you cancel a lesson more than 24 hours in advance, you will automatically receive a makeup credit.
-   **Late Cancellation:** If you cancel less than 24 hours before the lesson, the credit for that lesson will be forfeited.
-   **Teacher Cancellation:** If your teacher cancels a lesson, you will always receive a makeup credit.

You can use makeup credits to book a new lesson at your convenience via the **Makeups** page.
        `
    },
    {
        id: 'updating-payment',
        category: 'Payments & Billing',
        title: 'How to Update Your Payment Method',
        content: `
## Updating Your Payment Method

1.  Go to the **Billing** page from the sidebar.
2.  In the "Subscription Management" section, click on "Manage Payment Method".
3.  You will be prompted to enter your new credit card details in a secure form.
4.  Once saved, all future recurring payments will use the new card.
        `
    },
    {
        id: 'submitting-recital-form',
        category: 'Forms & Approvals',
        title: 'Submitting a Recital Form',
        content: `
## Submitting a Recital Form

1.  From the dashboard, navigate to **Forms & Docs**.
2.  Click on "New Form" and select "Recital Form".
3.  Fill out all the required details about your repertoire. You can search for compositions in our library.
4.  Once you are done, click "Submit for Teacher Approval".
5.  Your teacher will review the form. Once they approve it, it will be sent to the conservatory administration for final approval. You can track the status on the "Forms & Docs" page.
        `
    }
];

export const helpCategories = Array.from(new Set(helpArticles.map(a => a.category)));
