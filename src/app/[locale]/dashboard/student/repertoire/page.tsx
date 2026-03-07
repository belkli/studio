'use client';

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";

const SheetMusicViewer = dynamic(
    () => import("@/components/dashboard/harmonia/sheet-music-viewer").then(mod => ({ default: mod.SheetMusicViewer })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function StudentRepertoirePage() {
    const t = useTranslations('RepertoirePage');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <SheetMusicViewer />
        </div>
    );
}
