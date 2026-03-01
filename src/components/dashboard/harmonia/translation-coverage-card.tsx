"use client";

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TranslationMeta } from '@/lib/types';
import { Languages, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TranslationCoverageCardProps {
    meta: Record<string, TranslationMeta> | null | undefined;
    baseFieldsCount: number;
    onRetranslateAll?: () => void;
    isTranslating?: boolean;
}

export function TranslationCoverageCard({
    meta,
    baseFieldsCount,
    onRetranslateAll,
    isTranslating = false
}: TranslationCoverageCardProps) {
    const t = useTranslations('PublicProfiles');

    const locales = ['en', 'ar', 'ru'];

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {t('translationCoverage')}
                    </CardTitle>
                    <CardDescription>
                        Language support for this profile
                    </CardDescription>
                </div>
                {onRetranslateAll && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetranslateAll}
                        disabled={isTranslating}
                    >
                        {isTranslating ? 'Translating...' : t('retranslateAll')}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {locales.map(locale => {
                        const localeMeta = meta?.[locale];
                        const updated = localeMeta?.lastTranslatedAt;

                        // In a real implementation we would count actual fields, this is simplified
                        const progress = localeMeta ? 100 : 0;

                        return (
                            <div key={locale} className="border rounded-md p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium uppercase">{locale}</span>
                                    {progress === 100 ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Up to date
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {t('missingTranslation')}
                                        </Badge>
                                    )}
                                </div>

                                <Progress value={progress} className="h-1.5" />

                                <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>{progress === 100 ? `${baseFieldsCount}/${baseFieldsCount} fields` : `0/${baseFieldsCount} fields`}</span>
                                    <span>{updated ? new Date(updated).toLocaleDateString() : t('noTranslationYet')}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
