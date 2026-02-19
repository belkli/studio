'use client';

import { EventForm } from "@/components/dashboard/harmonia/event-form";
import { useAuth } from "@/hooks/use-auth";

export default function NewEventPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return <p>אין לך הרשאה לגשת לעמוד זה.</p>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">יצירת אירוע חדש</h1>
                <p className="text-muted-foreground">הזן את הפרטים הבסיסיים כדי ליצור אירוע חדש במערכת.</p>
            </div>
            <EventForm />
        </div>
    );
}
