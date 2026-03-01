'use client';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { HeartHandshake, School, Users, BarChart2, Briefcase, HandCoins } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { isValidIsraeliID } from "@/lib/utils";

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
    const heroImage = PlaceHolderImages.find(img => img.id === 'donate-hero');
    return (
        <>
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
                <div className="container px-4 md:px-6">
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
                <div className="container px-4 md:px-6">
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
                <div className="container px-4 md:px-6">
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
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <Label>{t('selectAmount')}</Label>
                                    <RadioGroup dir="rtl" defaultValue="250" className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('frequency')}</Label>
                                    <Select dir="rtl" defaultValue="once">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="once">{t('frequencyOnce')}</SelectItem>
                                            <SelectItem value="monthly">{t('frequencyMonthly')}</SelectItem>
                                            <SelectItem value="yearly">{t('frequencyYearly')}</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <div className="flex items-center space-x-2 space-x-reverse"><Checkbox id="anonymous" /><Label htmlFor="anonymous">{t('anonymous')}</Label></div>
                                </div>

                                <Button type="submit" className="w-full" size="lg">{t('submitButton', { amount: '250' })}</Button>
                            </form>
                        </Card>

                    </div>
                </div>
            </section>
        </>
    )
}
