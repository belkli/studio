'use client';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Calendar, Clock, Guitar, Lightbulb, Mic, Music, Piano, Users, Violin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { instruments } from '@/lib/data';
import { format, add, setHours, setMinutes, isBefore, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-4">
        <div className="bg-primary/10 rounded-full p-4">
            {icon}
        </div>
        <div className="space-y-1">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);


export function OpenDayLandingPage() {
    const { mockOpenDayEvents, mockOpenDayAppointments, addOpenDayAppointment } = useAuth();
    const { toast } = useToast();
    const heroImage = PlaceHolderImages.find(img => img.id === 'open-day-hero');

    const [selectedTime, setSelectedTime] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const activeEvent = useMemo(() => mockOpenDayEvents.find(e => e.isActive), [mockOpenDayEvents]);

    const availableSlots = useMemo(() => {
        if (!activeEvent) return [];
        const slots = [];
        let currentTime = setMinutes(setHours(new Date(activeEvent.date), parseInt(activeEvent.startTime.split(':')[0])), parseInt(activeEvent.startTime.split(':')[1]));
        const endTime = setMinutes(setHours(new Date(activeEvent.date), parseInt(activeEvent.endTime.split(':')[0])), parseInt(activeEvent.endTime.split(':')[1]));

        while (isBefore(currentTime, endTime)) {
            const slotTimeISO = currentTime.toISOString();
            const isBooked = mockOpenDayAppointments.some(appt => appt.eventId === activeEvent.id && appt.appointmentTime === slotTimeISO);
            if (!isBooked) {
                slots.push(slotTimeISO);
            }
            currentTime = add(currentTime, { minutes: activeEvent.appointmentDuration });
        }
        return slots;
    }, [activeEvent, mockOpenDayAppointments]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeEvent || !selectedTime) {
            toast({
                variant: 'destructive',
                title: 'פרטים חסרים',
                description: 'אנא בחר/י שעת פגישה.',
            });
            return;
        }

        const formData = new FormData(e.currentTarget);
        const appointmentData = {
            eventId: activeEvent.id,
            familyName: formData.get('familyName') as string,
            parentEmail: formData.get('parentEmail') as string,
            parentPhone: formData.get('parentPhone') as string,
            childName: formData.get('childName') as string,
            childAge: parseInt(formData.get('childAge') as string, 10),
            instrumentInterest: formData.get('instrumentInterest') as string,
            appointmentTime: selectedTime,
        };

        addOpenDayAppointment(appointmentData);
        setIsSubmitted(true);
    };

    if (!activeEvent) {
        return <div className="text-center py-20">כרגע אין יום פתוח מתוכנן. אנא בדקו שוב בקרוב!</div>;
    }
    
    if (isSubmitted) {
        return (
            <Card className="w-full max-w-2xl mx-auto my-20 shadow-sm text-center">
                <CardContent className="pt-12 pb-12 flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">הרשמתכם התקבלה!</h2>
                    <p className="text-muted-foreground max-w-md">
                        תודה על הרשמתכם ליום הפתוח. אישור ופרטים נוספים נשלחו למייל שהזנתם. נשמח לראות אתכם!
                    </p>
                    <Button className="mt-4" onClick={() => window.location.href = '/'}>
                        חזרה לדף הבית
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <section className="relative w-full h-[60vh] flex items-center justify-center text-center text-white bg-slate-800">
                {heroImage && <Image src={heroImage.imageUrl} alt={heroImage.description} layout="fill" objectFit="cover" className="z-0 brightness-50" data-ai-hint={heroImage.imageHint} priority />}
                <div className="relative z-10 p-4 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{activeEvent.name}</h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">{activeEvent.description}</p>
                    <p className="font-semibold text-xl bg-primary/20 backdrop-blur-sm rounded-full px-4 py-1 inline-block">
                        {format(new Date(activeEvent.date), 'EEEE, dd MMMM yyyy', { locale: he })}
                    </p>
                </div>
            </section>
            <section className="py-12 md:py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <FeatureCard icon={<Users className="h-8 w-8 text-primary" />} title="פגשו את המורים" description="הזדמנות להכיר את הצוות הפדגוגי המוביל שלנו, לשאול שאלות ולקבל הכוונה אישית." />
                        <FeatureCard icon={<Guitar className="h-8 w-8 text-primary" />} title="התנסות בכלים" description="הילדים יוכלו לגעת, להרגיש ולנגן במגוון כלי נגינה בליווי והדרכה של מורינו." />
                        <FeatureCard icon={<Music className="h-8 w-8 text-primary" />} title="הופעות חיות" description="צפו בתלמידים המוכשרים שלנו מציגים את מה שלמדו בקונצרטים קצרים לאורך היום." />
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-24" id="register">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">הרשמה ליום הפתוח</h2>
                        <p className="max-w-2xl mx-auto text-muted-foreground">שריינו לעצמכם פגישת היכרות אישית. מספר המקומות מוגבל.</p>
                    </div>

                    <Card className="max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-lg">פרטי רישום</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="familyName">שם משפחה</Label><Input id="familyName" name="familyName" required /></div>
                                        <div className="space-y-2"><Label htmlFor="parentEmail">אימייל הורה</Label><Input id="parentEmail" name="parentEmail" type="email" required /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="parentPhone">טלפון נייד</Label><Input id="parentPhone" name="parentPhone" type="tel" required /></div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="childName">שם הילד/ה</Label><Input id="childName" name="childName" required /></div>
                                        <div className="space-y-2"><Label htmlFor="childAge">גיל הילד/ה</Label><Input id="childAge" name="childAge" type="number" required /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="instrumentInterest">כלי נגינה מעניין</Label><Select name="instrumentInterest" required><SelectTrigger><SelectValue placeholder="בחר/י כלי..." /></SelectTrigger><SelectContent>{instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="font-semibold text-lg">בחירת שעת הגעה</h3>
                                    <RadioGroup value={selectedTime} onValueChange={setSelectedTime} className="max-h-96 overflow-y-auto p-1 border rounded-md">
                                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                                            <Label key={slot} htmlFor={slot} className="flex items-center p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                                <RadioGroupItem value={slot} id={slot} className="hidden" />
                                                <Clock className="w-4 h-4 me-3" />
                                                <span className="font-mono text-lg">{format(new Date(slot), 'HH:mm')}</span>
                                            </Label>
                                        )) : <p className="text-center p-8 text-muted-foreground">כל המקומות תפוסים. נסו מועד אחר.</p>}
                                    </RadioGroup>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" size="lg" className="w-full">אשרו הרשמה</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </section>
        </>
    );
}
