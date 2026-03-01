'use client';

import { FormBuilder } from "@/components/dashboard/harmonia/form-builder";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function FormBuilderPage() {
    const { user } = useAuth();
    const t = useTranslations('Sidebar');
    const tAdmin = useTranslations('AdminPages.formBuilder');
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('formBuilder')}</h1>
                    <p className="text-muted-foreground">{tAdmin('noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{tAdmin('title')}</h1>
                <p className="text-muted-foreground">{tAdmin('subtitle')}</p>
            </div>
            <FormBuilder />
        </div>
    );
}
