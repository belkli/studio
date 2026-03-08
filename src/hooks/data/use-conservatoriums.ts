/**
 * @fileoverview Conservatorium list query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with conservatoriums already loaded in the
 * AuthProvider. Once a dedicated /api/conservatoriums endpoint exists,
 * swap the queryFn.
 *
 * Benefits over the previous approach:
 *  - Conservatorium data has its own cache entry — mutations in other
 *    domains do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility for debugging staleness.
 *  - Consumers can invalidate via queryKeys to force a refetch.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { Conservatorium } from '@/lib/types';

const CONSERVATORIUMS_KEY = 'conservatoriums';

export interface UseConservatoriumsReturn {
  conservatoriums: Conservatorium[];
  isLoading: boolean;
}

export function useConservatoriums(): UseConservatoriumsReturn {
  const { conservatoriums: contextConservatoriums } = useAuth();

  const { data: conservatoriums, isLoading } = useQuery<Conservatorium[]>({
    queryKey: [CONSERVATORIUMS_KEY],
    queryFn: () => contextConservatoriums ?? [],
    initialData: contextConservatoriums ?? [],
    staleTime: 5 * 60 * 1000,
  });

  return {
    conservatoriums: conservatoriums ?? [],
    isLoading,
  };
}
