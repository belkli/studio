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
import { HeartHandshake, School, Users, HandCoins } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { isValidIsraeliID } from "@/lib/utils";
import { createDonationCheckout } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const StudentStoryCard = ({ imageId, name, age, instrument, story, donateLabel }: { imageId: string, name: string, age: number, instrument: string, story: string, donateLabel: string }) => {
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return (
        <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
                {image && <Image src={image.imageUrl} alt={image.description} layout="fill" objectFit="cover" data-ai-hint={image.imageHint} />}
            </div>
            <CardHeader>
                <CardTitle>{name}, {age}, {instrument}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{story}</p>
                <Button variant="link" className="p-0 mt-2">{donateLabel}</Button>
            </CardContent>
        </Card>
    )
}

export function DonationLandingPage() {
    const t = useTranslations('DonatePage');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { donationCauses, recordDonation, user } = useAuth();
    const heroImage = PlaceHolderImages.find(img => img.id === 'donate-hero');
    const [amountChoice, setAmountChoice] = useState('250');
    const [customAmount, setCustomAmount] = useState('');
    const [frequency, setFrequency] = useState<'once' | 'monthly' | 'yearly'>('once');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCauseId, setSelectedCauseId] = useState('general');

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


    const activeCauses = useMemo(() => {
        const selectedConservatoriumId = user?.conservatoriumId || 'cons-15';
        return donationCauses
            .filter((cause) => cause.isActive && cause.conservatoriumId === selectedConservatoriumId)
            .sort((a, b) => a.priority - b.priority);
    }, [donationCauses, user?.conservatoriumId]);


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
            <section className="relative w-full h-[60vh] flex items-center justify-center text-center text-white">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        layout="fill"
                        objectFit="cover"
                        className="z-0 brightness-50"
                        data-ai-hint={heroImage.imageHint}
                    />
                )}
                <div className="relative z-10 p-4 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{t('heroTitle')}</h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
                        {t('heroSubtitle')}
                    </p>
                    <Button size="lg" asChild>
                        <a href="#donate-form">{t('donateNow')}</a>
                    </Button>
                </div>
            </section>

            <section className="py-12 md:py-24 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <HeartHandshake className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">1,200+</p>
                            <p className="text-muted-foreground">{t('impact.donations')}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Users className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">85</p>
                            <p className="text-muted-foreground">{t('impact.students')}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <School className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">₪450,000</p>
                            <p className="text-muted-foreground">{t('impact.scholarships')}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <HandCoins className="h-10 w-10 text-primary" />
                            <p className="text-3xl font-bold">75%</p>
                            <p className="text-muted-foreground">{t('impact.coverage')}</p>
                        </div>
                    </div>
                </div>
            </section>

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

            <section id="donate-form" className="py-12 md:py-24 bg-muted/30">
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

                        <Card className="p-6">
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
                                        <div className="space-y-2"><Label htmlFor="donorName">{t('fullName')}</Label><Input id="donorName" placeholder={t('fullNamePlaceholder')} /></div>
                                        <div className="space-y-2"><Label htmlFor="donorId">{t('idNumber')}</Label><Input id="donorId" placeholder={t('idNumberPlaceholder')} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="donorEmail">{t('email')}</Label><Input id="donorEmail" type="email" placeholder={t('emailPlaceholder')} /></div>
                                    <div className="flex items-center gap-2"><Checkbox id="anonymous" /><Label htmlFor="anonymous">{t('anonymous')}</Label></div>
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || selectedAmount <= 0}>
                                    {t('submitButton', { amount: String(selectedAmount || 0) })}
                                </Button>
                            </form>
                        </Card>

                    </div>
                </div>
            </section>
        </div>
    )
}
