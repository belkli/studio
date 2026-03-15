'use client';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Eye, Check, ThumbsDown, Edit, RotateCcw, X, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from '@/components/ui/empty-state';
import { isInUserApprovalQueue, isOverdue } from '@/lib/form-utils';

type BulkAction = 'approve' | 'reject' | 'request_revision';

const ApprovalsTable = ({
    forms,
    onApprove,
    onReject,
    showActions,
    onBulkAction,
    allowBulkActions,
}: {
    forms: FormSubmission[],
    onApprove: (form: FormSubmission) => void,
    onReject: (form: FormSubmission) => void,
    showActions: boolean,
    onBulkAction: (action: BulkAction, selectedIds: string[]) => Promise<void>,
    allowBulkActions: boolean,
}) => {

    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();
    const t = useTranslations("ApprovalsPage");
    const tc = useTranslations('Common.shared');

    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedRows(forms.map(f => f.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleRowSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedRows([...selectedRows, id]);
        } else {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        }
    };

    const handleBulkAction = async (action: BulkAction) => {
        if (selectedRows.length === 0) {
            toast({ description: t('selectItemsFirst'), variant: 'destructive' });
            return;
        }

        const selectedCount = selectedRows.length;
        await onBulkAction(action, selectedRows);
        setSelectedRows([]);
        toast({ description: t('bulkActionSuccess', { count: selectedCount }) });
    };

    if (forms.length === 0) {
        return <p className="text-center text-muted-foreground p-8">{t('noForms')}</p>;
    }

    return (
        <div>
            {allowBulkActions && selectedRows.length > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">
                        {t('selectedCount', { count: selectedRows.length })}
                    </span>
                    <div className="ms-auto flex gap-2">
                        <Button size="sm" onClick={() => handleBulkAction('approve')}>
                            <Check className="me-1 h-4 w-4" />
                            {t('approve')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction('request_revision')}>
                            <RotateCcw className="me-1 h-4 w-4" />
                            {t('requestRevision')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reject')}>
                            <X className="me-1 h-4 w-4" />
                            {t('reject')}
                        </Button>
                    </div>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                onCheckedChange={handleSelectAll}
                                checked={selectedRows.length === forms.length && forms.length > 0}
                                aria-label={t('selectAll')}
                            />
                        </TableHead>
                        <TableHead className="text-start">{tc('studentName')}</TableHead>
                        <TableHead className="text-start">{t('type')}</TableHead>
                        <TableHead className="text-start">{t('conservatorium')}</TableHead>
                        <TableHead className="text-start">{tc('status')}</TableHead>
                        <TableHead className="text-start">{tc('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map(form => {
                        const canRevise = (user?.role === 'conservatorium_admin' || user?.role === 'site_admin' || user?.role === 'delegated_admin') && form.status === 'REVISION_REQUIRED';

                        return (
                            <TableRow key={form.id} data-state={selectedRows.includes(form.id) ? "selected" : ""}>
                                <TableCell>
                                    <Checkbox
                                        onCheckedChange={(checked) => handleRowSelect(form.id, !!checked)}
                                        checked={selectedRows.includes(form.id)}
                                        aria-label={t('selectRow')}
                                    />
                                </TableCell>
                                <TableCell className="font-medium text-start">
                                    <Link href={`/dashboard/forms/${form.id}?from=approvals`} className="hover:underline">{form.studentName}</Link>
                                </TableCell>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <TableCell className="text-start">{t(`formTypes.${form.formType}` as any) || form.formType}</TableCell>
                                <TableCell className="text-start">{form.conservatoriumName}</TableCell>
                                <TableCell className="text-start">
                                    <span className="inline-flex">
                                        <StatusBadge status={form.status} />
                                    </span>
                                </TableCell>
                                <TableCell className="text-start">
                                    <div className="flex justify-start gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/forms/${form.id}?from=approvals`}>
                                                <Eye className="me-1 h-4 w-4" />
                                                {tc('view')}
                                            </Link>
                                        </Button>

                                        {showActions && (
                                            <>
                                                {canRevise ? (
                                                    <Button asChild variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                                        <Link href={`/dashboard/forms/${form.id}?edit=true&from=approvals`}>
                                                            <Edit className="me-1 h-4 w-4" />
                                                            {t('reviseAndSend')}
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button variant="outline" size="sm" onClick={() => onApprove(form)} className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                                                            <Check className="me-1 h-4 w-4" />
                                                            {t('approve')}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => onReject(form)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                            <ThumbsDown className="me-1 h-4 w-4" />
                                                            {t('reject')}
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

export default function ApprovalsPage() {
    const { user, formSubmissions, updateForm } = useAuth();
    const { toast } = useToast();
    const t = useTranslations("ApprovalsPage");
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const { myQueue, allPending, overdueForms } = useMemo(() => {
        if (!user) return { myQueue: [], allPending: [], overdueForms: [] };

        const openStatuses: FormSubmission['status'][] = ['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED', 'APPROVED'];
        const myQueueForms = formSubmissions.filter((form) => isInUserApprovalQueue(form, user));

        const allPendingForms = formSubmissions.filter((form) => {
            if (!openStatuses.includes(form.status)) {
                return false;
            }

            if (user.role === 'conservatorium_admin' || user.role === 'delegated_admin') {
                return form.conservatoriumId === user.conservatoriumId;
            }

            if (user.role === 'teacher') {
                return Boolean(user.students?.includes(form.studentId));
            }

            return true;
        });

        const overdueFormsList = allPendingForms.filter(form => isOverdue(form));

        return { myQueue: myQueueForms, allPending: allPendingForms, overdueForms: overdueFormsList };
    }, [user, formSubmissions]);

    const handleApprove = (form: FormSubmission) => {
        let nextStatus: FormSubmission['status'] | null = null;
        if (form.status === 'PENDING_TEACHER') nextStatus = 'PENDING_ADMIN';
        if (form.status === 'PENDING_ADMIN') nextStatus = 'APPROVED';
        if (form.status === 'APPROVED' && user?.role === 'ministry_director') nextStatus = 'FINAL_APPROVED';

        if (nextStatus) {
            updateForm({ ...form, status: nextStatus });
            toast({ title: t('formApproved'), description: t('formApprovedDesc', { name: form.studentName }) });
        }
    };

    const handleReject = (form: FormSubmission) => {
        let newStatus: FormSubmission['status'] = 'REJECTED';
        if (form.status === 'APPROVED' && user?.role === 'ministry_director') {
            newStatus = 'REVISION_REQUIRED';
        }
        updateForm({ ...form, status: newStatus });
        const titleKey = newStatus === 'REJECTED' ? 'formRejected' : 'formNeedsRevision';
        const action = newStatus === 'REJECTED' ? 'rejected' : 'returned for revisions';
        toast({ variant: "destructive", title: t(titleKey), description: t('formRejectedDesc', { name: form.studentName, action }) });
    };

    const handleBulkAction = async (action: BulkAction, selectedIds: string[]) => {
        const selectedForms = myQueue.filter((form) => selectedIds.includes(form.id));

        selectedForms.forEach((form) => {
            if (action === 'approve') {
                handleApprove(form);
                return;
            }

            if (action === 'request_revision') {
                if (form.status !== 'REVISION_REQUIRED') {
                    updateForm({ ...form, status: 'REVISION_REQUIRED' });
                }
                return;
            }

            handleReject(form);
        });
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-start">
                <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
                <p className="text-start text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Tabs defaultValue="my-queue" dir={isRtl ? 'rtl' : 'ltr'}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="my-queue">
                        {t('tabs.myQueue')}
                        {myQueue.length > 0 && (
                            <span
                                className="ms-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
                                aria-live="polite"
                                aria-label={t('queueCount', { count: myQueue.length })}
                            >
                                {myQueue.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all-open">{t('tabs.allOpen')}</TabsTrigger>
                    <TabsTrigger value="overdue">
                        {t('tabs.overdue')}
                        {overdueForms.length > 0 && (
                            <span className="ms-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                                {overdueForms.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="my-queue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('myQueueTitle')}</CardTitle>
                            <CardDescription>{t('myQueueDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {myQueue.length === 0 ? (
                                <EmptyState
                                    icon={PartyPopper}
                                    title={t('allCaughtUp')}
                                    description={t('noPendingApprovals')}
                                />
                            ) : (
                                <ApprovalsTable
                                    forms={myQueue}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    showActions={true}
                                    onBulkAction={handleBulkAction}
                                    allowBulkActions={Boolean(user && (user.role === 'conservatorium_admin' || user.role === 'delegated_admin' || user.role === 'site_admin'))}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="all-open" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('allOpenTitle')}</CardTitle>
                            <CardDescription>{t('allOpenDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ApprovalsTable
                                forms={allPending}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                showActions={false}
                                onBulkAction={handleBulkAction}
                                allowBulkActions={false}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="overdue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('overdueTitle')}</CardTitle>
                            <CardDescription>{t('overdueDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {overdueForms.length === 0 ? (
                                <EmptyState
                                    icon={PartyPopper}
                                    title={t('allCaughtUp')}
                                    description={t('noOverdueForms')}
                                />
                            ) : (
                                <ApprovalsTable
                                    forms={overdueForms}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    showActions={true}
                                    onBulkAction={handleBulkAction}
                                    allowBulkActions={Boolean(user && (user.role === 'conservatorium_admin' || user.role === 'delegated_admin' || user.role === 'site_admin'))}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
