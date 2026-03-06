/**
 * @fileoverview Student makeup credit query hook.
 * SDD-P1 & SDD-P6 specify that makeup credits must be explicit
 * documents with full lifecycle tracking (AVAILABLE → REDEEMED | EXPIRED).
 */
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { MakeupCredit } from '@/lib/types';

export interface UseMakeupCreditsReturn {
    credits: MakeupCredit[];
    availableCredits: MakeupCredit[];
    redeemedCredits: MakeupCredit[];
    expiredCredits: MakeupCredit[];
    availableCount: number;
    isLoading: boolean;
}

export function useMakeupCredits(studentId?: string): UseMakeupCreditsReturn {
    const { user, makeupCredits } = useAuth();

    const result = useMemo(() => {
        const targetId = studentId || user?.id;
        if (!targetId || !makeupCredits) {
            return {
                credits: [],
                availableCredits: [],
                redeemedCredits: [],
                expiredCredits: [],
                availableCount: 0,
            };
        }

        // For parents, show credits for all children
        let credits: MakeupCredit[];
        if (user?.role === 'parent' && user.childIds?.length) {
            credits = makeupCredits.filter(c => user.childIds!.includes(c.studentId));
        } else {
            credits = makeupCredits.filter(c => c.studentId === targetId);
        }

        const now = new Date().toISOString();

        const availableCredits = credits.filter(c =>
            c.status === 'AVAILABLE' && c.expiresAt > now
        );
        const redeemedCredits = credits.filter(c => c.status === 'REDEEMED');
        const expiredCredits = credits.filter(c =>
            c.status === 'EXPIRED' || (c.status === 'AVAILABLE' && c.expiresAt <= now)
        );

        return {
            credits,
            availableCredits,
            redeemedCredits,
            expiredCredits,
            availableCount: availableCredits.length,
        };
    }, [user, studentId, makeupCredits]);

    return {
        ...result,
        isLoading: false,
    };
}
