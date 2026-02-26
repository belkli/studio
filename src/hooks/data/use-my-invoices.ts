/**
 * @fileoverview Payer-scoped invoice query hook.
 * SDD-P8 (Performance) specifies loading only unpaid/overdue invoices
 * instead of the full invoice history.
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
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

export function useMyInvoices(filters?: InvoiceFilters): UseMyInvoicesReturn {
    const { user, mockInvoices } = useAuth();

    const result = useMemo(() => {
        if (!user || !mockInvoices) {
            return {
                invoices: [],
                unpaidInvoices: [],
                overdueInvoices: [],
                totalOutstanding: 0,
            };
        }

        // Payer-scoped: only show invoices this user is responsible for
        let scopedInvoices = mockInvoices.filter((inv) => {
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

        return {
            invoices: scopedInvoices,
            unpaidInvoices,
            overdueInvoices,
            totalOutstanding,
        };
    }, [user, mockInvoices, filters?.statusFilter, filters?.limit]);

    return {
        ...result,
        isLoading: false,
    };
}
