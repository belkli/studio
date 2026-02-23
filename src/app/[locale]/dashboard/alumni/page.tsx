
'use client';

import { AlumniPortal } from "@/components/dashboard/harmonia/alumni-portal";
import { useTranslations } from "next-intl";


export default function AlumniPage() {
    const t = useTranslations('AlumniPage');
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <AlumniPortal />
        </div>
    );
}
