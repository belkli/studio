'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { LayoutGrid, List, MoreHorizontal, UserPlus, Send, DollarSign, CheckCircle2, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { useAuth } from '@/hooks/use-auth';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceBooking, PerformanceBookingStatus, PerformanceAssignment } from '@/lib/types';

import { AssignMusicianSheet } from './assign-musician-sheet';
import { SendQuoteDialog } from './send-quote-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LIST_COLUMNS = [
  { id: 'new', statuses: ['INQUIRY_RECEIVED', 'DRAFT', 'PENDING_REVIEW'] as PerformanceBookingStatus[] },
  { id: 'manager_review', statuses: ['ADMIN_REVIEWING', 'MUSICIANS_NEEDED'] as PerformanceBookingStatus[] },
  { id: 'music_review', statuses: ['MUSICIANS_CONFIRMED', 'INVITATIONS_SENT', 'QUOTE_READY'] as PerformanceBookingStatus[] },
  { id: 'price_offered', statuses: ['QUOTE_SENT', 'DEPOSIT_PAID', 'BOOKING_CONFIRMED', 'CONTRACTS_PENDING', 'CONFIRMED', 'COMPLETED', 'EVENT_COMPLETED'] as PerformanceBookingStatus[] },
];

function bookingInColumn(booking: PerformanceBooking, columnId: string) {
  const column = LIST_COLUMNS.find((item) => item.id === columnId);
  return Boolean(column?.statuses.includes(booking.status));
}

