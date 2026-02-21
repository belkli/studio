'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "../ui/status-badge";
import { useTranslations } from 'next-intl';


export function RecentForms() {
    const t = useTranslations('Dashboard.recentForms');
    const { user, mockFormSubmissions } = useAuth();

    if (!user) {
        return null; // Or some loading state
    }

    const getFilteredForms = () => {
        if (!user) return [];
        switch (user.role) {
            case 'student':
                return mockFormSubmissions.filter(form => form.studentId === user.id);
            case 'teacher':
                return mockFormSubmissions.filter(form => user.students?.includes(form.studentId));
            case 'conservatorium_admin':
                return mockFormSubmissions.filter(form => form.conservatoriumName === user.conservatoriumName);
            case 'site_admin':
            case 'ministry_director':
                return mockFormSubmissions;
            default:
                return [];
        }
    };

    const cardDescription = {
        student: t('descriptions.student'),
        teacher: t('descriptions.teacher'),
        conservatorium_admin: t('descriptions.conservatorium_admin'),
        site_admin: t('descriptions.site_admin'),
        ministry_director: t('descriptions.ministry_director'),
        parent: t('descriptions.parent')
    }


    const recentForms = getFilteredForms().slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('title')}</CardTitle>
                    <CardDescription>
                        {cardDescription[user.role as keyof typeof cardDescription] || t('descriptions.default')}
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="me-auto gap-1">
                    <Link href="/dashboard/forms">
                        {t('viewAll')}
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {user.role !== 'student' && <TableHead>{t('studentName')}</TableHead>}
                            <TableHead>{t('formType')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('submissionDate')}</TableHead>
                            <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentForms.map((form) => (
                            <TableRow key={form.id}>
                                {user.role !== 'student' && <TableCell className="font-medium">{form.studentName}</TableCell>}
                                <TableCell>{form.formType}</TableCell>
                                <TableCell>
                                    <StatusBadge status={form.status} />
                                </TableCell>
                                <TableCell>{form.submissionDate}</TableCell>
                                <TableCell className="text-left">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/forms/${form.id}`}>{t('view')}</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
