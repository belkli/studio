'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { BadgeCheck, Briefcase, Calendar, Check, Guitar, Heart, Music, Shield, SlidersHorizontal, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { Stepper } from "@/components/ui/stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedUserProfile } from "@/lib/utils/localized-content";

const OccasionTile = ({ imageId, title, icon }: { imageId: string, title: string, icon: React.ReactNode }) => {
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return (
        <Card className="overflow-hidden group cursor-pointer">
            <div className="relative h-32">
                {image && <Image src={image.imageUrl} alt={image.description} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" data-ai-hint={image.imageHint} />}
            </div>
            <CardContent className="p-4 flex items-center gap-3">
                {icon}
                <span className="font-semibold">{title}</span>
            </CardContent>
        </Card>
    )
}

const MusicianCard = ({ musician: originalMusician }: { musician: User }) => {
    const t = useTranslations('MusiciansForHire');
    const locale = useLocale();
    const musician = getLocalizedUserProfile(originalMusician, locale);
    const image = PlaceHolderImages.find(img => img.id === musician.avatarUrl); // Using avatarUrl as imageId

    return (
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    {image ? <AvatarImage src={image.imageUrl} alt={musician.name} /> : <AvatarImage src={musician.avatarUrl} alt={musician.name} />}
                    <AvatarFallback>{musician.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{musician.name}</CardTitle>
                    <CardDescription>{musician.localizedHeadline || musician.performanceProfile?.headline}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {musician.localizedPerformanceBio || musician.performanceProfile?.performanceBio}
                </p>
                <Button variant="link" className="p-0 mt-2">{t('viewProfile')}</Button>
            </CardContent>
        </Card>
    )
}

export function MusiciansForHire() {
    const t = useTranslations('MusiciansForHire');
    const { users } = useAuth();
    const heroImage = PlaceHolderImages.find(img => img.id === 'musicians-hero');

    const performers = useMemo(() =>
        users.filter(u => u.role === 'teacher' && u.performanceProfile?.isOptedIn && u.performanceProfile?.adminApproved)
        , [users]);

    const quoteSteps = [
        { id: 'event', title: t('steps.event'), icon: Music },
        { id: 'music', title: t('steps.music'), icon: Music },
        { id: 'quote', title: t('steps.quote'), icon: Music },
    ];
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <>
            <section className="relative w-full h-[70vh] flex items-center justify-center text-center text-white bg-slate-900">
                {heroImage && (
                    <Image
                        src={heroImage.imageUrl}
                        alt={heroImage.description}
                        layout="fill"
                        objectFit="cover"
                        className="z-0 brightness-50"
                        data-ai-hint={heroImage.imageHint}
                        priority
                    />
                )}
                <div className="relative z-10 p-4 space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{t('heroTitle')}</h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                        {t('heroSubtitle')}
                    </p>
                    <Button size="lg" className="text-lg py-7 px-8" asChild>
                        <a href="#quote-configurator">{t('getQuote')}</a>
                    </Button>
                </div>
            </section>

            <section className="py-12 md:py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <BadgeCheck className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">{t('features.experienced')}</h3>
                            <p className="text-muted-foreground">{t('features.experiencedDesc')}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Shield className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">{t('features.backup')}</h3>
                            <p className="text-muted-foreground">{t('features.backupDesc')}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Heart className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">{t('features.professional')}</h3>
                            <p className="text-muted-foreground">{t('features.professionalDesc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">{t('occasionsTitle')}</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">{t('occasionsSubtitle')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <OccasionTile imageId="event-wedding" title={t('occasion.wedding')} icon={<Heart className="text-destructive" />} />
                        <OccasionTile imageId="event-corporate" title={t('occasion.corporate')} icon={<Briefcase className="text-blue-500" />} />
                        <OccasionTile imageId="event-private" title={t('occasion.private')} icon={<Users className="text-green-500" />} />
                    </div>
                </div>
            </section>

            <section id="quote-configurator" className="py-12 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">{t('configuratorTitle')}</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">{t('configuratorSubtitle')}</p>
                    </div>
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <Stepper currentStep={currentStep} steps={quoteSteps.map(s => ({ ...s, icon: Music }))} />
                        </CardHeader>
                        <CardContent>
                            {currentStep === 0 && (
                                <div className="space-y-4 grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>{t('form.eventType')}</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder={t('form.eventPlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="wedding">{t('occasion.wedding')}</SelectItem><SelectItem value="corporate">{t('occasion.corporate')}</SelectItem><SelectItem value="private">{t('occasion.private')}</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>{t('form.date')}</Label><Input type="date" /></div>
                                    <div className="space-y-2"><Label>{t('form.location')}</Label><Input placeholder={t('form.locationPlaceholder')} /></div>
                                    <div className="space-y-2"><Label>{t('form.duration')}</Label><Input type="number" defaultValue={2} /></div>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div className="space-y-4 grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>{t('form.ensembleSize')}</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder={t('form.ensemblePlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="solo">{t('form.ensemble.solo')}</SelectItem><SelectItem value="duo">{t('form.ensemble.duo')}</SelectItem><SelectItem value="trio">{t('form.ensemble.trio')}</SelectItem><SelectItem value="quartet">{t('form.ensemble.quartet')}</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>{t('form.genre')}</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder={t('form.genrePlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="classical">{t('form.genres.classical')}</SelectItem><SelectItem value="jazz">{t('form.genres.jazz')}</SelectItem><SelectItem value="israeli">{t('form.genres.israeli')}</SelectItem><SelectItem value="pop">{t('form.genres.pop')}</SelectItem></SelectContent></Select></div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>{t('form.requests')}</Label>
                                        <Textarea placeholder={t('form.requestsPlaceholder')} />
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div className="text-center space-y-4 p-8">
                                    <p className="text-muted-foreground">{t('form.quoteTitle')}</p>
                                    <p className="text-5xl font-bold">{t('form.quotePrice', { price: '2,800' })}</p>
                                    <p className="text-sm text-muted-foreground">{t('form.quoteDetails', { ensemble: "דואט קלאסי", duration: 3 })}</p>
                                    <Button size="lg" className="mt-4">{t('form.submitRequest')}</Button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>{t('form.previous')}</Button>
                            <Button onClick={() => setCurrentStep(s => Math.min(s + 1, quoteSteps.length - 1))} disabled={currentStep === quoteSteps.length - 1}>{t('form.next')}</Button>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            <section className="py-12 md:py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">{t('musiciansTitle')}</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">{t('musiciansSubtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {performers.slice(0, 3).map(p => <MusicianCard key={p.id} musician={p} />)}
                    </div>
                </div>
            </section>
        </>
    )
}