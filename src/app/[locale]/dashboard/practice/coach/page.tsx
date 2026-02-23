
import { PracticeCoach } from "@/components/dashboard/harmonia/practice-coach";

export default function PracticeCoachPage() {
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold">מאמן אימון AI</h1>
                <p className="text-muted-foreground">הקלט/י את עצמך וקבל/י משוב מיידי על הנגינה שלך.</p>
            </div>
            <div className="flex justify-center">
                <PracticeCoach />
            </div>
        </div>
    );
}

