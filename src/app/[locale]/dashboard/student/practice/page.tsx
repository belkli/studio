'use client';

import { StudentPracticePanel } from "@/components/dashboard/harmonia/student-practice-panel";

export default function StudentPracticePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">אימון אישי ורפרטואר</h1>
                <p className="text-muted-foreground">כל שיעורי הבית, היצירות והמטלות שניתנו על ידי המורה - כולל אופציה לתעד אימון.</p>
            </div>

            <StudentPracticePanel />
        </div>
    );
}
