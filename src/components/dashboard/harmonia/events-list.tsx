'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Calendar, Clock, MapPin, Ticket, ArrowLeft, AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations } from 'next-intl';

export function EventsList() {
    const t = useTranslations('Events');
    const dateLocale = useDateLocale();
    const { events: allEvents, user } = useAuth();
    const events = allEvents.filter(e => e.conservatoriumId === user?.conservatoriumId);

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <Card key={event.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>{event.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="me-2 h-4 w-4" />
                            <span>{format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: dateLocale })} בשעה {event.startTime}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="me-2 h-4 w-4" />
                            <span>{event.program.length} משתתפים</span>
                        </div>
                        {event.isPublic && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Ticket className="me-2 h-4 w-4" />
                                <span>{(event.ticketPrice ?? 0) > 0 ? `₪${event.ticketPrice}` : 'חינם'}</span>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={`/dashboard/events/${event.id}`}>
                                נהל אירוע
                                <ArrowLeft className="ms-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
