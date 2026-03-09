'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { BadgeCheck, Briefcase, Heart, Music, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { Stepper } from "@/components/ui/stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedUserProfile } from "@/lib/utils/localized-content";

const OccasionTile = ({ imageId, title, icon }: { imageId: string, title: string, icon: React.ReactNode }) => {
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return (
        <Card className="overflow-hidden group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-52">
                {image && <Image src={image.imageUrl} alt={image.description} fill style={{ objectFit: 'cover' }} className="group-hover:scale-110 transition-transform duration-500" data-ai-hint={image.imageHint} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 start-0 end-0 p-4 flex items-center gap-3 text-white">
                    {icon}
                    <span className="font-bold text-lg drop-shadow">{title}</span>
                </div>
            </div>
        </Card>
    );
};

const MusicianCard = ({ musician: originalMusician }: { musician: User }) => {
    const t = useTranslations('MusiciansForHire');
    const locale = useLocale();
    const musician = getLocalizedUserProfile(originalMusician, locale);
    return (
        <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="relative h-40 bg-gradient-to-br from-primary/20 to-amber-50">
                <Avatar className="absolute bottom-0 start-1/2 -translate-x-1/2 translate-y-1/2 h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={musician.avatarUrl} alt={musician.name} />
                    <AvatarFallback className="text-xl font-bold">{musician.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <CardContent className="pt-12 pb-4 text-center space-y-2">
                <h3 className="font-bold text-lg">{musician.name}</h3>
                <p className="text-sm text-muted-foreground">{musician.localizedHeadline || musician.performanceProfile?.headline}</p>
                <p className="text-xs text-muted-foreground/80 line-clamp-2 px-2">
                    {musician.localizedPerformanceBio || musician.performanceProfile?.performanceBio}
                </p>
                <Button variant="outline" size="sm" className="mt-2 w-full">{t('viewProfile')}</Button>
            </CardContent>
        </Card>
    );
};

export function MusiciansForHire() {
    const t = useTranslations('MusiciansForHire');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { users } = useAuth();

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
            {/* ── Hero ── */}
            <section className="relative w-full min-h-[88vh] flex items-center justify-center text-center text-white overflow-hidden">
                {/* Background image */}
                <Image
                    src="/images/musicians-hero.jpg"
                    alt="String quartet performing at an elegant event"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="z-0"
                    priority
                />
                {/* Multi-layer overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 via-transparent to-indigo-900/30 z-10" />

                {/* Animated musical notes — pure CSS */}
                <style>{`
                    @keyframes floatUp {
                        0% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
                        100% { transform: translateY(-100vh) rotate(20deg); opacity: 0; }
                    }
                    .note-1 { animation: floatUp 8s ease-in infinite; animation-delay: 0s; }
                    .note-2 { animation: floatUp 11s ease-in infinite; animation-delay: 2s; }
                    .note-3 { animation: floatUp 9s ease-in infinite; animation-delay: 4s; }
                    .note-4 { animation: floatUp 13s ease-in infinite; animation-delay: 1s; }
                    @keyframes heroFadeUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .hero-line-1 { animation: heroFadeUp 0.8s ease-out 0.2s both; }
                    .hero-line-2 { animation: heroFadeUp 0.8s ease-out 0.4s both; }
                    .hero-line-3 { animation: heroFadeUp 0.8s ease-out 0.6s both; }
                    .hero-cta { animation: heroFadeUp 0.8s ease-out 0.8s both; }
                `}</style>

                {/* Floating music note decorations */}
                <div className="absolute bottom-20 start-10 text-white/20 text-6xl note-1 z-10 select-none">♪</div>
                <div className="absolute bottom-32 end-16 text-white/15 text-5xl note-2 z-10 select-none">♫</div>
                <div className="absolute bottom-40 start-1/4 text-white/10 text-4xl note-3 z-10 select-none">♩</div>
                <div className="absolute bottom-24 end-1/3 text-white/20 text-7xl note-4 z-10 select-none">𝄞</div>

                <div className="relative z-20 px-4 py-20 max-w-4xl mx-auto space-y-6">
                    {/* Badge */}
                    <div className="hero-line-1 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-sm text-amber-200 backdrop-blur-sm">
                        <Music className="h-4 w-4" />
                        {t('heroTitle')}
                    </div>
                    <h1 className="hero-line-2 text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
                        {t('heroTitle')}
                    </h1>
                    <p className="hero-line-3 max-w-2xl mx-auto text-lg md:text-xl text-neutral-200/90 leading-relaxed">
                        {t('heroSubtitle')}
                    </p>
                    <div className="hero-cta flex flex-wrap justify-center gap-4">
                        <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg px-8 py-6 shadow-lg shadow-amber-500/30 transition-all hover:scale-105" asChild>
                            <a href="#quote-configurator">{t('getQuote')}</a>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-6 backdrop-blur-sm" asChild>
                            <a href="#musicians">{t('musiciansTitle')}</a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/40">
                <style>{`
                    @keyframes sectionFadeUp {
                        from { opacity: 0; transform: translateY(24px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .feature-card { opacity: 0; animation: sectionFadeUp 0.6s ease-out forwards; }
                    .feature-card:nth-child(1) { animation-delay: 0.1s; }
                    .feature-card:nth-child(2) { animation-delay: 0.25s; }
                    .feature-card:nth-child(3) { animation-delay: 0.4s; }
                `}</style>
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {[
                            { icon: <BadgeCheck className="h-10 w-10 text-amber-500" />, title: t('features.experienced'), desc: t('features.experiencedDesc') },
                            { icon: <Shield className="h-10 w-10 text-primary" />, title: t('features.backup'), desc: t('features.backupDesc') },
                            { icon: <Heart className="h-10 w-10 text-rose-500" />, title: t('features.professional'), desc: t('features.professionalDesc') },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} className="feature-card flex flex-col items-center gap-4 rounded-2xl border bg-card/60 p-8 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                                <div className="rounded-2xl bg-muted/60 p-4">{icon}</div>
                                <h3 className="text-xl font-bold">{title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Occasions ── */}
            <section className="py-12 md:py-20">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
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

            {/* ── Quote configurator ── */}
            <section id="quote-configurator" className="py-12 md:py-24 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
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
                                    <div className="space-y-2"><Label>{t('form.eventType')}</Label><Select dir={isRtl ? 'rtl' : 'ltr'}><SelectTrigger><SelectValue placeholder={t('form.eventPlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="wedding">{t('occasion.wedding')}</SelectItem><SelectItem value="corporate">{t('occasion.corporate')}</SelectItem><SelectItem value="private">{t('occasion.private')}</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>{t('form.date')}</Label><Input type="date" /></div>
                                    <div className="space-y-2"><Label>{t('form.location')}</Label><Input placeholder={t('form.locationPlaceholder')} /></div>
                                    <div className="space-y-2"><Label>{t('form.duration')}</Label><Input type="number" defaultValue={2} /></div>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div className="space-y-4 grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>{t('form.ensembleSize')}</Label><Select dir={isRtl ? 'rtl' : 'ltr'}><SelectTrigger><SelectValue placeholder={t('form.ensemblePlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="solo">{t('form.ensemble.solo')}</SelectItem><SelectItem value="duo">{t('form.ensemble.duo')}</SelectItem><SelectItem value="trio">{t('form.ensemble.trio')}</SelectItem><SelectItem value="quartet">{t('form.ensemble.quartet')}</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>{t('form.genre')}</Label><Select dir={isRtl ? 'rtl' : 'ltr'}><SelectTrigger><SelectValue placeholder={t('form.genrePlaceholder')} /></SelectTrigger><SelectContent><SelectItem value="classical">{t('form.genres.classical')}</SelectItem><SelectItem value="jazz">{t('form.genres.jazz')}</SelectItem><SelectItem value="israeli">{t('form.genres.israeli')}</SelectItem><SelectItem value="pop">{t('form.genres.pop')}</SelectItem></SelectContent></Select></div>
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
                                    <p className="text-sm text-muted-foreground">{t('form.quoteDetails', { ensemble: t('form.ensemble.duo'), duration: 3 })}</p>
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

            {/* ── Musicians ── */}
            <section id="musicians" className="py-12 md:py-20">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
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
