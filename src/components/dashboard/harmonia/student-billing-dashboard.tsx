'use client';

import { useAuth } from "@/hooks/use-auth";
import { getPlayingSchoolPaymentUrl } from "@/app/actions";
import { cancelPackageAction } from "@/app/actions/billing";
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CalendarClock, Package, Download, PauseCircle, XCircle, Coins, AlertTriangle, ShieldQuestion, School, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Link } from '@/i18n/routing';
import { useMemo, useState } from "react";
import { format, startOfMonth, addMonths, differenceInDays } from 'date-fns';
import { useTranslations, useLocale } from "next-intl";
import { Notice, NoticeTitle, NoticeDescription } from "@/components/ui/notice";
import { useDateLocale } from "@/hooks/use-date-locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatWithVAT } from "@/lib/vat";


export function StudentBillingDashboard() {
    const { user, users, invoices, playingSchoolInvoices, packages, lessons, getMakeupCreditBalance } = useAuth();
    const t = useTranslations('StudentBilling');
    const ti = useTranslations('Invoices');
    const tps = useTranslations('PlayingSchool.programBilling');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    const userAndChildrenIds = useMemo(() => {
        if (!user) return [];
        return [user.id, ...(user.childIds || [])];
    }, [user]);

    const studentChildren = useMemo(() => {
        if (!user) return [];
        if (user.role === 'student') return [user];
        if (user.childIds && user.childIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return users.filter((u: any) => user.childIds!.includes(u.id));
        }
        return [];
    }, [user, users]);

    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(
        studentChildren.length > 0 ? studentChildren[0].id : undefined
    );
    const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

    const activeStudent = useMemo(() => {
        return studentChildren.find(s => s.id === selectedStudentId) || studentChildren[0];
    }, [studentChildren, selectedStudentId]);

    const currentPackage = useMemo(() => {
        if (!activeStudent) return null;

        const pkg = packages.find(p => p.id === activeStudent.packageId);
        if (!pkg) return null;

        let creditsRemaining: number | undefined;
        if (pkg.totalCredits) {
            const lessonsUsed = lessons.filter(l => l.studentId === activeStudent.id && l.packageId === pkg.id && l.status === 'COMPLETED').length;
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
    }, [packages, lessons, activeStudent]);


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

    if (!user) return null;

    const userInvoices = invoices.filter(inv => userAndChildrenIds.some(id => inv.payerId === id));

    const makeupCreditBalance = getMakeupCreditBalance(userAndChildrenIds);

    const handlePayInvoice = async (invoiceId: string) => {
        setIsProcessingPayment(invoiceId);
        try {
            const { url } = await getPlayingSchoolPaymentUrl(invoiceId);
            window.location.href = url;
        } catch {
            toast({ variant: 'destructive', title: 'Payment Error', description: 'Could not generate payment link. Please try again later.' });
        } finally {
            setIsProcessingPayment(null);
        }
    };


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
                    <AlertTriangle className="absolute start-4 top-4 h-5 w-5" />
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
                            <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>{t('upgradePackage')}</Button>
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
                                {currentPackage?.nextBillingDate ? `${format(new Date(currentPackage.nextBillingDate), 'P', { locale: dateLocale })} (${formatWithVAT(currentPackage.price, locale)})`
                                    : (currentPackage?.validUntil ? format(new Date(currentPackage.validUntil), 'P', { locale: dateLocale }) : t('active'))}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
                    <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                            <DialogTitle>{t('upgradePackage')}</DialogTitle>
                            <DialogDescription>{t('selectPackageDesc')}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 mt-2">
                            {[
                                { type: 'PACK_5', label: t('pack5Label'), price: '₪450', credits: 5 },
                                { type: 'PACK_10', label: t('pack10Label'), price: '₪850', credits: 10 },
                                { type: 'MONTHLY', label: t('monthlyLabel'), price: '₪320', credits: null },
                            ].map(pkg => (
                                <div key={pkg.type} className="flex items-center justify-between border rounded-lg p-4">
                                    <div>
                                        <p className="font-semibold">{pkg.label}</p>
                                        <p className="text-sm text-muted-foreground">{pkg.price}{pkg.credits ? ` · ${pkg.credits} ${t('lessons')}` : ''}</p>
                                    </div>
                                    <Button size="sm" onClick={() => { toast({ title: t('packageSelected') }); setUpgradeOpen(false); }}>
                                        {t('select')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen}>
                    <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                            <DialogTitle>{t('managePaymentMethods')}</DialogTitle>
                            <DialogDescription>{t('paymentMethodsDesc')}</DialogDescription>
                        </DialogHeader>
                        <div className="border rounded-lg p-4 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {t('cardEndingIn', { suffix: '****' })}
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    toast({ title: t('managePaymentMethods'), description: t('removeCardPending') });
                                    setPaymentMethodsOpen(false);
                                }}
                            >
                                {t('removeCard')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

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
                                    <TableHead className="text-start">{ti('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userInvoices.map(invoice => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{format(new Date(invoice.dueDate), 'P', { locale: dateLocale })}</TableCell>
                                        <TableCell>{invoice.lineItems[0].description}</TableCell>
                                        <TableCell>{formatWithVAT(invoice.total, locale)}</TableCell>
                                        <TableCell><Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : (invoice.status === 'OVERDUE' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800")}>{ti(`statuses.${invoice.status}`)}</Badge></TableCell>
                                        <TableCell className="text-start">
                                            <Button variant="ghost" size="icon" onClick={() => window.open(`/api/invoice-pdf/${invoice.id}`, '_blank')}>
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

                {playingSchoolInvoices && playingSchoolInvoices.length > 0 && (
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
                                        <TableHead className="text-start">{ti('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {playingSchoolInvoices.map(invoice => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{format(new Date(invoice.dueDate), 'P', { locale: dateLocale })}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{invoice.description}</p>
                                                <p className="text-[10px] text-indigo-600 font-bold uppercase">{tps('subsidyNotice')}</p>
                                            </TableCell>
                                            <TableCell>{formatWithVAT(invoice.amount, locale)}</TableCell>
                                            <TableCell>
                                                <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'} className={invoice.status === 'PAID' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                    {ti(`statuses.${invoice.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-start">
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
                            <Button className="w-full" onClick={() => setPaymentMethodsOpen(true)}>{t('managePaymentMethods')}</Button>
                            <Button
                                variant="outline"
                                className="w-full text-muted-foreground"
                                disabled={isPausing || !currentPackage}
                                onClick={async () => {
                                    if (!currentPackage) return;
                                    setIsPausing(true);
                                    try {
                                        const result = await cancelPackageAction({ packageId: currentPackage.id });
                                        if (result.success) {
                                            toast({
                                                title: t('pauseSubscription'),
                                                description: result.withinCoolingOff
                                                    ? t('pausedWithinCoolingOff')
                                                    : t('pausedConfirmation'),
                                            });
                                        }
                                    } catch {
                                        toast({ variant: 'destructive', title: t('pauseSubscription'), description: t('pauseError') });
                                    } finally {
                                        setIsPausing(false);
                                    }
                                }}
                            >
                                {isPausing ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <PauseCircle className="ms-2 h-4 w-4" />}
                                {t('pauseSubscription')}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive"><XCircle className="ms-2 h-4 w-4" />{t('cancelSubscription')}</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('cancelSubscription')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {`Are you sure you want to cancel the subscription for ${activeStudent?.name || 'this student'}? This action cannot be undone.`}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('cancel') || 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isCancelling}
                                    onClick={async () => {
                                        if (!currentPackage) return;
                                        setIsCancelling(true);
                                        try {
                                            const result = await cancelPackageAction({ packageId: currentPackage.id });
                                            if (result.success) {
                                                toast({
                                                    title: t('cancelSubscription'),
                                                    description: result.withinCoolingOff
                                                        ? 'הביטול התבצע בתוך תקופת ההתנסות (14 ימים). זכאי/ת להחזר מלא.'
                                                        : 'הביטול יכנס לתוקף תוך 3 ימי עסקים.',
                                                });
                                            }
                                        } catch {
                                            toast({ variant: 'destructive', title: t('cancelSubscription'), description: 'אירעה שגיאה. אנא נסה שוב.' });
                                        } finally {
                                            setIsCancelling(false);
                                        }
                                    }}
                                >
                                            {t('cancelSubscription')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
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
