'use client';
import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Ticket, Minus, Plus, Users, Music } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export function PublicEventPage() {
    const params = useParams();
    const eventId = params.id as string;
    const { mockEvents } = useAuth();
    const { toast } = useToast();
    const [ticketCount, setTicketCount] = useState(1);

    const event = useMemo(() => mockEvents.find(e => e.id === eventId), [mockEvents, eventId]);
    const heroImage = PlaceHolderImages.find(img => img.id === 'event-wedding');

    if (!event) {
        return notFound();
    }

    const handleTicketPurchase = () => {
        toast({
            title: 'ההזמנה הושלמה!',
            description: `${ticketCount} כרטיסים הוזמנו. אישור נשלח למייל.`,
        });
    };

    return (
        <div className="bg-muted/20">
            <section className="relative w-full h-[50vh] flex items-center justify-center text-center text-white bg-slate-800">
                {heroImage && <Image src={heroImage.imageUrl} alt={heroImage.description} layout="fill" objectFit="cover" className="z-0 brightness-50" data-ai-hint={heroImage.imageHint} priority />}
                <div className="relative z-10 p-4 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">{event.name}</h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200">
                        {event.type === 'RECITAL' ? 'הצטרפו אלינו לקונצרט מיוחד המציג את תלמידינו המוכשרים.' : 'ערב של מוזיקה משובחת עם מיטב המבצעים שלנו.'}
                    </p>
                </div>
            </section>

            <div className="container -mt-20 z-20 relative pb-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>תוכנית האירוע</CardTitle>
                                <CardDescription>הרפרטואר שיבוצע על ידי אמנינו הצעירים.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {event.program.length > 0 ? (
                                    <ul className="space-y-4">
                                        {event.program.map(perf => (
                                            <li key={perf.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                                                <div>
                                                    <p className="font-semibold">{perf.compositionTitle}</p>
                                                    <p className="text-sm text-muted-foreground">{perf.composer}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">{perf.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">מבצע/ת</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">התוכניה המלאה תפורסם בקרוב.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>פרטי האירוע</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: he })}</span></div>
                                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span>{event.startTime}</span></div>
                                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{event.venue}</span></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>רכישת כרטיסים</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(event.ticketPrice ?? 0) > 0 ? (
                                    <>
                                        <div className="flex items-center justify-center gap-4">
                                            <Button variant="outline" size="icon" onClick={() => setTicketCount(c => Math.max(1, c - 1))}><Minus className="h-4 w-4" /></Button>
                                            <span className="text-2xl font-bold w-12 text-center">{ticketCount}</span>
                                            <Button variant="outline" size="icon" onClick={() => setTicketCount(c => c + 1)}><Plus className="h-4 w-4" /></Button>
                                        </div>
                                        <Separator />
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">סה"כ לתשלום</p>
                                            <p className="text-3xl font-bold">₪{(event.ticketPrice ?? 0) * ticketCount}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center font-medium text-lg">הכניסה חופשית</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" size="lg" onClick={handleTicketPurchase}>
                                    <Ticket className="me-2 h-5 w-5" /> הזמן כרטיסים
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
