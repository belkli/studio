'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function PlayingSchoolPaymentReturnPage() {
    useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('PlayingSchool.wizard');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

    useEffect(() => {
        // Simulate Cardcom callback handling
        const success = searchParams.get('success');
        const id = searchParams.get('enrollmentId');

        setTimeout(() => {
            if (success === 'true') {
                setStatus('success');
                setEnrollmentId(id);
            } else {
                setStatus('error');
            }
        }, 1500);
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Verifying payment status...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
                <Card className="max-w-md w-full text-center shadow-xl">
                    <CardHeader>
                        <XCircle className="h-16 w-16 text-destructive mx-auto" />
                        <CardTitle className="text-2xl mt-4">Payment Failed</CardTitle>
                        <CardDescription>
                            We couldn&apos;t process your payment. Please try again or contact support.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button onClick={() => router.back()}>Try Again</Button>
                        <Button variant="ghost" onClick={() => router.push('/')}>Back to Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
            <Card className="max-w-md w-full text-center shadow-xl">
                <CardHeader>
                    <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mt-4">{t('success')}</CardTitle>
                    <CardDescription>
                        Registration successful! Enrollment ID: {enrollmentId}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm text-right bg-muted/50 rounded-lg p-4">
                        <p className="font-bold mb-2">{t('pickupNote')}</p>
                        <p>{t('pickupNoteFull')}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button className="w-full gap-2" onClick={() => router.push('/dashboard/family')}>
                            Go to Family Dashboard <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="w-full gap-2" onClick={() => router.push('/')}>
                            <Home className="h-4 w-4" /> Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
