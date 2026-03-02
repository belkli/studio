'use client';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Check, ThumbsDown, Edit, Download, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

const ApprovalsTable = ({
    forms,
    onApprove,
    onReject,
    showActions
}: {
    forms: FormSubmission[],
    onApprove: (form: FormSubmission) => void,
    onReject: (form: FormSubmission) => void,
    showActions: boolean
}) => {

    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const { user } = useAuth();
    const t = useTranslations("ApprovalsPage");

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

    if (forms.length === 0) {
        return <p className="text-center text-muted-foreground p-8">{t('noForms')}</p>;
    }

    return (
        <div>
            {user && (user.role === 'conservatorium_admin' || user.role === 'site_admin') && (
                <div className="flex items-center gap-2 mb-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={selectedRows.length === 0}>
                                <MoreHorizontal className="me-2 h-4 w-4" />
                                {t('bulkActions')} ({selectedRows.length})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                <Check className="ms-2 h-4 w-4 text-green-500" />
                                {t('approveAllSelected')}
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <Download className="ms-2 h-4 w-4" />
                                {t('exportAsPdf')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                onCheckedChange={handleSelectAll}
                                checked={selectedRows.length === forms.length && forms.length > 0}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>{t('studentName')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead>{t('conservatorium')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead className="text-left">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map(form => {
                        const canRevise = (user?.role === 'conservatorium_admin' || user?.role === 'site_admin') && form.status === 'REVISION_REQUIRED';

                        return (
                            <TableRow key={form.id} data-state={selectedRows.includes(form.id) ? "selected" : ""}>
                                <TableCell>
                                    <Checkbox
                                        onCheckedChange={(checked) => handleRowSelect(form.id, !!checked)}
                                        checked={selectedRows.includes(form.id)}
                                        aria-label="Select row"
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/forms/${form.id}`} className="hover:underline">{form.studentName}</Link>
                                </TableCell>
                                <TableCell>{form.formType}</TableCell>
                                <TableCell>{form.conservatoriumName}</TableCell>
                                <TableCell><StatusBadge status={form.status} /></TableCell>
                                <TableCell className="text-left">
                                    <div className="flex justify-end gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/forms/${form.id}`}>
                                                <Eye className="ms-1 h-4 w-4" />
                                                {t('view')}
                                            </Link>
                                        </Button>

                                        {showActions && (
                                            <>
                                                {canRevise ? (
                                                    <Button asChild variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                                        <Link href={`/dashboard/forms/${form.id}?edit=true`}>
                                                            <Edit className="ms-1 h-4 w-4" />
                                                            {t('reviseAndSend')}
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button variant="outline" size="sm" onClick={() => onApprove(form)} className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                                                            <Check className="ms-1 h-4 w-4" />
                                                            {t('approve')}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => onReject(form)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                            <ThumbsDown className="ms-1 h-4 w-4" />
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
    const { user, mockFormSubmissions, updateForm } = useAuth();
    const { toast } = useToast();
    const t = useTranslations("ApprovalsPage");

    const { myQueue, allPending } = useMemo(() => {
        if (!user) return { myQueue: [], allPending: [] };

        const myQueueForms: FormSubmission[] = [];
        const allPendingForms = mockFormSubmissions.filter(form => form.status !== 'DRAFT' && form.status !== 'REJECTED' && form.status !== 'FINAL_APPROVED');

        mockFormSubmissions.forEach(form => {
            let isInMyQueue = false;

            switch (user.role) {
                case 'teacher':
                    if (form.status === 'PENDING_TEACHER' && user.students?.includes(form.studentId)) {
                        isInMyQueue = true;
                    }
                    break;
                case 'conservatorium_admin':
                    if ((form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED') && form.conservatoriumId === user.conservatoriumId) {
                        isInMyQueue = true;
                    }
                    break;
                case 'site_admin':
                    if (form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED') {
                        isInMyQueue = true;
                    }
                    break;
                case 'ministry_director':
                    if (form.status === 'APPROVED') {
                        isInMyQueue = true;
                    }
                    break;
            }

            if (isInMyQueue) {
                myQueueForms.push(form);
            }
        });
        return { myQueue: myQueueForms, allPending: allPendingForms };
    }, [user, mockFormSubmissions]);

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Tabs defaultValue="my-queue">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="my-queue">
                        {t('tabs.forYourHandling')}
                        {myQueue.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{myQueue.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="all-open">{t('tabs.allOpenForms')}</TabsTrigger>
                    <TabsTrigger value="overdue" disabled>{t('tabs.overdue')}</TabsTrigger>
                </TabsList>
                <TabsContent value="my-queue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('myQueueTitle')}</CardTitle>
                            <CardDescription>{t('myQueueDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ApprovalsTable forms={myQueue} onApprove={handleApprove} onReject={handleReject} showActions={true} />
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
                            <ApprovalsTable forms={allPending} onApprove={handleApprove} onReject={handleReject} showActions={false} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
