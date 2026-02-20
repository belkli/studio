'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { BadgeCheck, Calendar, Check, Guitar, Heart, Music, Shield, SlidersHorizontal, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { Stepper } from "@/components/ui/stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

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

const MusicianCard = ({ musician }: { musician: User }) => {
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
                    <CardDescription>{musician.performanceProfile?.headline}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{musician.performanceProfile?.performanceBio}</p>
                 <Button variant="link" className="p-0 mt-2">צפה בפרופיל המלא</Button>
            </CardContent>
        </Card>
    )
}

export function MusiciansForHire() {
    const { users } = useAuth();
    const heroImage = PlaceHolderImages.find(img => img.id === 'musicians-hero');
    
    const performers = useMemo(() => 
        users.filter(u => u.role === 'teacher' && u.performanceProfile?.isOptedIn && u.performanceProfile?.adminApproved)
    , [users]);

    const quoteSteps = [
        { id: 'event', title: 'פרטי אירוע' },
        { id: 'music', title: 'צרכים מוזיקליים' },
        { id: 'quote', title: 'הצעת מחיר' },
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
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">מוזיקאים מקצועיים לאירועים שלא נשכחים</h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-200">
                        הנגנים המוכשרים והמנוסים של קונסרבטוריון הרמוניה, זמינים להעשיר כל אירוע - מחתונות ואירועים עסקיים ועד למסיבות פרטיות.
                    </p>
                    <Button size="lg" className="text-lg py-7 px-8" asChild>
                        <a href="#quote-configurator">קבל הצעת מחיר מיידית</a>
                    </Button>
                </div>
            </section>
            
            <section className="py-12 md:py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <BadgeCheck className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">מוזיקאים מנוסים</h3>
                            <p className="text-muted-foreground">כל הנגנים שלנו הם מורים מוסמכים ומופיעים פעילים עם ניסיון בימתי עשיר.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Shield className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">גיבוי מובטח</h3>
                            <p className="text-muted-foreground">במקרה של ביטול, אנו מתחייבים למצוא נגן חלופי באותה רמה, כדי שהאירוע שלכם יתקיים כמתוכנן.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Heart className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-bold">ניהול מקצועי</h3>
                            <p className="text-muted-foreground">צוות הקונסרבטוריון מנהל את כל הלוגיסטיקה, התשלומים והתיאומים עבורכם, לחוויה נטולת דאגות.</p>
                        </div>
                    </div>
                </div>
            </section>

             <section className="py-12 md:py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">מוזיקה לכל אירוע</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">בחרו את סוג האירוע שלכם כדי להתחיל.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <OccasionTile imageId="event-wedding" title="חתונה" icon={<Heart className="text-destructive"/>} />
                        <OccasionTile imageId="event-corporate" title="אירוע עסקי" icon={<Briefcase className="text-blue-500"/>} />
                        <OccasionTile imageId="event-private" title="מסיבה פרטית" icon={<Users className="text-green-500"/>} />
                    </div>
                </div>
            </section>

            <section id="quote-configurator" className="py-12 md:py-24 bg-muted/30">
                 <div className="container px-4 md:px-6">
                     <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">הצעת מחיר מיידית</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">ענו על מספר שאלות קצרות וקבלו הצעת מחיר ראשונית על המקום.</p>
                    </div>
                     <Card className="max-w-4xl mx-auto">
                        <CardHeader>
                            <Stepper currentStep={currentStep} steps={quoteSteps.map(s=>({id: s.id, title: s.title, icon: Music}))}/>
                        </CardHeader>
                        <CardContent>
                            {currentStep === 0 && (
                                <div className="space-y-4 grid md:grid-cols-2 gap-6">
                                     <div className="space-y-2"><Label>סוג אירוע</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder="בחר סוג אירוע..."/></SelectTrigger><SelectContent><SelectItem value="wedding">חתונה</SelectItem><SelectItem value="corporate">אירוע עסקי</SelectItem><SelectItem value="private">מסיבה פרטית</SelectItem></SelectContent></Select></div>
                                     <div className="space-y-2"><Label>תאריך האירוע</Label><Input type="date" /></div>
                                     <div className="space-y-2"><Label>מיקום</Label><Input placeholder="עיר או כתובת מלאה..." /></div>
                                     <div className="space-y-2"><Label>משך ההופעה (בשעות)</Label><Input type="number" defaultValue={2} /></div>
                                </div>
                            )}
                             {currentStep === 1 && (
                                <div className="space-y-4 grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>גודל הרכב</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder="בחר גודל הרכב..."/></SelectTrigger><SelectContent><SelectItem value="solo">סולו (1)</SelectItem><SelectItem value="duo">דואט (2)</SelectItem><SelectItem value="trio">טריו (3)</SelectItem><SelectItem value="quartet">רביעייה (4)</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>ז'אנר מוזיקלי</Label><Select dir="rtl"><SelectTrigger><SelectValue placeholder="בחר ז'אנר..."/></SelectTrigger><SelectContent><SelectItem value="classical">קלאסי</SelectItem><SelectItem value="jazz">ג'אז</SelectItem><SelectItem value="israeli">ישראלי</SelectItem><SelectItem value="pop">פופ/קל</SelectItem></SelectContent></Select></div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>בקשות מיוחדות (אופציונלי)</Label>
                                        <Textarea placeholder="שירים ספציפיים, אווירה רצויה, וכו'..." />
                                    </div>
                                </div>
                            )}
                             {currentStep === 2 && (
                                <div className="text-center space-y-4 p-8">
                                    <p className="text-muted-foreground">הצעת מחיר מוערכת עבורכם:</p>
                                    <p className="text-5xl font-bold">₪2,800</p>
                                    <p className="text-sm text-muted-foreground">(דואט קלאסי ל-3 שעות)</p>
                                    <Button size="lg" className="mt-4">שלח בקשה וקבל הצעה סופית</Button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s-1))} disabled={currentStep === 0}>הקודם</Button>
                            <Button onClick={() => setCurrentStep(s => Math.min(s+1, quoteSteps.length -1))} disabled={currentStep === quoteSteps.length -1}>הבא</Button>
                        </CardFooter>
                     </Card>
                 </div>
            </section>
            
            <section className="py-12 md:py-20">
                <div className="container px-4 md:px-6">
                     <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">המוזיקאים שלנו</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">הצצה קטנה אל חלק מהנגנים המוכשרים שתוכלו להזמין.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {performers.slice(0,3).map(p => <MusicianCard key={p.id} musician={p} />)}
                    </div>
                </div>
            </section>
        </>
    )
}
