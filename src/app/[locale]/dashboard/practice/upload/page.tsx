import { PracticeVideoUploadForm } from "@/components/dashboard/harmonia/practice-video-upload-form";
import { getTranslations } from "next-intl/server";

export default async function PracticeVideoUploadPage() {
    const t = await getTranslations('DashboardPages');

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold">{t('practiceUpload.title')}</h1>
                <p className="text-muted-foreground">{t('practiceUpload.description')}</p>
            </div>
            <div className="flex justify-center">
                <PracticeVideoUploadForm />
            </div>
        </div>
    );
}
