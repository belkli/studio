'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';

/**
 * Hook to protect admin-only routes.
 * Redirects non-admin users to the dashboard.
 */
export function useAdminGuard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            const isAdmin = user.role === 'site_admin' || user.role === 'conservatorium_admin';

            if (!isAdmin) {
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, router]);

    return { user, isLoading };
}
