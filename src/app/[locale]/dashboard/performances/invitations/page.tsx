'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useDateLocale } from '@/hooks/use-date-locale';
import type { PerformanceBooking, PerformanceAssignment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Music, Calendar, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

function StatusBadge({ status }: { status: PerformanceAssignment['status'] }) {
  const t = useTranslations('PerformanceInvitations');
  const map: Record<PerformanceAssignment['status'], string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    opted_out: 'bg-gray-100 text-gray-700',
  };
  return (
    <Badge className={`${map[status]} hover:${map[status]}`}>
      {t(`status_${status}`)}
    </Badge>
  );
}

function RoleBadge({ role }: { role: PerformanceAssignment['role'] }) {
  const t = useTranslations('PerformanceInvitations');
  return <Badge variant="outline" className="text-xs">{t(`role_${role}`)}</Badge>;
}

interface InvitationCardProps {
  booking: PerformanceBooking;
  assignment: PerformanceAssignment;
  onAccept: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
}

function InvitationCard({ booking, assignment, onAccept, onDecline }: InvitationCardProps) {
  const t = useTranslations('PerformanceInvitations');
  const dateLocale = useDateLocale();
  const durationHours = booking.eventDurationHours ?? 2;
  const estimatedEarnings = (assignment.ratePerHour ?? 0) * durationHours;
  const isPending = assignment.status === 'pending';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{booking.eventName}</CardTitle>
            <CardDescription>{booking.eventType}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <RoleBadge role={assignment.role} />
            <StatusBadge status={assignment.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{format(new Date(booking.eventDate), 'dd/MM/yyyy', { locale: dateLocale })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{booking.eventTime} ({durationHours}h)</span>
          </div>
          {assignment.ratePerHour ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>₪{assignment.ratePerHour}/{t('perHour')} · {t('estimatedEarnings')}: ₪{estimatedEarnings.toLocaleString()}</span>
            </div>
          ) : null}
        </div>

        {isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAccept(booking.id)}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {t('acceptBtn')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onDecline(booking.id)}
            >
              <XCircle className="me-2 h-4 w-4" />
              {t('declineBtn')}
            </Button>
          </div>
        )}
        {!isPending && assignment.responseAt && (
          <p className="text-xs text-muted-foreground">
            {t('respondedAt')}: {format(new Date(assignment.responseAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
          </p>
        )}
        {assignment.status === 'declined' && assignment.declineReason && (
          <p className="text-xs text-muted-foreground">
            {t('declineReason')}: {assignment.declineReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PerformanceInvitationsPage() {
  const { user, performanceBookings, respondToPerformanceInvitation } = useAuth();
  const t = useTranslations('PerformanceInvitations');
  const { toast } = useToast();
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';

  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Find all performance bookings where this user is assigned
  const myInvitations = useMemo(() => {
    if (!user) return [];
    return performanceBookings
      .map(booking => {
        const assignment = booking.assignedMusicians?.find(m => m.userId === user.id);
        if (!assignment) return null;
        return { booking, assignment };
      })
      .filter((item): item is { booking: PerformanceBooking; assignment: PerformanceAssignment } => item !== null)
      .sort((a, b) => new Date(a.booking.eventDate).getTime() - new Date(b.booking.eventDate).getTime());
  }, [performanceBookings, user]);

  const pendingInvitations = myInvitations.filter(i => i.assignment.status === 'pending');
  const pastInvitations = myInvitations.filter(i => i.assignment.status !== 'pending');

  const handleAccept = (bookingId: string) => {
    if (!user) return;
    respondToPerformanceInvitation(bookingId, user.id, true);
    toast({ title: t('acceptedTitle'), description: t('acceptedDesc') });
  };

  const handleDeclineClick = (bookingId: string) => {
    setDeclineBookingId(bookingId);
    setDeclineReason('');
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = () => {
    if (!user || !declineBookingId) return;
    respondToPerformanceInvitation(declineBookingId, user.id, false, declineReason || undefined);
    toast({ title: t('declinedTitle'), description: t('declinedDesc') });
    setDeclineDialogOpen(false);
    setDeclineBookingId(null);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('pageSubtitle')}</p>
      </div>

      <Tabs defaultValue="pending" dir={isRtl ? 'rtl' : 'ltr'}>
        <TabsList>
          <TabsTrigger value="pending">
            {t('pendingTab')}
            {pendingInvitations.length > 0 && (
              <span className="ms-2 inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">{t('historyTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingInvitations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Music className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('noPending')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingInvitations.map(({ booking, assignment }) => (
                <InvitationCard
                  key={booking.id}
                  booking={booking}
                  assignment={assignment}
                  onAccept={handleAccept}
                  onDecline={handleDeclineClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {pastInvitations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Music className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t('noHistory')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastInvitations.map(({ booking, assignment }) => (
                <InvitationCard
                  key={booking.id}
                  booking={booking}
                  assignment={assignment}
                  onAccept={handleAccept}
                  onDecline={handleDeclineClick}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decline reason dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('declineDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="decline-reason">{t('declineReasonLabel')}</Label>
            <Textarea
              id="decline-reason"
              placeholder={t('declineReasonPlaceholder')}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              {t('cancelBtn')}
            </Button>
            <Button variant="destructive" onClick={handleDeclineConfirm}>
              {t('confirmDeclineBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
