'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Clock, Info, CheckCircle2, Phone, Mail, LogOut, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function PendingApprovalPage() {
    const { logout } = useAuth();
    const t = useTranslations('Dashboard.PendingApproval');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
            <Card className="max-w-2xl w-full border-t-4 border-t-accent shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-accent animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-bold">{t('title')}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-muted p-6 rounded-xl border space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Info className="h-5 w-5 text-accent" />
                            {t('steps.title')}
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <span>{t('steps.review')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <span>{t('steps.contact')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <span>{t('steps.notify')}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg bg-card shadow-sm">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">08-9467890</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg bg-card shadow-sm">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">office@harmony.org.il</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground italic">
                        {t('support')}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button variant="outline" className="w-full sm:flex-1" asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            {t('backToSite')}
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full sm:flex-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('logout')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
