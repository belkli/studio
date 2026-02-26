'use client';

import { ExamTrackerPanel } from "@/components/dashboard/harmonia/exam-tracker-panel";
import { useAuth } from "@/hooks/use-auth";

export default function ExamTrackerPage() {
    const { user } = useAuth();

    if (user?.role !== 'teacher') {
        return <p>אין לך הרשאות לגשת לעמוד זה.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">מעקב בחינות משרד החינוך / רסיטל</h1>
                <p className="text-muted-foreground">עקוב אחר התקדמות התלמידים בהכנה לבחינות משרד החינוך, עמידה בדרישות הסילבוס ובשלות היצירות.</p>
            </div>

            <ExamTrackerPanel />
        </div>
    );
}
