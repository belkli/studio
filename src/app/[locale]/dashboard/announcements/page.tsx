
import { AnnouncementComposer } from "@/components/dashboard/harmonia/announcement-composer";

export default function AnnouncementsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">שליחת הכרזה חדשה</h1>
                <p className="text-muted-foreground">שלח הודעה לכלל המשתמשים או לקהל יעד מסוים.</p>
            </div>
            <AnnouncementComposer />
        </div>
    );
}
