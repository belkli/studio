'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect, useRef } from 'react';

export function useAdminGuard() {
    const { user, isLoading } = useAuth();

    // useRouter requires intl context — may not be available during SSR.
    const routerRef = useRef<ReturnType<typeof useRouter> | null>(null);
    try {
        const r = useRouter();
        routerRef.current = r;
    } catch {
        // SSR: intl context not yet available
    }

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin' && user.role !== 'delegated_admin'))) {
            routerRef.current?.replace('/dashboard');
        }
    }, [user, isLoading]);

    return { user, isLoading };
}
