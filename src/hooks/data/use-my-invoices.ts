/**
 * @fileoverview Payer-scoped invoice query hook backed by React Query.
 *
 * During the migration from the monolithic useAuth() context, this hook
 * seeds React Query's cache with invoices already loaded in the
 * AuthProvider. Once a dedicated /api/invoices endpoint exists, swap
 * the queryFn.
 *
 * Benefits over the previous pure-useMemo version:
 *  - Invoice data has its own cache entry — mutations in other domains
 *    (lessons, users, forms) do NOT cause this hook to re-compute.
 *  - React Query DevTools visibility.
 *  - Consumers can call `queryClient.invalidateQueries(queryKeys.invoices.all)`
 *    to force a refetch after a payment mutation.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys } from '@/lib/query-keys';
import type { Invoice, InvoiceStatus } from '@/lib/types';

export interface InvoiceFilters {
    statusFilter?: InvoiceStatus[];
    limit?: number;
}

export interface UseMyInvoicesReturn {
    invoices: Invoice[];
    isLoading: boolean;
    unpaidInvoices: Invoice[];
    overdueInvoices: Invoice[];
    totalOutstanding: number;
}

function scopeAndCategorizeInvoices(
    allInvoices: Invoice[],
    user: { id: string; role: string; conservatoriumId?: string },
    filters?: InvoiceFilters,
) {
    // Payer-scoped: only show invoices this user is responsible for
    let scopedInvoices = allInvoices.filter((inv) => {
        if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
            return inv.conservatoriumId === user.conservatoriumId;
        }
        return inv.payerId === user.id;
    });

    // Status filter
    if (filters?.statusFilter?.length) {
        scopedInvoices = scopedInvoices.filter(i => filters.statusFilter!.includes(i.status));
    }

    // Sort by due date (most urgent first)
    scopedInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Apply limit
    if (filters?.limit) {
        scopedInvoices = scopedInvoices.slice(0, filters.limit);
    }

    const unpaidInvoices = scopedInvoices.filter(i => i.status === 'SENT' || i.status === 'PENDING' as any);
    const overdueInvoices = scopedInvoices.filter(i => i.status === 'OVERDUE');
    const totalOutstanding = [...unpaidInvoices, ...overdueInvoices].reduce(
        (sum, i) => sum + i.total, 0
    );

    return { invoices: scopedInvoices, unpaidInvoices, overdueInvoices, totalOutstanding };
}

export function useMyInvoices(filters?: InvoiceFilters): UseMyInvoicesReturn {
    const { user, invoices: contextInvoices } = useAuth();

    const { data: allInvoices, isLoading: queryLoading } = useQuery<Invoice[]>({
        queryKey: queryKeys.invoices.all,
        queryFn: () => contextInvoices ?? [],
        initialData: contextInvoices ?? [],
        staleTime: 60 * 1000,
    });

    const result = useMemo(() => {
        if (!user || !allInvoices?.length) {
            return {
                invoices: [],
                unpaidInvoices: [],
                overdueInvoices: [],
                totalOutstanding: 0,
            };
        }
        return scopeAndCategorizeInvoices(allInvoices, user, filters);
    }, [user, allInvoices, filters]);

    return {
        ...result,
        isLoading: queryLoading,
    };
}
