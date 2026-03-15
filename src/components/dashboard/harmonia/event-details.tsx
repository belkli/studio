'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Clock, Edit, ImageOff, MapPin, Printer, UserPlus, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { EventProductionStatus } from '@/lib/types';
import { AssignPerformerDialog } from './assign-performer-dialog';
import { usePhotoConsent } from '@/hooks/use-photo-consent';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SoundCheckScheduler } from './sound-check-scheduler';
import { useTranslations, useLocale } from 'next-intl';


export function EventDetails() {
    const params = useParams();
    const eventId = params.id as string;
    const { user, events, removePerformanceFromEvent, updateEventStatus, updateEvent } = useAuth();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const { toast } = useToast();
    const t = useTranslations('EventDetails');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const statusConfig: Record<EventProductionStatus, { label: string; className: string }> = {
        PLANNING: { label: t('statusPlanning'), className: 'bg-yellow-100 text-yellow-800' },
        OPEN_REGISTRATION: { label: t('statusOpen'), className: 'bg-blue-100 text-blue-800' },
        CLOSED: { label: t('statusClosed'), className: 'bg-gray-100 text-gray-800' },
        COMPLETED: { label: t('statusCompleted'), className: 'bg-green-100 text-green-800' },
    };

    const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    // Fetch photo consent for all performers in this event
    const performerStudentIds = useMemo(
        () => (event?.program ?? []).map(p => p.studentId).filter(Boolean),
        [event]
    );
    const { consentMap: photoConsentMap } = usePhotoConsent(performerStudentIds);

    const handlePrintProgram = () => {
        if (!event) return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // This is a hack to support Hebrew in jsPDF. A proper solution would require embedding a Hebrew-supporting font.
        // For the demo, we will reverse strings.
        const rtl = (text: string | number) => {
            if (typeof text !== 'string') return String(text);
            return isRtl ? text.split('').reverse().join('') : text;
        };

        // The font needs to support Hebrew. 'helvetica' does not. 'arial' is a safer bet on most systems but not guaranteed.
        // For a real app, we'd embed a font like 'Arimo' or 'Rubik'.
        // doc.addFont('Rubik-Regular.ttf', 'Rubik', 'normal'); // Example of embedding
        // doc.setFont('Rubik');

        doc.setFont('helvetica'); // Fallback for demo

        doc.setR2L(isRtl); // Enable Right-to-Left text direction based on locale

        doc.setFontSize(22);
        doc.text(event.name, pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');

        // simple date formatting without explicit locale injection to avoid deep refactoring
        const dateStr = format(new Date(event.eventDate), 'yyyy-MM-dd');
        doc.text(`${dateStr} | ${event.startTime} | ${event.venue}`, pageWidth / 2, 30, { align: 'center' });

        let head = [[t('pdfDuration'), t('pdfComposer'), t('pdfComposition'), t('pdfPerformer')]];
        if (isRtl) {
            head = [[rtl(t('pdfDuration')), rtl(t('pdfComposer')), rtl(t('pdfComposition')), rtl(t('pdfPerformer'))]];
        }

        const body = event.program.map(p => {
            const row = [
                p.duration,
                p.composer,
                p.compositionTitle,
                p.studentName,
            ];
            return isRtl ? row.map(rtl) : row;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).autoTable({
            startY: 45,
            head: head,
            body: body,
            theme: 'striped',
            styles: {
                halign: isRtl ? 'right' : 'left',
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
            title: t('statusUpdatedTitle'),
            description: t('statusUpdatedDesc', { eventName: event.name, statusName: statusConfig[status].label }),
        });
    };

    if (!event) {
        notFound();
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/events">
                        <ArrowLeft className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4 rotate-180"} />
                        {t('backToEvents')}
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
                        <DropdownMenuTrigger asChild>
                            <Badge className={cn("cursor-pointer", statusConfig[event.status].className)}>{statusConfig[event.status].label}</Badge>
                        </DropdownMenuTrigger>
                        {isAdmin && (
                            <DropdownMenuContent align="end">
                                {(Object.keys(statusConfig) as EventProductionStatus[]).map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                                        {statusConfig[s].label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                    <Button variant="outline" asChild><Link href={`/dashboard/events/${event.id}/edit`}><Edit className="me-2 h-4 w-4" />{t('editEvent')}</Link></Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    <CardDescription>{t(`eventTypes.${event.type}`)}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{format(new Date(event.eventDate), 'yyyy-MM-dd', { locale: dateLocale })}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>{event.startTime}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{event.venue}</span></div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{t('programTitle', { count: event.program.length })}</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                                        <UserPlus className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} />{t('addParticipant')}
                                    </Button>
                                    <Button variant="outline" onClick={handlePrintProgram}>
                                        <Printer className={isRtl ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} />{t('printProgram')}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-start">#</TableHead>
                                        <TableHead className="text-start">{t('colPerformer')}</TableHead>
                                        <TableHead className="text-start">{t('colComposition')}</TableHead>
                                        <TableHead className="text-start">{t('colComposer')}</TableHead>
                                        <TableHead className="text-start">{t('colDuration')}</TableHead>
                                        <TableHead className="w-8" title={t('colPhotoConsent')}>
                                            <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TableHead>
                                        <TableHead className="text-end">{t('colActions')}</TableHead>
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
                                            <TableCell>
                                                {photoConsentMap[item.studentId] === false && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="inline-flex">
                                                                    <ImageOff className="h-3.5 w-3.5 text-amber-500" aria-label={t('noPhotoConsentAria')} />
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side={isRtl ? 'right' : 'left'} className="max-w-56 text-xs">
                                                                {t('noPhotoConsentTooltip')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Button variant="ghost" size="icon" onClick={() => removePerformanceFromEvent(event.id, item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">{t('actionRemove')}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">{t('emptyProgram')}</TableCell>
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
