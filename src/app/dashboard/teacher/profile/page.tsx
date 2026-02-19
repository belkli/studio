import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeacherProfileEditor } from "@/components/dashboard/harmonia/teacher-profile-editor";

export default function TeacherProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">פרופיל מורה</h1>
                <p className="text-muted-foreground">נהל את הפרופיל הציבורי, ההתמחויות והזמינות שלך.</p>
            </div>
            <div className="flex justify-center">
                <TeacherProfileEditor />
            </div>
        </div>
    );
}
