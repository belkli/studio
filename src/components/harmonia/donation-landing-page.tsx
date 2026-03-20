'use client';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { isValidIsraeliID } from "@/lib/utils";
import { createDonationCheckout } from '@/app/actions';
import { createDonationAction } from '@/app/actions/donations';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getLocalizedConservatorium } from '@/lib/utils/localized-content';
import type { Conservatorium } from '@/lib/types';
import { Building2, Star, ArrowLeft } from 'lucide-react';

// ── Mock Section 46 data for conservatoria without donations config ───────
const MOCK_SECTION46_CONSERVATORIA: Array<{
    id: string;
    name: string;
    city: string;
    needScore: number;
    annualTarget: number;
    currentBalance: number;
    totalStudentsFunded: number;
    studentsWaiting: number;
}> = [
    { id: 'cons-15', name: 'קונסרבטוריון הוד השרון', city: 'הוד השרון', needScore: 87, annualTarget: 500000, currentBalance: 120000, totalStudentsFunded: 45, studentsWaiting: 23 },
    { id: 'cons-66', name: 'קונסרבטוריון קריית אונו', city: 'קריית אונו', needScore: 72, annualTarget: 350000, currentBalance: 95000, totalStudentsFunded: 32, studentsWaiting: 18 },
    { id: 'cons-84', name: 'ICM תל אביב', city: 'תל אביב', needScore: 65, annualTarget: 800000, currentBalance: 350000, totalStudentsFunded: 78, studentsWaiting: 12 },
];

