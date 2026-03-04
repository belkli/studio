'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FormStatus } from "@/lib/types";
import { Link } from "@/i18n/routing";
import { StatusBadge } from "../ui/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export function FormsList({
    statusFilter,
    searchQuery
}: {
    statusFilter?: FormStatus[],
    searchQuery?: string
}) {
    const t = useTranslations('FormsPage');
    const tc = useTranslations('Common.shared');
    const { user, mockFormSubmissions } = useAuth();
    let forms = user ? mockFormSubmissions : [];

    if (user) {
        if (user.role === 'conservatorium_admin' || user.role === 'delegated_admin') {
            forms = forms.filter((f) => f.conservatoriumId === user.conservatoriumId);
        } else if (user.role === 'teacher') {
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
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>{tc('studentName')}</TableHead>
                    <TableHead>{tc('formType')}</TableHead>
                    <TableHead>{tc('status')}</TableHead>
                    <TableHead>{tc('submissionDate')}</TableHead>
                    <TableHead className="text-start"><span className="sr-only">{tc('actions')}</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {forms.map((form) => (
                    <TableRow key={form.id}>
                        <TableCell className="font-medium truncate">{form.studentName}</TableCell>
                        <TableCell className="truncate">{form.formType}{form.grade && ` - ${tc('grade')} ${form.grade}`}</TableCell>
                        <TableCell>
                            <StatusBadge status={form.status} />
                        </TableCell>
                        <TableCell>{form.submissionDate}</TableCell>
                        <TableCell className="text-start">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/forms/${form.id}`}>{tc('view')}</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
