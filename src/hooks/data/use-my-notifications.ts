/**
 * @fileoverview User notification query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with notifications from the User object.
 * Once a dedicated /api/notifications endpoint exists, swap the queryFn.
 *
 * Benefits over the previous approach:
 *  - Notification data has its own cache entry — mutations in other domains
 *    do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility for debugging staleness.
 *  - Consumers can invalidate via queryKeys to force a refetch.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';

const NOTIFICATIONS_KEY = 'my-notifications';

export interface UseMyNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export function useMyNotifications(): UseMyNotificationsReturn {
  const { user } = useAuth();
  const contextNotifications = user?.notifications ?? [];

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: [NOTIFICATIONS_KEY, user?.id ?? ''],
    queryFn: () => contextNotifications,
    initialData: contextNotifications,
    staleTime: 15 * 1000,
  });

  const unreadCount = useMemo(
    () => (notifications ?? []).filter(n => !n.read).length,
    [notifications],
  );

  return {
    notifications: notifications ?? [],
    unreadCount,
    isLoading,
  };
}