const StudentStoryCard = ({ imageId, name, age, instrument, story, donateLabel }: { imageId: string, name: string, age: number, instrument: string, story: string, donateLabel: string }) => {
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return (
        <Card className="story-card overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="relative h-56 w-full overflow-hidden">
                {image && <Image src={image.imageUrl} alt={image.description} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500" data-ai-hint={image.imageHint} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 start-4 end-4">
                    <span className="inline-block bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">{instrument}</span>
                </div>
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{name}, {age}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm leading-relaxed">{story}</p>
                <Button variant="link" className="p-0 mt-3 text-rose-600 hover:text-rose-500 font-semibold">{donateLabel} →</Button>
            </CardContent>
        </Card>
    );
};

export function DonationLandingPage() {
    const t = useTranslations('DonatePage');
    const td = useTranslations('Donate');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { conservatoriums, donationCauses, recordDonation, user } = useAuth();
    const [amountChoice, setAmountChoice] = useState('250');
    const [customAmount, setCustomAmount] = useState('');
    const [frequency, setFrequency] = useState<'once' | 'monthly' | 'yearly'>('once');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCauseId, setSelectedCauseId] = useState('general');
    const [selectedConsId, setSelectedConsId] = useState<string | null>(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const configuredMethods = useMemo(() => {
        const fromEnv = (process.env.NEXT_PUBLIC_PAYMENT_METHODS || '')
            .split(',')
            .map(v => v.trim().toUpperCase())
            .filter(Boolean);
        const supported = ['CARDCOM', 'PELECARD', 'HYP', 'TRANZILA', 'STRIPE'];
        const normalized = fromEnv.filter(v => supported.includes(v));
        return normalized.length > 0 ? normalized : ['CARDCOM'];
    }, []);

    const selectedAmount = amountChoice === 'other' ? Number(customAmount || 0) : Number(amountChoice);

    // AI-ranked Section 46 conservatoria
    const rankedConservatoria = useMemo(() => {
        const withDonations = conservatoriums.filter(
            (c: Conservatorium) => c.donations?.section46Enabled === true
        );

        if (withDonations.length > 0) {
            return withDonations
                .sort((a: Conservatorium, b: Conservatorium) =>
                    (b.donations?.needScore ?? 0) - (a.donations?.needScore ?? 0)
                )
                .map((c: Conservatorium, idx: number) => {
                    const loc = getLocalizedConservatorium(c, locale);
                    return {
                        id: c.id,
                        name: loc.name || c.name,
                        city: loc.location?.city || c.location?.city || '',
                        needScore: c.donations?.needScore ?? 0,
                        annualTarget: c.donations?.annualDonationTarget ?? 0,
                        currentBalance: c.donations?.currentFundBalance ?? 0,
                        totalStudentsFunded: c.donations?.totalStudentsFunded ?? 0,
                        studentsWaiting: Math.max(0, 30 - (c.donations?.totalStudentsFunded ?? 0)),
                        rank: idx + 1,
                    };
                });
        }

        // Fallback: mock data for top 3
        return MOCK_SECTION46_CONSERVATORIA.map((m, idx) => ({
            ...m,
            rank: idx + 1,
        }));
    }, [conservatoriums, locale]);

    const activeCauses = useMemo(() => {
        const selectedConservatoriumId = user?.conservatoriumId || 'cons-15';
        return donationCauses
            .filter((cause) => cause.isActive && cause.conservatoriumId === selectedConservatoriumId)
            .sort((a, b) => a.priority - b.priority);
    }, [donationCauses, user?.conservatoriumId]);

    const selectedCons = useMemo(() => {
        if (!selectedConsId) return null;
        return rankedConservatoria.find(c => c.id === selectedConsId) ?? null;
    }, [selectedConsId, rankedConservatoria]);


    const handleDonateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (selectedAmount <= 0) return;

        const formData = new FormData(event.currentTarget);
        const donorName = String(formData.get('donorName') || '');
        const donorEmail = String(formData.get('donorEmail') || '');
        const donorId = String(formData.get('donorId') || '');
        if (donorId && !isValidIsraeliID(donorId)) return;

        setIsSubmitting(true);
        try {
            // If donating to a specific conservatorium via Section 46, use new action
            if (selectedConsId) {
                const result = await createDonationAction({
                    conservatoriumId: selectedConsId,
                    donorName: donorName || 'Anonymous',
                    donorEmail: donorEmail || 'no-reply@lyriosa.co.il',
                    donorIdNumber: donorId || undefined,
                    anonymous: isAnonymous,
                    amount: selectedAmount,
                    recurringFrequency: isRecurring ? 'MONTHLY' : undefined,
                });

                if ('paymentUrl' in result) {
                    window.location.href = result.paymentUrl;
                }
                return;
            }

            // Otherwise use existing cause-based flow
            recordDonation({
                causeId: selectedCauseId,
                amountILS: selectedAmount,
                frequency,
                donorName: donorName || undefined,
                donorEmail: donorEmail || undefined,
                donorId: donorId || undefined,
                status: 'INITIATED',
            });

            const { url } = await createDonationCheckout({
                amount: selectedAmount,
                frequency,
                donorName,
                donorEmail: donorEmail || undefined,
                donorId: donorId || undefined,
                causeId: selectedCauseId,
            });
            window.location.href = url;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Hero */}
            <section className="relative min-h-[80vh] flex items-end justify-center overflow-hidden text-white">
                <Image
                    src="/images/donation-hero.jpg"
                    alt="Child playing violin passionately"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="z-0"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 via-transparent to-orange-900/20 z-10" />

                <style>{`
                    @keyframes donateHeroUp {
                        from { opacity: 0; transform: translateY(40px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes heartbeat {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                    }
                    .donate-hero-1 { animation: donateHeroUp 0.9s ease-out 0.1s both; }
                    .donate-hero-2 { animation: donateHeroUp 0.9s ease-out 0.3s both; }
                    .donate-hero-3 { animation: donateHeroUp 0.9s ease-out 0.5s both; }
                    .donate-heart { animation: heartbeat 2s ease-in-out infinite; }
                    @keyframes countUp {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .impact-stat { animation: countUp 0.7s ease-out forwards; opacity: 0; }
                    .impact-stat:nth-child(1) { animation-delay: 0.2s; }
                    .impact-stat:nth-child(2) { animation-delay: 0.35s; }
                    .impact-stat:nth-child(3) { animation-delay: 0.5s; }
                    .impact-stat:nth-child(4) { animation-delay: 0.65s; }
                    @keyframes storyFadeIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .story-card { animation: storyFadeIn 0.6s ease-out forwards; opacity: 0; }
                    .story-card:nth-child(1) { animation-delay: 0.1s; }
                    .story-card:nth-child(2) { animation-delay: 0.25s; }
                    .story-card:nth-child(3) { animation-delay: 0.4s; }
                `}</style>

                <div className="relative z-20 w-full max-w-5xl mx-auto px-4 pb-20 pt-32 space-y-6 text-center">
                    <div className="donate-hero-1 inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-5 py-2 text-sm text-rose-200 backdrop-blur-sm">
                        <span className="donate-heart inline-block">❤️</span>
                        {td('hero')}
                    </div>
                    <h1 className="donate-hero-2 text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto">
                        {t('donateFormTitle')}
                    </h1>
                    <p className="donate-hero-3 max-w-2xl mx-auto text-lg text-white/85 leading-relaxed">
                        {td('subtitle')}
                    </p>
                    <div className="donate-hero-3">
                        <Button size="lg" className="bg-rose-500 hover:bg-rose-400 text-white font-bold text-lg px-10 py-6 shadow-xl shadow-rose-500/30 transition-all hover:scale-105 rounded-full">
                            {td('donateNow')} ↓
                        </Button>
                    </div>
                </div>
            </section>

            {/* Impact stats */}
            <section className="bg-rose-600 text-white py-12">
                <div className="mx-auto max-w-5xl px-4 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/20">
                    {[
                        { value: '240+', label: t('impact.students') },
                        { value: '₪2.1M', label: t('impact.scholarships') },
                        { value: '94%', label: t('impact.coverage') },
                        { value: '1,800+', label: t('impact.donations') },
                    ].map(({ value, label }) => (
                        <div key={label} className="impact-stat text-center px-4 py-2">
                            <p className="text-3xl font-extrabold">{value}</p>
                            <p className="text-sm text-white/75 mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI-Ranked Section 46 Conservatoria */}
            <section id="section46-list" className="py-16 bg-gradient-to-b from-background to-rose-50/30">
                <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">{td('selectConservatorium')}</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">{td('subtitle')}</p>
                    </div>

                    {!selectedConsId ? (
                        <div className="space-y-4">
                            {rankedConservatoria.map((cons) => {
                                return (
                                    <Card
                                        key={cons.id}
                                        className="hover:shadow-lg transition-shadow cursor-pointer group"
                                        onClick={() => setSelectedConsId(cons.id)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Rank badge */}
                                                <div className={cn(
                                                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg',
                                                    cons.rank === 1
                                                        ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400'
                                                        : cons.rank === 2
                                                            ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
                                                            : cons.rank === 3
                                                                ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300'
                                                                : 'bg-muted text-muted-foreground'
                                                )}>
                                                    {cons.rank}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-semibold">{cons.name}</h3>
                                                        {cons.rank === 1 && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                                {td('mostUrgent')}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                            {td('section46Badge')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        <span>{cons.city}</span>
                                                        <span className="mx-1">·</span>
                                                        <span>{td('studentsWaiting', { count: String(cons.studentsWaiting) })}</span>
                                                    </div>

                                                    {/* Need bar */}
                                                    <div className="mt-3 space-y-1">
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>{td('needBar')}: {Math.round(cons.needScore)}/100</span>
                                                            <span>{td('annualTarget')}: ₪{cons.annualTarget.toLocaleString(locale)}</span>
                                                        </div>
                                                        <Progress value={cons.needScore} className="h-2" />
                                                    </div>

                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-sm text-muted-foreground">
                                                            {td('impactCounter', { amount: cons.currentBalance.toLocaleString(locale) })}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {td('fundedStudents', { count: String(cons.totalStudentsFunded) })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="shrink-0 bg-rose-500 hover:bg-rose-400 text-white"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedConsId(cons.id); }}
                                                >
                                                    {td('donateNow')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        /* Donation form panel for selected conservatorium */
                        <div className="max-w-2xl mx-auto">
                            <Button
                                variant="ghost"
                                className="mb-4 gap-2"
                                onClick={() => setSelectedConsId(null)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {td('backToList')}
                            </Button>

                            <Card className="shadow-xl border-rose-100">
                                <CardHeader>
                                    <CardTitle>
                                        {selectedCons
                                            ? td('donateToConservatorium', { name: selectedCons.name })
                                            : td('donateNow')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6" onSubmit={handleDonateSubmit}>
                                        {/* Amount selector */}
                                        <div className="space-y-2">
                                            <Label>{td('amount')}</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                {['100', '250', '500', '1000'].map(val => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => { setAmountChoice(val); setCustomAmount(''); }}
                                                        className={cn(
                                                            'rounded-lg border p-3 text-center font-semibold transition-colors',
                                                            amountChoice === val ? 'border-rose-500 bg-rose-50 text-rose-700' : 'hover:bg-muted/40'
                                                        )}
                                                    >
                                                        ₪{Number(val).toLocaleString(locale)}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setAmountChoice('other')}
                                                    className={cn(
                                                        'rounded-lg border p-3 text-center font-semibold transition-colors',
                                                        amountChoice === 'other' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'hover:bg-muted/40'
                                                    )}
                                                >
                                                    {td('customAmount')}
                                                </button>
                                            </div>
                                            {amountChoice === 'other' && (
                                                <Input
                                                    type="number"
                                                    min={10}
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    placeholder="100"
                                                    dir="ltr"
                                                    className="text-start mt-2"
                                                />
                                            )}
                                        </div>

                                        {/* Donor info */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="s46-donorName">{td('donorName')}</Label>
                                                <Input id="s46-donorName" name="donorName" required className="text-start" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="s46-donorEmail">{td('donorEmail')}</Label>
                                                <Input id="s46-donorEmail" name="donorEmail" type="email" required dir="ltr" className="text-start" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="s46-donorId">{td('donorId')}</Label>
                                                <Input id="s46-donorId" name="donorId" dir="ltr" className="text-start" />
                                            </div>
                                        </div>

                                        {/* Anonymous + Recurring toggles */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="s46-anonymous"
                                                    checked={isAnonymous}
                                                    onCheckedChange={(v) => setIsAnonymous(v === true)}
                                                />
                                                <Label htmlFor="s46-anonymous">{td('anonymous')}</Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    id="s46-recurring"
                                                    checked={isRecurring}
                                                    onCheckedChange={setIsRecurring}
                                                />
                                                <Label htmlFor="s46-recurring">{td('recurring')}</Label>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-rose-500 hover:bg-rose-400 text-white"
                                            size="lg"
                                            disabled={isSubmitting || selectedAmount < 10}
                                        >
                                            {td('submit')} — ₪{selectedAmount.toLocaleString(locale)}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </section>

            {/* Student stories */}
            <section className="py-12 md:py-24">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">{t('storiesTitle')}</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">{t('storiesSubtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StudentStoryCard imageId="student-story-1" name={t('story1Name')} age={t.raw('story1Age')} instrument={t('story1Instrument')} story={t('story1Text')} donateLabel={t('donateTo', { name: t('story1Name') })} />
                        <StudentStoryCard imageId="student-story-2" name={t('story2Name')} age={t.raw('story2Age')} instrument={t('story2Instrument')} story={t('story2Text')} donateLabel={t('donateTo', { name: t('story2Name') })} />
                        <StudentStoryCard imageId="student-story-3" name={t('story3Name')} age={t.raw('story3Age')} instrument={t('story3Instrument')} story={t('story3Text')} donateLabel={t('donateTo', { name: t('story3Name') })} />
                    </div>
                </div>
            </section>

            {/* Cause-based donation form (existing) */}
            <section id="donate-form" className="py-16 bg-gradient-to-b from-rose-50/50 to-background">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">{t('donateFormTitle')}</h2>
                            <p className="text-muted-foreground">{t('donateFormSubtitle')}</p>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('howItHelpsTitle')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪100</div><p>{t('help1')}</p></div>
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪500</div><p>{t('help2')}</p></div>
                                    <div className="flex items-center gap-4"><div className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-24 text-center">₪2,500</div><p>{t('help3')}</p></div>
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            <p className="text-center text-muted-foreground mb-6 max-w-lg mx-auto">{t('donateFormSubtitle')}</p>
                            <Card className="max-w-2xl mx-auto shadow-xl border-rose-100">
                                <CardContent className="p-6">
                                    <form className="space-y-6" onSubmit={handleDonateSubmit}>
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">{t('chooseCause')}</h3>
                                            <p className="text-sm text-muted-foreground">{t('chooseCauseHint')}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCauseId('general')}
                                                    className={cn(
                                                        'rounded-lg border p-3 text-start transition-colors',
                                                        selectedCauseId === 'general' ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                                                    )}
                                                >
                                                    <p className="font-medium">{t('generalFund')}</p>
                                                    <p className="text-sm text-muted-foreground">{t('generalFundDesc')}</p>
                                                </button>
                                                {activeCauses.map((cause) => {
                                                    const causeName = cause.names[locale as 'he' | 'en' | 'ru' | 'ar'] || cause.names.he || cause.names.en;
                                                    const causeDescription = locale === 'he' ? cause.descriptions.he : cause.descriptions.en;
                                                    const progress = cause.targetAmountILS
                                                      ? Math.min(100, Math.round((cause.raisedAmountILS / cause.targetAmountILS) * 100))
                                                      : null;

                                                    return (
                                                        <button
                                                            key={cause.id}
                                                            type="button"
                                                            onClick={() => setSelectedCauseId(cause.id)}
                                                            className={cn(
                                                                'rounded-lg border p-3 text-start transition-colors',
                                                                selectedCauseId === cause.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                                                            )}
                                                        >
                                                            <p className="font-medium">{causeName}</p>
                                                            <p className="text-sm text-muted-foreground">{causeDescription}</p>
                                                            {progress !== null && (
                                                                <p className="text-xs text-muted-foreground mt-2">{t('raisedProgress', { percent: String(progress) })}</p>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('selectAmount')}</Label>
                                            <RadioGroup value={amountChoice} onValueChange={setAmountChoice} dir={isRtl ? 'rtl' : 'ltr'} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {['100', '250', '500'].map(val => (
                                                    <Label key={val} htmlFor={`amount-${val}`} className="border cursor-pointer rounded-md p-3 text-center has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                                        <RadioGroupItem value={val} id={`amount-${val}`} className="sr-only" />
                                                        ₪{val}
                                                    </Label>
                                                ))}
                                                <Label htmlFor="amount-other" className="border cursor-pointer rounded-md p-3 text-center has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                                    <RadioGroupItem value="other" id="amount-other" className="sr-only" />
                                                    {t('other')}
                                                </Label>
                                            </RadioGroup>
                                            {amountChoice === 'other' && (
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    placeholder="100"
                                                    dir="ltr"
                                                    className="text-start"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('frequency')}</Label>
                                            <Select dir={isRtl ? 'rtl' : 'ltr'} value={frequency} onValueChange={(v: 'once' | 'monthly' | 'yearly') => setFrequency(v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="once">{t('frequencyOnce')}</SelectItem>
                                                    <SelectItem value="monthly">{t('frequencyMonthly')}</SelectItem>
                                                    <SelectItem value="yearly">{t('frequencyYearly')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">{configuredMethods.join(' / ')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('dedication')}</Label>
                                            <Textarea placeholder={t('dedicationPlaceholder')} />
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h3 className="font-semibold">{t('receiptDetails')}</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label htmlFor="donorName">{t('fullName')}</Label><Input id="donorName" name="donorName" placeholder={t('fullNamePlaceholder')} /></div>
                                                <div className="space-y-2"><Label htmlFor="donorId">{t('idNumber')}</Label><Input id="donorId" name="donorId" placeholder={t('idNumberPlaceholder')} /></div>
                                            </div>
                                            <div className="space-y-2"><Label htmlFor="donorEmail">{t('email')}</Label><Input id="donorEmail" name="donorEmail" type="email" placeholder={t('emailPlaceholder')} /></div>
                                            <div className="flex items-center gap-2"><Checkbox id="anonymous" /><Label htmlFor="anonymous">{t('anonymous')}</Label></div>
                                        </div>

                                        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || selectedAmount <= 0}>
                                            {t('submitButton', { amount: String(selectedAmount || 0) })}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    )
}
