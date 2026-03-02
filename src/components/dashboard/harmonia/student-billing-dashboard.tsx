'use client';

import { useAuth } from "@/hooks/use-auth";
import { getPlayingSchoolPaymentUrl } from "@/app/actions";
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Receipt, CreditCard, CalendarClock, Package, FileText, Download, PauseCircle, XCircle, Coins, AlertTriangle, ShieldQuestion, School, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Link } from '@/i18n/routing';
import { useMemo, useState } from "react";
import { format, startOfMonth, addMonths, differenceInDays } from 'date-fns';
import { useTranslations } from "next-intl";
import { Notice, NoticeTitle, NoticeDescription } from "@/components/ui/notice";


export function StudentBillingDashboard() {
    const { user, users, mockInvoices, mockPlayingSchoolInvoices, mockPackages, mockLessons, getMakeupCreditBalance } = useAuth();
    const t = useTranslations('StudentBilling');
    const { useDateLocale } = require('@/hooks/use-date-locale'); // Importing inside if missing at top, but usually it's there
    const ti = useTranslations('Invoices');
    const tps = useTranslations('PlayingSchool.programBilling');
    const dateLocale = useDateLocale();

    if (!user) return null;

    const userAndChildrenIds = useMemo(() => {
        if (!user) return [];
        return [user.id, ...(user.childIds || [])];
    }, [user]);

    const userInvoices = mockInvoices.filter(inv => userAndChildrenIds.some(id => inv.payerId === id));

    const makeupCreditBalance = getMakeupCreditBalance(userAndChildrenIds);

    const studentChildren = useMemo(() => {
        if (!user) return [];
        if (user.role === 'student') return [user];
        if (user.childIds && user.childIds.length > 0) {
            return users.filter((u: any) => user.childIds!.includes(u.id));
        }
        return [];
    }, [user, users]);

    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(
        studentChildren.length > 0 ? studentChildren[0].id : undefined
    );
    const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

    const handlePayInvoice = async (invoiceId: string) => {
        setIsProcessingPayment(invoiceId);
        try {
            const { url } = await getPlayingSchoolPaymentUrl(invoiceId);
            window.location.href = url;
        } catch (err) {
            toast({ variant: 'destructive', title: 'Payment Error', description: 'Could not generate payment link. Please try again later.' });
        } finally {
            setIsProcessingPayment(null);
        }
    };

    const activeStudent = useMemo(() => {
        return studentChildren.find(s => s.id === selectedStudentId) || studentChildren[0];
    }, [studentChildren, selectedStudentId]);

    const currentPackage = useMemo(() => {
        if (!activeStudent) return null;

        const pkg = mockPackages.find(p => p.id === activeStudent.packageId);
        if (!pkg) return null;

        let creditsRemaining: number | undefined;
        if (pkg.totalCredits) {
            const lessonsUsed = mockLessons.filter(l => l.studentId === activeStudent.id && l.packageId === pkg.id && l.status === 'COMPLETED').length;
            creditsRemaining = pkg.totalCredits - lessonsUsed;
        }

        let nextBillingDate: string | undefined = undefined;
        if (pkg.type === 'MONTHLY') {
            nextBillingDate = format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd');
        }

        return {
            ...pkg,
            creditsRemaining,
            nextBillingDate,
        };
    }, [mockPackages, user, mockLessons, users, activeStudent]);


    const expiringPackageInfo = useMemo(() => {
        if (!currentPackage || !currentPackage.validUntil) return null;

        const expiryDate = new Date(currentPackage.validUntil);
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());

        if (daysUntilExpiry <= 14 && daysUntilExpiry >= 0) {
            return {
                days: daysUntilExpiry,
                date: format(expiryDate, 'dd/MM/yyyy'),
            };
        }
        return null;
    }, [currentPackage]);


    return (
        <div className="space-y-6">
            {user.role === 'parent' && studentChildren.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {studentChildren.map(child => (
                        <Button
                            key={child.id}
                            variant={selectedStudentId === child.id ? 'default' : 'outline'}
                            onClick={() => setSelectedStudentId(child.id)}
                            className="whitespace-nowrap rounded-full"
                        >
                            {child.name}
                        </Button>
                    ))}
                </div>
            )}
            {expiringPackageInfo && (
                <Notice variant="critical">
                    <AlertTriangle className="absolute left-4 top-4 h-5 w-5" />
                    <NoticeTitle>{t('packageExpiringNotice')}</NoticeTitle>
                    <NoticeDescription>
                        {t('packageExpiringDesc', { days: expiringPackageInfo.days, date: expiringPackageInfo.date })}
                        <Button variant="link" className="p-0 text-red-800 dark:text-red-300">{t('renewNow')}</Button>
                    </NoticeDescription>
                </Notice>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" /> {t('packageStatus')} {activeStudent?.name ? `(${activeStudent.name})` : ''}
                                </CardTitle>
                                <CardDescription className="pt-1">{currentPackage?.title || t('noActivePackage')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">{t('upgradePackage')}</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentPackage?.totalCredits && currentPackage.creditsRemaining !== undefined ? (
                            <div>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-medium">{t('lessonsRemaining')}</span>
                                    <span className="text-lg font-bold">{currentPackage.creditsRemaining} / {currentPackage.totalCredits}</span>
                                </div>
                                <Progress value={(currentPackage.creditsRemaining! / currentPackage.totalCredits) * 100} className="h-2" />
                            </div>
                        ) : currentPackage ? (
                            <div className="text-muted-foreground text-sm">{t('monthlySubNoLimit')}</div>
                        ) : (
                            <div className="text-muted-foreground text-sm">{t('noPackageAssigned')}</div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4" />
                                {currentPackage?.nextBillingDate ? t('nextBilling') : (currentPackage?.validUntil ? t('packageExpiry') : t('status'))}</span>
                            <span className="font-semibold">
                                {currentPackage?.nextBillingDate ? `${format(new Date(currentPackage.nextBillingDate), 'P', { locale: dateLocale })} (${currentPackage.price} ₪)`
                                    : (currentPackage?.validUntil ? format(new Date(currentPackage.validUntil), 'P', { locale: dateLocale }) : t('active'))}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-accent" /> {t('makeupCredits')}</CardTitle>
                        <CardDescription>{t('makeupCreditsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold">{makeupCreditBalance}</div>
                        <p className="text-sm text-muted-foreground mt-1">{t('credits')}</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/dashboard/makeups">
                                {t('manageMakeups')}
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('billingHistory')}</CardTitle>
                        <CardDescription>{t('billingHistoryDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{ti('invoiceNumber')}</TableHead>
                                    <TableHead>{ti('date')}</TableHead>
                                    <TableHead>{ti('details')}</TableHead>
                                    <TableHead>{ti('amount')}</TableHead>
                                    <TableHead>{ti('status')}</TableHead>
                                    <TableHead className="text-left">{ti('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userInvoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{format(new Date(invoice.dueDate), 'P', { locale: dateLocale })}</TableCell>
                                        <TableCell>{invoice.lineItems[0].description}</TableCell>
                                        <TableCell>{invoice.total} ₪</TableCell>
                                        <TableCell><Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : (invoice.status === 'OVERDUE' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800")}>{ti(`statuses.${invoice.status}`)}</Badge></TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">{ti('downloadInvoice')}</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {userInvoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24">{ti('noInvoices')}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {mockPlayingSchoolInvoices && mockPlayingSchoolInvoices.length > 0 && (
                    <Card className="md:col-span-2 border-indigo-100 bg-indigo-50/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <School className="h-5 w-5 text-indigo-600" />
                                {tps('title')}
                            </CardTitle>
                            <CardDescription>{tps('subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{ti('date')}</TableHead>
                                        <TableHead>{ti('details')}</TableHead>
                                        <TableHead>{ti('amount')}</TableHead>
                                        <TableHead>{ti('status')}</TableHead>
                                        <TableHead className="text-left">{ti('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockPlayingSchoolInvoices.map(invoice => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{format(new Date(invoice.dueDate), 'P', { locale: dateLocale })}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{invoice.description}</p>
                                                <p className="text-[10px] text-indigo-600 font-bold uppercase">{tps('subsidyNotice')}</p>
                                            </TableCell>
                                            <TableCell>{invoice.amount} ₪</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                    {ti(`statuses.${invoice.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-left">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => handlePayInvoice(invoice.id)}
                                                    disabled={isProcessingPayment === invoice.id || invoice.status === 'PAID'}
                                                >
                                                    {isProcessingPayment === invoice.id ? <Loader2 className="h-3 w-3 animate-spin me-2" /> : null}
                                                    {invoice.status === 'PAID' ? ti('statuses.PAID') : t('payNow')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
                <div className="space-y-6">
                    <Card className="flex flex-col justify-center p-6">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle>{t('manageSubscription')} {activeStudent?.name ? `(${activeStudent.name})` : ''}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow flex flex-col justify-center gap-2">
                            <Button className="w-full">{t('managePaymentMethods')}</Button>
                            <Button variant="outline" className="w-full text-muted-foreground"><PauseCircle className="ms-2 h-4 w-4" />{t('pauseSubscription')}</Button>
                            <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={() => {
                                // Added onClick handler to demonstrate action per child
                                alert(`ביטול מנוי עבור ${activeStudent?.name || 'התלמיד'}`);
                            }}><XCircle className="ms-2 h-4 w-4" />{t('cancelSubscription')}</Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldQuestion className="h-5 w-5 text-purple-500" /> {t('scholarshipsAndAid')}</CardTitle>
                            <CardDescription>{t('scholarshipsDesc')}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild className="w-full" variant="secondary">
                                <Link href="/dashboard/apply-for-aid">{t('applyForAid')}</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
