import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from 'next-intl';
import { tenantFilter } from '@/lib/tenant-filter';

export function TodaySnapshotCard() {
    const t = useTranslations('TodaySnapshot');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { user, lessons, users, invoices } = useAuth();

    const today = new Date();
    const todayLessons = (user ? tenantFilter(lessons, user) : lessons).filter(lesson => new Date(lesson.startTime).toDateString() === today.toDateString());
    const failedPayments = invoices.filter(inv => inv.status === 'OVERDUE');

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div>
                    <h4 className="text-sm font-semibold mb-2">{t('lessonsToday', { count: todayLessons.length })}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {todayLessons.length > 0 ? todayLessons.map((lesson, index) => {
                            const student = users.find(u => u.id === lesson.studentId);
                            const teacher = users.find(u => u.id === lesson.teacherId);
                            return (
                                <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                    <span className="font-mono text-muted-foreground">{new Date(lesson.startTime).toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="font-medium flex-1">{student?.name}</span>
                                    <span className="text-muted-foreground">{teacher?.name}</span>
                                    <span className="text-muted-foreground">
                                        {lesson.roomId ? t('room', { number: lesson.roomId }) : t('notAssigned')}
                                    </span>
                                    {lesson.status !== 'SCHEDULED' && <Badge variant={lesson.status === 'CANCELLED_STUDENT_NO_NOTICE' ? 'destructive' : 'secondary'}>{lesson.status}</Badge>}
                                </div>
                            )
                        }) : <p className="text-sm text-muted-foreground">{t('noLessons')}</p>}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold mb-2">{t('billingIssues')}</h4>
                    <div className="space-y-2">
                        {failedPayments.length > 0 ? failedPayments.map((payment, index) => {
                            const payer = users.find(u => u.id === payment.payerId);
                            return (
                                <div key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-muted/50">
                                    <span className="font-medium flex-1">{payer?.name}</span>
                                    <Badge variant={'destructive'} className="bg-red-100 text-red-800 border-none">
                                        {t('overdue')}
                                    </Badge>
                                </div>
                            )
                        }) : <p className="text-sm text-muted-foreground">{t('noBillingIssues')}</p>}
                    </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/schedule">
                        {t('fullSchedule')}
                        {isRtl ? (
                            <ArrowLeft className="ms-2 h-4 w-4" />
                        ) : (
                            <ArrowRight className="ms-2 h-4 w-4" />
                        )}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
