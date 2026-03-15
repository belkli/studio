'use client';

import { useMemo } from 'react';
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, useTranslations } from 'next-intl';

export type WhatsNewItemType =
  | 'announcement'
  | 'event'
  | 'form'
  | 'schedule_change'
  | 'payment'
  | 'master_class';

export interface WhatsNewItem {
  id: string;
  type: WhatsNewItemType;
  title: string;
  description: string;
  createdAt: string;
  link?: string;
  isRead: boolean;
}

const PENDING_FORM_STATUSES = new Set(['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED']);

export function useWhatsNew(userId: string, role: UserRole, conservatoriumId?: string): WhatsNewItem[] {
  const locale = useLocale();
  const t = useTranslations('Dashboard.whatsNewFeed');
  const {
    user,
    users,
    announcements,
    events,
    formSubmissions,
    invoices,
    masterClasses,
  } = useAuth();

  return useMemo(() => {
    const items: WhatsNewItem[] = [];
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    const isAdmin = role === 'site_admin' || role === 'conservatorium_admin' || role === 'delegated_admin';

    const myStudentIds =
      role === 'parent'
        ? users.filter((entry) => entry.parentId === userId).map((entry) => entry.id)
        : [];

    const announcementItems = announcements
      .filter((ann) => {
        if (role === 'site_admin') return true;
        return ann.conservatoriumId === conservatoriumId;
      })
      .slice(0, 6)
      .map<WhatsNewItem>((ann) => {
        const localized = locale !== 'he' && ann.translations?.[locale as keyof typeof ann.translations];
        return {
          id: `announcement-${ann.id}`,
          type: 'announcement',
          title: localized ? localized.title : ann.title,
          description: localized ? localized.body : ann.body,
          createdAt: ann.sentAt,
          link: '/dashboard/announcements',
          isRead: false,
        };
      });

    const eventItems = events
      .filter((event) => {
        if (!event.eventDate) return false;
        const eventTime = new Date(`${event.eventDate}T${event.startTime || '00:00'}:00`).getTime();
        if (Number.isNaN(eventTime) || eventTime < now) return false;
        if (role === 'site_admin') return true;
        return event.conservatoriumId === conservatoriumId;
      })
      .slice(0, 6)
      .map<WhatsNewItem>((event) => ({
        id: `event-${event.id}`,
        type: 'event',
        title: event.name,
        description: event.venue,
        createdAt: `${event.eventDate}T${event.startTime || '00:00'}:00`,
        link: `/dashboard/events/${event.id}`,
        isRead: false,
      }));

    const formItems = formSubmissions
      .filter((form) => {
        if (!PENDING_FORM_STATUSES.has(form.status)) return false;
        if (role === 'site_admin' || role === 'ministry_director') return true;
        if (isAdmin) return form.conservatoriumId === conservatoriumId;
        if (role === 'teacher') return user?.students?.includes(form.studentId) ?? false;
        if (role === 'student') return form.studentId === userId;
        if (role === 'parent') return myStudentIds.includes(form.studentId);
        return false;
      })
      .slice(0, 6)
      .map<WhatsNewItem>((form) => ({
        id: `form-${form.id}`,
        type: 'form',
        title: form.formType,
        description: form.studentName,
        createdAt: form.submissionDate,
        link: `/dashboard/forms/${form.id}`,
        isRead: false,
      }));

    const paymentItems = invoices
      .filter((invoice) => {
        const activeStatus = invoice.status === 'OVERDUE' || invoice.status === 'SENT';
        if (!activeStatus) return false;
        if (role === 'site_admin') return true;
        if (isAdmin) return invoice.conservatoriumId === conservatoriumId;
        if (invoice.payerId === userId) return true;
        if (role === 'parent') return myStudentIds.includes(invoice.payerId);
        return false;
      })
      .slice(0, 6)
      .map<WhatsNewItem>((invoice) => ({
        id: `payment-${invoice.id}`,
        type: 'payment',
        title: t(`invoiceStatuses.${invoice.status as 'SENT' | 'OVERDUE'}`),
        description: t('invoiceDue', {
          date: new Date(invoice.dueDate).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
          amount: invoice.total.toLocaleString(),
        }),
        createdAt: invoice.dueDate,
        link: '/dashboard/billing',
        isRead: false,
      }));

    const scheduleItems = (user?.notifications || [])
      .filter((notification) => {
        const text = `${notification.title} ${notification.message}`.toLowerCase();
        return text.includes('schedule') || text.includes('lesson') || notification.link.includes('/dashboard/schedule');
      })
      .slice(0, 6)
      .map<WhatsNewItem>((notification) => ({
        id: `schedule-${notification.id}`,
        type: 'schedule_change',
        title: notification.title,
        description: notification.message,
        createdAt: notification.timestamp,
        link: notification.link,
        isRead: notification.read,
      }));

    const masterClassItems = masterClasses
      .filter((masterclass) => {
        const eventTime = new Date(masterclass.date).getTime();
        if (Number.isNaN(eventTime) || eventTime < now) return false;
        return true;
      })
      .slice(0, 3)
      .map<WhatsNewItem>((masterclass) => ({
        id: `masterclass-${masterclass.id}`,
        type: 'master_class',
        title: masterclass.title[locale as keyof typeof masterclass.title] || masterclass.title.he || masterclass.title.en || '',
        description: masterclass.instructor.displayName,
        createdAt: masterclass.date,
        link: '/dashboard/alumni',
        isRead: false,
      }));

    items.push(...announcementItems, ...eventItems, ...formItems, ...scheduleItems, ...paymentItems, ...masterClassItems);

    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [
    t,
    locale,
    conservatoriumId,
    announcements,
    events,
    formSubmissions,
    invoices,
    masterClasses,
    role,
    user?.notifications,
    user?.students,
    userId,
    users,
  ]);
}
