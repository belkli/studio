/**
 * @fileoverview Student-scoped repertoire query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with repertoire and compositions already loaded
 * in the AuthProvider. Once dedicated endpoints exist, swap the queryFn.
 *
 * Benefits over the previous pure-useMemo version:
 *  - Repertoire data has its own cache entry — mutations in other domains
 *    do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility for debugging staleness.
 *  - Consumers can invalidate via queryKeys to force a refetch.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { AssignedRepertoire, Composition } from '@/lib/types';

const REPERTOIRE_KEY = 'my-repertoire';
const COMPOSITIONS_KEY = 'compositions';

export interface UseMyRepertoireReturn {
  repertoire: AssignedRepertoire[];
  compositions: Composition[];
  isLoading: boolean;
}

export function useMyRepertoire(): UseMyRepertoireReturn {
  const { user, assignedRepertoire: contextRepertoire, compositions: contextCompositions } = useAuth();

  const { data: repertoire, isLoading: repLoading } = useQuery<AssignedRepertoire[]>({
    queryKey: [REPERTOIRE_KEY, user?.id ?? ''],
    queryFn: () => contextRepertoire ?? [],
    initialData: contextRepertoire ?? [],
    staleTime: 30 * 1000,
  });

  const { data: compositions, isLoading: compLoading } = useQuery<Composition[]>({
    queryKey: [COMPOSITIONS_KEY],
    queryFn: () => contextCompositions ?? [],
    initialData: contextCompositions ?? [],
    staleTime: 60 * 1000,
  });

  return {
    repertoire: repertoire ?? [],
    compositions: compositions ?? [],
    isLoading: repLoading || compLoading,
  };
}
