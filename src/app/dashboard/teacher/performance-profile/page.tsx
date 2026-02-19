import { PerformanceProfileEditor } from "@/components/dashboard/harmonia/performance-profile-editor";

export default function PerformanceProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">פרופיל אמן להופעות</h1>
                <p className="text-muted-foreground">נהל את הפרופיל הציבורי שלך עבור הזמנות לאירועים וקונצרטים.</p>
            </div>
            <PerformanceProfileEditor />
        </div>
    );
}
