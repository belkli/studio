'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { EventEditForm } from '@/components/dashboard/harmonia/event-edit-form';

export default function EditEventPage() {
  const { user, mockEvents } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('Events');
  const isRtl = locale === 'he' || locale === 'ar';

  const eventId = params.id as string;
  const event = useMemo(() => mockEvents.find((item) => item.id === eventId), [mockEvents, eventId]);
  const canAccess = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

  useEffect(() => {
    if (user && !canAccess) router.push('/403');
  }, [user, canAccess, router]);

  if (!event) {
    return <div dir={isRtl ? 'rtl' : 'ltr'} className="p-6 text-sm text-muted-foreground">{t('eventNotFound')}</div>;
  }

  if (!canAccess) {
    return null;
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-4">
      <h1 className="text-2xl font-bold text-start">{t('editEventDetails')}</h1>
      <EventEditForm event={event} />
    </div>
  );
}
