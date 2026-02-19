'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "../ui/status-badge";


export function RecentForms() {
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
        student: "אלו הטפסים האחרונים שהגשת.",
        teacher: "אלו הטפסים האחרונים שהוגשו על ידי התלמידים שלך.",
        conservatorium_admin: "אלו הטפסים האחרונים שהוגשו בקונסרבטוריון שלך.",
        site_admin: "אלו כלל הטפסים האחרונים שהוגשו במערכת.",
        ministry_director: "אלו כלל הטפסים האחרונים שאושרו וממתינים לבחינה."
    }

    const recentForms = getFilteredForms().slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>הגשות אחרונות</CardTitle>
                    <CardDescription>
                        {cardDescription[user.role] || 'להלן הגשות הטפסים האחרונות.'}
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="me-auto gap-1">
                    <Link href="/dashboard/forms">
                        כל הטפסים
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {user.role !== 'student' && <TableHead>שם התלמיד/ה</TableHead>}
                            <TableHead>סוג הטופס</TableHead>
                            <TableHead>סטטוס</TableHead>
                            <TableHead>תאריך הגשה</TableHead>
                            <TableHead><span className="sr-only">פעולות</span></TableHead>
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
                                        <Link href={`/dashboard/forms/${form.id}`}>צפה</Link>
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
