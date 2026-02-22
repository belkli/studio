
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, PlusCircle, History } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he, en, ru, ar } from 'date-fns/locale';
import { useParams } from 'next/navigation';

const localesArr: { [key: string]: Locale } = { he, en, ru, ar };

export default function MakeupsPage() {
    const { user, getMakeupCreditBalance, getMakeupCreditsDetail } = useAuth();
    const t = useTranslations('Dashboard.makeups');
    const { locale } = useParams();

    const dateLocale = localesArr[locale as string] || he;

    const userAndChildrenIds = useMemo(() => {
        if (!user) return [];
        return [user.id, ...(user.childIds || [])];
    }, [user]);

    const makeupCreditBalance = getMakeupCreditBalance(userAndChildrenIds);
    const creditsDetail = getMakeupCreditsDetail(userAndChildrenIds);

    if (!user) return null;

    const statusStyles: { [key: string]: string } = {
        AVAILABLE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        USED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        EXPIRED: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-accent" />
                            {t('balanceCard.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('balanceCard.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="text-6xl font-bold">{makeupCreditBalance}</div>
                        <p className="text-muted-foreground">{t('balanceCard.unit')}</p>
                    </CardContent>
                </Card>

                <Card className="flex flex-col items-center justify-center border-dashed">
                    <CardHeader className="text-center">
                        <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                        <CardTitle className="mt-4">{t('bookCard.title')}</CardTitle>
                        <CardDescription>
                            {t('bookCard.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild disabled={makeupCreditBalance <= 0}>
                            <Link href="/dashboard/schedule/book?type=makeup">
                                {t('bookCard.button')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {t('details.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {creditsDetail.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {t('details.empty')}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('details.table.source')}</TableHead>
                                        <TableHead>{t('details.table.grantedAt')}</TableHead>
                                        <TableHead>{t('details.table.expiresAt')}</TableHead>
                                        <TableHead className="text-right">{t('details.table.status')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditsDetail.map((credit) => (
                                        <TableRow key={credit.id}>
                                            <TableCell className="font-medium">
                                                {t(`details.reasons.${credit.reason}`)}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(credit.grantedAt), 'PP', { locale: dateLocale })}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(credit.expiresAt), 'PP', { locale: dateLocale })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={statusStyles[credit.status as keyof typeof statusStyles]}>
                                                    {t(`details.statuses.${credit.status}`)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
