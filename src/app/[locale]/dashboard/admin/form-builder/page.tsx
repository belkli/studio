'use client';

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { Skeleton } from "@/components/ui/skeleton";

const FormBuilder = dynamic(
    () => import("@/components/dashboard/harmonia/form-builder").then(mod => ({ default: mod.FormBuilder })),
    { loading: () => <Skeleton className="h-96" /> }
);

export default function FormBuilderPage() {
    const { user, isLoading } = useAdminGuard();
    const tAdmin = useTranslations('AdminPages.formBuilder');

    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <Skeleton className="h-96" />
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
