'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PerformanceBooking, PerformanceBookingStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Send, DollarSign, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssignMusicianDialog } from './assign-musician-dialog';
import { useToast } from '@/hooks/use-toast';
import { SendQuoteDialog } from './send-quote-dialog';
import { useTranslations } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

const BookingCard = ({ booking, onAssignClick, onSendQuoteClick, onMarkDepositPaid, onConfirmBooking, t, dateLocale }: {
    booking: PerformanceBooking;
    onAssignClick: () => void;
    onSendQuoteClick: () => void;
    onMarkDepositPaid: () => void;
    onConfirmBooking: () => void;
    t: any;
    dateLocale: any;
}) => (
    <Card className="mb-4">
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base">{booking.eventName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{booking.clientName}</p>
                </div>
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onAssignClick}>
                            <UserPlus className="w-4 h-4 me-2" />
                            {t('actionAssignMusicians')}
                        </DropdownMenuItem>
                        {booking.status === 'MUSICIANS_CONFIRMED' && (
                            <DropdownMenuItem onClick={onSendQuoteClick}>
                                <Send className="w-4 h-4 me-2 text-blue-500" />
                                {t('actionSendQuote')}
                            </DropdownMenuItem>
                        )}
                        {booking.status === 'QUOTE_SENT' && (
                            <DropdownMenuItem onClick={onMarkDepositPaid}>
                                <DollarSign className="w-4 h-4 me-2 text-green-500" />
                                {t('actionMarkDepositPaid')}
                            </DropdownMenuItem>
                        )}
                        {booking.status === 'DEPOSIT_PAID' && (
                            <DropdownMenuItem onClick={onConfirmBooking}>
                                <CheckCircle2 className="w-4 h-4 me-2 text-indigo-500" />
                                {t('actionConfirmBooking')}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm space-y-2">
            <p><strong>{t('dateLabel')}</strong> {format(new Date(booking.eventDate), 'dd/MM/yyyy', { locale: dateLocale })} @ {booking.eventTime}</p>
            <p><strong>{t('typeLabel')}</strong> {booking.eventType}</p>
            <p><strong>{t('quoteLabel')}</strong> {t('currencySymbol')}{booking.totalQuote.toLocaleString()}</p>
            {booking.assignedMusicians && booking.assignedMusicians.length > 0 && (
                <p><strong>{t('assignedLabel')}</strong> {booking.assignedMusicians.map(m => m.name).join(', ')}</p>
            )}
        </CardContent>
    </Card>
);

export function PerformanceBookingDashboard() {
    const { mockPerformanceBookings, user, assignMusiciansToPerformance, updatePerformanceBookingStatus } = useAuth();
    const { toast } = useToast();
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<PerformanceBooking | null>(null);
    const [quoteBooking, setQuoteBooking] = useState<PerformanceBooking | null>(null);

    const t = useTranslations('PerformanceBooking');
    const dateLocale = useDateLocale();

    const pipelineStages: { id: PerformanceBookingStatus; title: string }[] = useMemo(() => [
        { id: 'INQUIRY_RECEIVED', title: t('stageInquiryReceived') },
        { id: 'ADMIN_REVIEWING', title: t('stageAdminReviewing') },
        { id: 'MUSICIANS_CONFIRMED', title: t('stageMusiciansConfirmed') },
        { id: 'QUOTE_SENT', title: t('stageQuoteSent') },
        { id: 'DEPOSIT_PAID', title: t('stageDepositPaid') },
        { id: 'BOOKING_CONFIRMED', title: t('stageBookingConfirmed') },
        { id: 'EVENT_COMPLETED', title: t('stageEventCompleted') },
    ], [t]);

    const bookingsByStage = useMemo(() => {
        const stages: Record<string, PerformanceBooking[]> = {};
        pipelineStages.forEach(stage => stages[stage.id] = []);
        mockPerformanceBookings
            .filter(b => b.conservatoriumId === user?.conservatoriumId)
            .forEach(booking => {
                if (stages[booking.status]) {
                    stages[booking.status].push(booking);
                }
            });
        return stages;
    }, [mockPerformanceBookings, user, pipelineStages]);

    const handleAssignClick = (booking: PerformanceBooking) => {
        setSelectedBooking(booking);
        setAssignDialogOpen(true);
    };

    const handleAssignConfirm = (bookingId: string, musicianIds: string[]) => {
        assignMusiciansToPerformance(bookingId, musicianIds);
        toast({
            title: t('musiciansAssignedTitle'),
            description: t('musiciansAssignedDesc', { count: musicianIds.length }),
        });
    };

    const handleSendQuoteClick = (booking: PerformanceBooking) => {
        setQuoteBooking(booking);
    };

    const handleConfirmSendQuote = (bookingId: string, message: string) => {
        updatePerformanceBookingStatus(bookingId, 'QUOTE_SENT');
        toast({
            title: t('quoteSentTitle'),
            description: t('quoteSentDesc', { eventName: quoteBooking?.eventName || '' }),
        });
        setQuoteBooking(null);
    }

    const handleMarkDepositPaid = (booking: PerformanceBooking) => {
        updatePerformanceBookingStatus(booking.id, 'DEPOSIT_PAID');
        toast({
            title: t('depositUpdatedTitle'),
            description: t('depositUpdatedDesc', { eventName: booking.eventName }),
        });
    };

    const handleConfirmBooking = (booking: PerformanceBooking) => {
        updatePerformanceBookingStatus(booking.id, 'BOOKING_CONFIRMED');
        toast({
            title: t('bookingConfirmedTitle'),
            description: t('bookingConfirmedDesc', { eventName: booking.eventName }),
        });
    };

    return (
        <>
            <div className="flex gap-4 overflow-x-auto p-1">
                {pipelineStages.map(stage => (
                    <div key={stage.id} className="min-w-[300px] flex-1">
                        <h3 className="font-semibold text-lg p-2 mb-2">{stage.title} ({bookingsByStage[stage.id]?.length || 0})</h3>
                        <div className="bg-muted/50 rounded-lg p-2 h-full">
                            {bookingsByStage[stage.id]?.length > 0 ? (
                                bookingsByStage[stage.id].map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        onAssignClick={() => handleAssignClick(booking)}
                                        onSendQuoteClick={() => handleSendQuoteClick(booking)}
                                        onMarkDepositPaid={() => handleMarkDepositPaid(booking)}
                                        onConfirmBooking={() => handleConfirmBooking(booking)}
                                        t={t}
                                        dateLocale={dateLocale}
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                    {t('noBookingsInStage')}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <AssignMusicianDialog
                booking={selectedBooking}
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                onConfirm={handleAssignConfirm}
            />
            <SendQuoteDialog
                booking={quoteBooking}
                open={!!quoteBooking}
                onOpenChange={() => setQuoteBooking(null)}
                onConfirm={handleConfirmSendQuote}
            />
        </>
    );
}
