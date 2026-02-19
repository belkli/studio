import { PracticeLogForm } from "@/components/dashboard/harmonia/practice-log-form";

export default function PracticeLogPage() {
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold">רישום אימון</h1>
                <p className="text-muted-foreground">תעד את האימונים שלך כדי לעקוב אחר ההתקדמות.</p>
            </div>
            <div className="flex justify-center">
                <PracticeLogForm />
            </div>
        </div>
    );
}
