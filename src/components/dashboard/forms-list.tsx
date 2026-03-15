'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FormStatus } from "@/lib/types";
import { Link } from "@/i18n/routing";
import { StatusBadge } from "../ui/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from "next-intl";

export function FormsList({
    statusFilter,
    searchQuery,
    fromContext = 'forms',
}: {
    statusFilter?: FormStatus[],
    searchQuery?: string,
    fromContext?: 'forms' | 'approvals',
}) {
    const t = useTranslations('FormsPage');
    const tc = useTranslations('Common.shared');
    const tApprovals = useTranslations('ApprovalsPage');
    const locale = useLocale();
    const { user, formSubmissions } = useAuth();
    let forms = user ? formSubmissions : [];

    if (user) {
        if (user.role === 'conservatorium_admin' || user.role === 'delegated_admin') {
            forms = forms.filter((f) => f.conservatoriumId === user.conservatoriumId);
        } else if (user.role === 'teacher') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            forms = forms.filter((f) => f.teacherId === user.id || (f.formData as any)?.assignedToTeacherId === user.id);
        } else if (user.role === 'student') {
            forms = forms.filter((f) => f.submittedBy === user.id || f.studentId === user.id);
        } else if (user.role === 'parent') {
            forms = forms.filter((f) => f.submittedBy === user.id || !!user.childIds?.includes(f.studentId));
        }
    }

    if (statusFilter) {
        forms = forms.filter(form => statusFilter.includes(form.status));
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        forms = forms.filter(form =>
            form.studentName.toLowerCase().includes(query) ||
            form.formType.toLowerCase().includes(query)
        );
    }

    if (forms.length === 0) {
        return <p className="p-4 text-muted-foreground text-center">{t('noForms')}</p>;
    }

    return (
        <Table className="w-full" dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-start">{tc('studentName')}</TableHead>
                    <TableHead className="text-start">{tc('formType')}</TableHead>
                    <TableHead className="text-start">{tc('status')}</TableHead>
                    <TableHead className="text-start">{tc('submissionDate')}</TableHead>
                    <TableHead className="text-start"><span className="sr-only">{tc('actions')}</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {forms.map((form) => (
                    <TableRow key={form.id}>
                        <TableCell className="font-medium truncate text-start">{form.studentName}</TableCell>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <TableCell className="truncate text-start">{tApprovals(`formTypes.${form.formType}` as any) || form.formType}{form.grade && ` - ${tc('grade')} ${form.grade}`}</TableCell>
                        <TableCell className="text-start">
                            <StatusBadge status={form.status} />
                        </TableCell>
                        <TableCell className="text-start">{form.submissionDate}</TableCell>
                        <TableCell className="text-start">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/forms/${form.id}?from=${fromContext}`}>{tc('view')}</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
