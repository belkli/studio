import { NewForm } from "@/components/forms/new-form";
import { useTranslations } from "next-intl";

export default function NewFormPage() {
    const t = useTranslations('NewForm');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <NewForm />
        </div>
    )
}
