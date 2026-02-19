'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Printer, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { EventProductionStatus } from '@/lib/types';


const statusConfig: Record<EventProductionStatus, { label: string; className: string }> = {
    PLANNING: { label: 'בתכנון', className: 'bg-yellow-100 text-yellow-800' },
    OPEN_REGISTRATION: { label: 'הרשמה פתוחה', className: 'bg-blue-100 text-blue-800' },
    CLOSED: { label: 'הרשמה סגורה', className: 'bg-gray-100 text-gray-800' },
    COMPLETED: { label: 'הושלם', className: 'bg-green-100 text-green-800' },
};


export function EventDetails() {
    const params = useParams();
    const eventId = params.id as string;
    const { mockEvents } = useAuth();

    const event = useMemo(() => mockEvents.find(e => e.id === eventId), [mockEvents, eventId]);

    if (!event) {
        notFound();
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/events">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        חזרה לכל האירועים
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Badge className={statusConfig[event.status].className}>{statusConfig[event.status].label}</Badge>
                    <Button variant="outline"><Edit className="ms-2 h-4 w-4"/>ערוך פרטי אירוע</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    <CardDescription>{event.type}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/><span>{format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: he })}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4"/><span>{event.startTime}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4"/><span>{event.venue}</span></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>תוכנית האירוע ({event.program.length} משתתפים)</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline"><UserPlus className="ms-2 h-4 w-4"/>הוסף משתתף</Button>
                             <Button variant="outline"><Printer className="ms-2 h-4 w-4"/>הדפס תוכניה</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>מבצע/ת</TableHead>
                                <TableHead>יצירה</TableHead>
                                <TableHead>מלחין</TableHead>
                                <TableHead className="text-left">משך</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.program.length > 0 ? event.program.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{item.studentName}</TableCell>
                                    <TableCell>{item.compositionTitle}</TableCell>
                                    <TableCell>{item.composer}</TableCell>
                                    <TableCell className="text-left font-mono">{item.duration}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">טרם שובצו משתתפים לתוכנית.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
