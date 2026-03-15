'use client';

import { useState, type ElementType } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, Users, Banknote, Search, CheckCircle2, XCircle, Clock, Hourglass, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import type { ApplicationStatus, DonationCauseCategory } from '@/lib/types';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const causeSchema = z.object({
  nameHe: z.string().min(2),
  nameEn: z.string().min(2),
  descriptionHe: z.string().min(2),
  descriptionEn: z.string().min(2),
  category: z.enum(['financial_aid', 'excellence', 'equipment', 'events', 'general']),
  targetAmountILS: z.coerce.number().min(0).optional(),
});

type CauseFormData = z.infer<typeof causeSchema>;

export default function AdminScholarshipsPage() {
  const { user, isLoading } = useAdminGuard();
  const {
    scholarshipApplications,
    donationCauses,
    updateScholarshipStatus,
    markScholarshipAsPaid,
    addDonationCause,
  } = useAuth();
  const t = useTranslations('AdminScholarships');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const causeForm = useForm<CauseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(causeSchema) as any,
    defaultValues: {
      nameHe: '',
      nameEn: '',
      descriptionHe: '',
      descriptionEn: '',
      category: 'general',
      targetAmountILS: undefined,
    },
  });

  if (isLoading || !user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statusConfig: Record<ApplicationStatus, { label: string; icon: ElementType; className: string }> = {
    DRAFT: { label: t('statuses.DRAFT'), icon: Clock, className: 'bg-gray-100 text-gray-800' },
    SUBMITTED: { label: t('statuses.SUBMITTED'), icon: Hourglass, className: 'bg-blue-100 text-blue-800' },
    DOCUMENTS_PENDING: { label: t('statuses.DOCUMENTS_PENDING'), icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    UNDER_REVIEW: { label: t('statuses.UNDER_REVIEW'), icon: Hourglass, className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: t('statuses.APPROVED'), icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
    PARTIALLY_APPROVED: { label: t('statuses.PARTIALLY_APPROVED'), icon: CheckCircle2, className: 'bg-green-100 text-green-800' },
    WAITLISTED: { label: t('statuses.WAITLISTED'), icon: Clock, className: 'bg-purple-100 text-purple-800' },
    REJECTED: { label: t('statuses.REJECTED'), icon: XCircle, className: 'bg-red-100 text-red-800' },
    EXPIRED: { label: t('statuses.EXPIRED'), icon: XCircle, className: 'bg-gray-100 text-gray-800' },
  };

  const applications = scholarshipApplications.filter((app) => app.conservatoriumId === user.conservatoriumId);

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await Promise.resolve(updateScholarshipStatus(applicationId, 'APPROVED'));
      toast({ description: t('approvedSuccess') });
    } catch {
      toast({ description: t('actionError'), variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await Promise.resolve(updateScholarshipStatus(applicationId, 'REJECTED'));
      toast({ description: t('rejectedSuccess') });
    } catch {
      toast({ description: t('actionError'), variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkPaid = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      await Promise.resolve(markScholarshipAsPaid(applicationId));
      toast({ description: t('paidSuccess') });
    } catch {
      toast({ description: t('actionError'), variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const submitCause = (values: CauseFormData) => {
    addDonationCause({
      names: { he: values.nameHe, en: values.nameEn },
      descriptions: { he: values.descriptionHe, en: values.descriptionEn },
      category: values.category as DonationCauseCategory,
      targetAmountILS: values.targetAmountILS,
    });
    toast({ description: t('causeAddedSuccess') });
    causeForm.reset();
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('fundManagement')}</h2>
          <p className="text-muted-foreground">{t('fundManagementDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">{t('exportDonations')}</Button>
          <Button>{t('addManualDonation')}</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFundThisYear')}</CardTitle>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪185,000</div>
            <p className="text-xs text-muted-foreground">{t('yearOverYear', { percent: '12' })}</p>
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('approvedScholarships')}</CardTitle>
            <HandCoins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪42,500</div>
            <p className="text-xs text-muted-foreground">{t('forStudents', { count: '24' })}</p>
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingApplications')}</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.filter((a) => a.status === 'SUBMITTED').length}</div>
            <p className="text-xs text-muted-foreground">{t('totalDemand', { amount: '12,000' })}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('scholarshipApplications')}</CardTitle>
          <CardDescription>{t('scholarshipApplicationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4 gap-2">
            <Input placeholder={t('searchStudent')} className="max-w-sm" />
            <Button variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('student')}</TableHead>
                  <TableHead className="text-start">{t('instrument')}</TableHead>
                  <TableHead className="text-start">{t('submissionDate')}</TableHead>
                  <TableHead className="text-start">{t('priorityScore')}</TableHead>
                  <TableHead className="text-start">{t('status')}</TableHead>
                  <TableHead className="text-end">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const StatusIcon = statusConfig[app.status]?.icon || Clock;
                  const isBusy = processingId === app.id;
                  const canApprove = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'DOCUMENTS_PENDING';
                  const canReject = app.status !== 'REJECTED' && app.status !== 'EXPIRED';
                  const canMarkPaid = app.status === 'APPROVED' && app.paymentStatus !== 'PAID';

                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.studentName}</TableCell>
                      <TableCell>{app.instrument}</TableCell>
                      <TableCell>{new Date(app.submittedAt).toLocaleDateString(locale)}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{app.priorityScore}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[app.status].className}>
                          <StatusIcon className="w-3 h-3 me-1.5" />
                          {statusConfig[app.status].label}
                        </Badge>
                        {app.paymentStatus === 'PAID' && <Badge className="ms-2">{t('paidBadge')}</Badge>}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(app.id)} disabled={!canApprove || isBusy}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('approve')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(app.id)} disabled={!canReject || isBusy}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('reject')}
                          </Button>
                          <Button size="sm" onClick={() => handleMarkPaid(app.id)} disabled={!canMarkPaid || isBusy}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('markPaid')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('causeSettingsTitle')}</CardTitle>
          <CardDescription>{t('causeSettingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...causeForm}>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={causeForm.handleSubmit(submitCause as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              {/* eslint-disable @typescript-eslint/no-explicit-any */}
              <FormField control={causeForm.control as any} name="nameHe" render={({ field }) => (
                <FormItem><FormLabel>{t('causeNameHe')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={causeForm.control as any} name="nameEn" render={({ field }) => (
                <FormItem><FormLabel>{t('causeNameEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={causeForm.control as any} name="descriptionHe" render={({ field }) => (
                <FormItem><FormLabel>{t('causeDescHe')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={causeForm.control as any} name="descriptionEn" render={({ field }) => (
                <FormItem><FormLabel>{t('causeDescEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={causeForm.control as any} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('causeCategory')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="financial_aid">{t('categoryFinancialAid')}</SelectItem>
                      <SelectItem value="excellence">{t('categoryExcellence')}</SelectItem>
                      <SelectItem value="equipment">{t('categoryEquipment')}</SelectItem>
                      <SelectItem value="events">{t('categoryEvents')}</SelectItem>
                      <SelectItem value="general">{t('categoryGeneral')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={causeForm.control as any} name="targetAmountILS" render={({ field }) => (
                <FormItem><FormLabel>{t('causeTargetAmount')}</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {/* eslint-enable @typescript-eslint/no-explicit-any */}
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">{t('addCause')}</Button>
              </div>
            </form>
          </Form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {donationCauses
              .filter((cause) => cause.conservatoriumId === user.conservatoriumId && cause.isActive)
              .sort((a, b) => a.priority - b.priority)
              .map((cause) => (
                <div key={cause.id} className="rounded-md border p-3">
                  <p className="font-medium">{locale === 'he' || !cause.names.en ? cause.names.he : cause.names[locale as keyof typeof cause.names] || cause.names.en}</p>
                  <p className="text-sm text-muted-foreground">{locale === 'he' || !cause.descriptions.en ? cause.descriptions.he : cause.descriptions[locale as keyof typeof cause.descriptions] || cause.descriptions.en}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
