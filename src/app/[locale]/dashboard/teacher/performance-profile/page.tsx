import { PerformanceProfileEditor } from "@/components/dashboard/harmonia/performance-profile-editor";
import { useTranslations } from "next-intl";

export default function PerformanceProfilePage() {
    const t = useTranslations('Sidebar');
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('performanceProfile')}</h1>
                <p className="text-muted-foreground">נהל את הפרופיל הציבורי שלך עבור הזמנות לאירועים וקונצרטים.</p>
            </div>
            <PerformanceProfileEditor />
        </div>
    );
}
