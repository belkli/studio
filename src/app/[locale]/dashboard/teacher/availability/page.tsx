import { AvailabilityGrid } from "@/components/dashboard/harmonia/availability-grid";

export default function AvailabilityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול זמינות</h1>
                <p className="text-muted-foreground">הגדר את שעות העבודה השבועיות שלך, חסום תאריכים לחופשה וסנכרן את היומן החיצוני שלך.</p>
            </div>
            <AvailabilityGrid />
        </div>
    );
}