/** Returns a short musician status summary: e.g. "2/3 confirmed" */
function MusicianSummary({ booking }: { booking: PerformanceBooking }) {
  const t = useTranslations('PerformanceBooking');
  const musicians = booking.assignedMusicians ?? [];
  if (musicians.length === 0) return <span className="text-xs text-muted-foreground">{t('noMusicians')}</span>;
  const confirmed = musicians.filter(m => m.status === 'accepted').length;
  const total = musicians.length;
  const allConfirmed = confirmed === total;
  const anyDeclined = musicians.some(m => m.status === 'declined');
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${allConfirmed ? 'text-green-700' : anyDeclined ? 'text-red-600' : 'text-amber-700'}`}>
      <Users className="h-3 w-3" />
      {confirmed}/{total} {t('confirmed')}
    </span>
  );
}

const BookingActions = ({
  booking,
  onAssignClick,
  onSendQuoteClick,
  onMarkDepositPaid,
  onConfirmBooking,
  t,
}: {
  booking: PerformanceBooking;
  onAssignClick: () => void;
  onSendQuoteClick: () => void;
  onMarkDepositPaid: () => void;
  onConfirmBooking: () => void;
  t: (key: string) => string;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('actions')}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onAssignClick}>
        <UserPlus className="me-2 h-4 w-4" />
        {t('actionAssignMusicians')}
      </DropdownMenuItem>
      {(booking.status === 'MUSICIANS_CONFIRMED' || booking.status === 'INVITATIONS_SENT' || booking.status === 'QUOTE_READY') && (
        <DropdownMenuItem onClick={onSendQuoteClick}>
          <Send className="me-2 h-4 w-4 text-blue-500" />
          {t('actionSendQuote')}
        </DropdownMenuItem>
      )}
      {booking.status === 'QUOTE_SENT' && (
        <DropdownMenuItem onClick={onMarkDepositPaid}>
          <DollarSign className="me-2 h-4 w-4 text-green-500" />
          {t('actionMarkDepositPaid')}
        </DropdownMenuItem>
      )}
      {booking.status === 'DEPOSIT_PAID' && (
        <DropdownMenuItem onClick={onConfirmBooking}>
          <CheckCircle2 className="me-2 h-4 w-4 text-indigo-500" />
          {t('actionConfirmBooking')}
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export function PerformanceBookingDashboard() {
  const { performanceBookings, user, assignMusiciansToPerformance, updatePerformanceBookingStatus } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('PerformanceBooking');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const dateLocale = useDateLocale();

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PerformanceBooking | null>(null);
  const [quoteBooking, setQuoteBooking] = useState<PerformanceBooking | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const bookings = useMemo(
    () => performanceBookings.filter((item) => item.conservatoriumId === user?.conservatoriumId),
    [performanceBookings, user]
  );

  const bookingsByColumn = useMemo(() => {
    const map: Record<string, PerformanceBooking[]> = {};
    LIST_COLUMNS.forEach((column) => {
      map[column.id] = bookings.filter((booking) => bookingInColumn(booking, column.id));
    });
    return map;
  }, [bookings]);

  const handleAssignClick = (booking: PerformanceBooking) => {
    setSelectedBooking(booking);
    setAssignSheetOpen(true);
  };

  const handleAssignConfirm = (bookingId: string, assignments: Pick<PerformanceAssignment, 'userId' | 'role'>[]) => {
    assignMusiciansToPerformance(bookingId, assignments);
    toast({ title: t('musiciansAssignedTitle'), description: t('musiciansAssignedDesc', { count: assignments.length }) });
  };

  const handleSendQuoteClick = (booking: PerformanceBooking) => setQuoteBooking(booking);

  const handleConfirmSendQuote = (bookingId: string) => {
    updatePerformanceBookingStatus(bookingId, 'QUOTE_SENT');
    toast({ title: t('quoteSentTitle'), description: t('quoteSentDesc', { eventName: quoteBooking?.eventName || '' }) });
    setQuoteBooking(null);
  };

  const handleMarkDepositPaid = (booking: PerformanceBooking) => {
    updatePerformanceBookingStatus(booking.id, 'DEPOSIT_PAID');
    toast({ title: t('depositUpdatedTitle'), description: t('depositUpdatedDesc', { eventName: booking.eventName }) });
  };

  const handleConfirmBooking = (booking: PerformanceBooking) => {
    updatePerformanceBookingStatus(booking.id, 'BOOKING_CONFIRMED');
    toast({ title: t('bookingConfirmedTitle'), description: t('bookingConfirmedDesc', { eventName: booking.eventName }) });
  };

  return (
    <>
      <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-start">{t('title')}</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          <Tabs defaultValue="new" className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
              <TabsTrigger value="new">{t('statusNew')}</TabsTrigger>
              <TabsTrigger value="manager_review">{t('statusManagerReview')}</TabsTrigger>
              <TabsTrigger value="music_review">{t('statusMusicReview')}</TabsTrigger>
              <TabsTrigger value="price_offered">{t('statusPriceOffered')}</TabsTrigger>
            </TabsList>

            {LIST_COLUMNS.map((column) => (
              <TabsContent key={column.id} value={column.id} className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-start">{t('event')}</TableHead>
                          <TableHead className="text-start">{t('client')}</TableHead>
                          <TableHead className="text-start">{t('dateLabel')}</TableHead>
                          <TableHead className="text-start">{t('quoteLabel')}</TableHead>
                          <TableHead className="text-start">{t('musicians')}</TableHead>
                          <TableHead className="text-start">{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(bookingsByColumn[column.id] || []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('noBookingsInStage')}</TableCell>
                          </TableRow>
                        )}
                        {(bookingsByColumn[column.id] || []).map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium text-start">{booking.eventName}</TableCell>
                            <TableCell className="text-start">{booking.clientName}</TableCell>
                            <TableCell className="text-start">{format(new Date(booking.eventDate), 'dd/MM/yyyy', { locale: dateLocale })} · {booking.eventTime}</TableCell>
                            <TableCell className="text-start">{t('currencySymbol')}{booking.totalQuote.toLocaleString()}</TableCell>
                            <TableCell className="text-start"><MusicianSummary booking={booking} /></TableCell>
                            <TableCell className="text-start">
                              <BookingActions
                                booking={booking}
                                onAssignClick={() => handleAssignClick(booking)}
                                onSendQuoteClick={() => handleSendQuoteClick(booking)}
                                onMarkDepositPaid={() => handleMarkDepositPaid(booking)}
                                onConfirmBooking={() => handleConfirmBooking(booking)}
                                t={(key) => t(key as any)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
            {LIST_COLUMNS.map((column) => (
              <div key={column.id} className="w-[min(280px,calc(100vw-32px))] shrink-0 snap-start">
                <div className="sticky top-0 mb-3 bg-background/95 pb-2 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {column.id === 'new' && t('statusNew')}
                      {column.id === 'manager_review' && t('statusManagerReview')}
                      {column.id === 'music_review' && t('statusMusicReview')}
                      {column.id === 'price_offered' && t('statusPriceOffered')}
                    </h3>
                    <Badge variant="secondary">{bookingsByColumn[column.id]?.length || 0}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {(bookingsByColumn[column.id] || []).map((booking) => {
                    const expanded = expandedCardId === booking.id;
                    const musicians = booking.assignedMusicians ?? [];
                    const confirmedCount = musicians.filter(m => m.status === 'accepted').length;
                    const pendingCount = musicians.filter(m => m.status === 'pending').length;
                    return (
                      <Card key={booking.id} className="cursor-pointer" onClick={() => setExpandedCardId(expanded ? null : booking.id)}>
                        <CardHeader className="p-3">
                          <CardTitle className="line-clamp-1 text-sm">{booking.eventName}</CardTitle>
                          <p className="text-xs text-muted-foreground">{booking.clientName}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(booking.eventDate), 'dd/MM/yyyy', { locale: dateLocale })}</p>
                          {musicians.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {t('kanbanMusicians', { total: musicians.length, confirmed: confirmedCount, pending: pendingCount })}
                            </p>
                          )}
                        </CardHeader>
                        {expanded && (
                          <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
                            <p>{t('quoteLabel')}: {t('currencySymbol')}{booking.totalQuote.toLocaleString()}</p>
                            {booking.estimatedMusicianCost ? (
                              <p>{t('estCostLabel')}: {t('currencySymbol')}{booking.estimatedMusicianCost.toLocaleString()}</p>
                            ) : null}
                            <div onClick={(e) => e.stopPropagation()}>
                              <BookingActions
                                booking={booking}
                                onAssignClick={() => handleAssignClick(booking)}
                                onSendQuoteClick={() => handleSendQuoteClick(booking)}
                                onMarkDepositPaid={() => handleMarkDepositPaid(booking)}
                                onConfirmBooking={() => handleConfirmBooking(booking)}
                                t={(key) => t(key as any)}
                              />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                  {(bookingsByColumn[column.id] || []).length === 0 && (
                    <div className="rounded-md border bg-muted/40 p-3 text-center text-xs text-muted-foreground">{t('noBookingsInStage')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AssignMusicianSheet
        booking={selectedBooking}
        open={assignSheetOpen}
        onOpenChange={setAssignSheetOpen}
        onConfirm={handleAssignConfirm}
      />
      <SendQuoteDialog
        booking={quoteBooking}
        open={Boolean(quoteBooking)}
        onOpenChange={() => setQuoteBooking(null)}
        onConfirm={handleConfirmSendQuote}
      />
    </>
  );
}
