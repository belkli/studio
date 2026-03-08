'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { RegistrationAgreement } from '@/components/enrollment/registration-agreement';

const LOCALE_LABELS: Record<string, string> = { he: 'עברית', en: 'English', ar: 'العربية', ru: 'Русский' };

export default function ConservatoriumSettingsPage() {
    const { toast } = useToast();
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const locale = useLocale();
    const t = useTranslations('ConservatoriumSettings');
    const isRtl = locale === 'he' || locale === 'ar';

    const currentConservatorium = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const [customTerms, setCustomTerms] = useState<Record<string, string>>(() => {
        const existing = currentConservatorium?.customRegistrationTerms;
        return {
            he: existing?.he ?? '',
            en: existing?.en ?? '',
            ar: existing?.ar ?? '',
            ru: existing?.ru ?? '',
        };
    });
    const [standardTermsOpen, setStandardTermsOpen] = useState(false);

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>אין לך הרשאה לגשת לעמוד זה.</p>;
    }

    if (!currentConservatorium) {
        return <p>לא נמצא קונסרבטוריון.</p>
    }

    const handleToggleFeatures = (enabled: boolean) => {
        updateConservatorium({ ...currentConservatorium, newFeaturesEnabled: enabled });
        toast({
            title: `הפיצ'רים החדשים ${enabled ? 'הופעלו' : 'כובו'}`,
            description: `השינויים יחולו לאחר רענון הדף. מרענן...`,
        });
        // Force a reload to apply changes across the app
        setTimeout(() => window.location.reload(), 1500);
    }

    const handleSaveCustomTerms = () => {
        const terms: Record<string, string> = {};
        for (const [key, value] of Object.entries(customTerms)) {
            if (value.trim()) terms[key] = value.trim();
        }
        updateConservatorium({
            ...currentConservatorium,
            customRegistrationTerms: Object.keys(terms).length > 0 ? terms : undefined,
        });
        toast({ title: t('customTermsSaved') });
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/settings">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">הגדרות קונסרבטוריון</h1>
                    <p className="text-muted-foreground">ניהול הגדרות מתקדמות עבור {user.conservatoriumName}.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ניהול תכונות (Features)</CardTitle>
                    <CardDescription>הפעל או כבה את מערכת &quot;הרמוניה&quot; החדשה עבור המוסד שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="features-toggle" className="font-semibold">
                                הפעל את מערכת הרמוניה החדשה
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                כולל דשבורדים חדשים, ניהול משפחות, רישום מתקדם, ועוד.
                            </p>
                        </div>
                        <Switch
                            id="features-toggle"
                            checked={currentConservatorium.newFeaturesEnabled}
                            onCheckedChange={handleToggleFeatures}
                            aria-label="Toggle new features"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('customTermsTitle')}</CardTitle>
                    <CardDescription>{t('customTermsDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                            onClick={() => setStandardTermsOpen((v) => !v)}
                            aria-expanded={standardTermsOpen}
                        >
                            <span>{t('standardTermsTitle')}</span>
                            {standardTermsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {standardTermsOpen && (
                            <div className="border-t">
                                <RegistrationAgreement mode="admin-preview" />
                            </div>
                        )}
                    </div>
                    {(['he', 'en', 'ar', 'ru'] as const).map((lang) => (
                        <div key={lang} className="space-y-1">
                            <Label htmlFor={`custom-terms-${lang}`}>{LOCALE_LABELS[lang]}</Label>
                            <Textarea
                                id={`custom-terms-${lang}`}
                                dir={lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr'}
                                rows={3}
                                value={customTerms[lang]}
                                onChange={(e) => setCustomTerms((prev) => ({ ...prev, [lang]: e.target.value }))}
                                placeholder={t('customTermsPlaceholder')}
                            />
                        </div>
                    ))}
                    <Button onClick={handleSaveCustomTerms}>{t('saveCustomTerms')}</Button>
                </CardContent>
            </Card>
        </div>
    );
}
