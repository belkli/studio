'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

export function useAdminGuard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin' && user.role !== 'delegated_admin'))) {
            router.replace('/dashboard');
        }
    }, [user, isLoading, router]);

    return { user, isLoading };
}
