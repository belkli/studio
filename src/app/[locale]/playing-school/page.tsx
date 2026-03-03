'use client';

import { PlayingSchoolFinder } from "@/components/harmonia/playing-school-finder";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PlayingSchoolFinderPage() {
    const t = useTranslations('PlayingSchool.finder');

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />
            <main className="flex-1 container mx-auto py-24 px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-6">
                    <Badge variant="outline" className="px-4 py-1.5 text-indigo-600 border-indigo-200 bg-indigo-50/50 uppercase tracking-[0.2em] font-black text-[10px]">
                        {t('heroBadge')}
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-none">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('subtitle')}
                    </p>
                </div>

                <PlayingSchoolFinder />
            </main>
            <PublicFooter />
        </div>
    );
}
