import { FamilyHub } from "@/components/dashboard/harmonia/family-hub";

export default function FamilyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">המשפחה שלי</h1>
                <p className="text-muted-foreground">לוח הבקרה המרכזי לניהול הפעילות של ילדיך בקונסרבטוריון.</p>
            </div>
            <FamilyHub />
        </div>
    );
}
