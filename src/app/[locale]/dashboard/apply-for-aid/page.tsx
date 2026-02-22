import { AidApplicationWizard } from "@/components/harmonia/aid-application-wizard";

export const metadata = {
    title: "בקשת תמיכה כלכלית | הַרמוֹנְיָה",
};

export default function ApplyForAidPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">מלגות וסיוע כלכלי</h2>
                    <p className="text-muted-foreground">הגשת מועמדות לקבלת מלגת לימודים מקופת הקרן של הקונסרבטוריון.</p>
                </div>
            </div>

            <AidApplicationWizard />
        </div>
    );
}
