
import { PracticeLogForm } from "@/components/dashboard/harmonia/practice-log-form";
import { Button } from "@/components/ui/button";
import { UploadCloud, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function PracticeLogPage() {
    const t = await getTranslations('DashboardPages');

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('practice.title')}</h1>
                    <p className="text-muted-foreground">{t('practice.description')}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/practice/upload">
                            <UploadCloud className="ms-2 h-4 w-4" />
                            {t('practice.uploadVideo')}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/practice/coach">
                            <BrainCircuit className="ms-2 h-4 w-4" />
                            {t('practice.openCoach')}
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="flex justify-center">
                <PracticeLogForm />
            </div>
        </div>
    );
}
