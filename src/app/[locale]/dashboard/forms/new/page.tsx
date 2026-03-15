'use client';

import { NewForm } from "@/components/forms/new-form";
import { useLocale, useTranslations } from "next-intl";

export default function NewFormPage() {
    const t = useTranslations('NewForm');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <NewForm />
        </div>
    )
}
