/**
 * @fileoverview Lesson package query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with lesson packages already loaded in the
 * AuthProvider. Once a dedicated /api/lesson-packages endpoint exists,
 * swap the queryFn.
 *
 * Benefits over the previous approach:
 *  - Package data has its own cache entry — mutations in other domains
 *    do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility for debugging staleness.
 *  - Consumers can invalidate via queryKeys to force a refetch.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { LessonPackage } from '@/lib/types';

const LESSON_PACKAGES_KEY = 'lesson-packages';

export interface UseLessonPackagesReturn {
  packages: LessonPackage[];
  activePackage: LessonPackage | undefined;
  isLoading: boolean;
}

export function useLessonPackages(): UseLessonPackagesReturn {
  const { user, lessonPackages: contextPackages } = useAuth();

  const { data: packages, isLoading } = useQuery<LessonPackage[]>({
    queryKey: [LESSON_PACKAGES_KEY, user?.id ?? ''],
    queryFn: () => contextPackages ?? [],
    initialData: contextPackages ?? [],
    staleTime: 60 * 1000,
  });

  const activePackage = useMemo(
    () => (packages ?? []).find(p => p.isActive),
    [packages],
  );

  return {
    packages: packages ?? [],
    activePackage,
    isLoading,
  };
}
