'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Printer, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { EventProductionStatus } from '@/lib/types';
import { AssignPerformerDialog } from './assign-performer-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SoundCheckScheduler } from './sound-check-scheduler';


const statusConfig: Record<EventProductionStatus, { label: string; className: string }> = {
    PLANNING: { label: 'בתכנון', className: 'bg-yellow-100 text-yellow-800' },
    OPEN_REGISTRATION: { label: 'הרשמה פתוחה', className: 'bg-blue-100 text-blue-800' },
    CLOSED: { label: 'הרשמה סגורה', className: 'bg-gray-100 text-gray-800' },
    COMPLETED: { label: 'הושלם', className: 'bg-green-100 text-green-800' },
};


export function EventDetails() {
    const params = useParams();
    const eventId = params.id as string;
    const { user, mockEvents, removePerformanceFromEvent, updateEventStatus, updateEvent } = useAuth();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const { toast } = useToast();

    const event = useMemo(() => mockEvents.find(e => e.id === eventId), [mockEvents, eventId]);
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    const handlePrintProgram = () => {
        if (!event) return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // This is a hack to support Hebrew in jsPDF. A proper solution would require embedding a Hebrew-supporting font.
        // For the demo, we will reverse strings.
        const rtl = (text: string | number) => typeof text === 'string' ? text.split('').reverse().join('') : String(text);
        
        // The font needs to support Hebrew. 'helvetica' does not. 'arial' is a safer bet on most systems but not guaranteed.
        // For a real app, we'd embed a font like 'Arimo' or 'Rubik'.
        // doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal'); // Example of embedding
        // doc.setFont('Rubik');

        doc.setFont('helvetica'); // Fallback for demo

        doc.setR2L(true); // Enable Right-to-Left text direction

        doc.setFontSize(22);
        doc.text(event.name, pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(new Date(event.eventDate), 'EEEE, dd MMMM yyyy', { locale: he })} | ${event.startTime} | ${event.venue}`, pageWidth / 2, 30, { align: 'center' });

        const head = [[rtl('משך'), rtl('מלחין'), rtl('יצירה'), rtl('מבצע/ת')]];
        const body = event.program.map(p => [
            rtl(p.duration),
            rtl(p.composer),
            rtl(p.compositionTitle),
            rtl(p.studentName),
        ]);

        (doc as any).autoTable({
            startY: 45,
            head: head,
            body: body,
            theme: 'striped',
            styles: {
                halign: 'right',
                font: 'helvetica',
                // font: 'Rubik', // Use the embedded font
            },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: 255,
                fontStyle: 'bold',
            },
            bodyStyles: {
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
        });

        doc.save(`${event.name}_program.pdf`);
    };

    const handleStatusChange = (status: EventProductionStatus) => {
        if (!event) return;
        updateEventStatus(event.id, status);
        toast({
            title: "סטטוס האירוע עודכן",
            description: `האירוע "${event.name}" עודכן לסטטוס: ${statusConfig[status].label}`,
        });
    };

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Badge className={cn("cursor-pointer", statusConfig[event.status].className)}>{statusConfig[event.status].label}</Badge>
                        </DropdownMenuTrigger>
                        {isAdmin && (
                            <DropdownMenuContent>
                                {(Object.keys(statusConfig) as EventProductionStatus[]).map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                                        {statusConfig[s].label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
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

            <div className="grid lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>תוכנית האירוע ({event.program.length} משתתפים)</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                                        <UserPlus className="ms-2 h-4 w-4"/>הוסף משתתף
                                    </Button>
                                     <Button variant="outline" onClick={handlePrintProgram}>
                                        <Printer className="ms-2 h-4 w-4"/>הדפס תוכניה
                                    </Button>
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
                                        <TableHead>משך</TableHead>
                                        <TableHead className="text-left">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {event.program.length > 0 ? event.program.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{item.studentName}</TableCell>
                                            <TableCell>{item.compositionTitle}</TableCell>
                                            <TableCell>{item.composer}</TableCell>
                                            <TableCell className="font-mono">{item.duration}</TableCell>
                                            <TableCell className="text-left">
                                                <Button variant="ghost" size="icon" onClick={() => removePerformanceFromEvent(event.id, item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">הסר</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">טרם שובצו משתתפים לתוכנית.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                 </div>
                 <div className="lg:col-span-1">
                     <SoundCheckScheduler event={event} onUpdate={updateEvent} />
                 </div>
            </div>
            <AssignPerformerDialog
                eventId={event.id}
                open={isAssignDialogOpen}
                onOpenChange={setIsAssignDialogOpen}
            />
        </div>
    )
}
