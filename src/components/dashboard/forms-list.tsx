import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFormSubmissions } from "@/lib/data";
import type { FormStatus } from "@/lib/types";
import Link from "next/link";

const statusColors: Record<FormStatus, string> = {
    'טיוטה': "bg-gray-200 text-gray-800 hover:bg-gray-200/80 dark:bg-gray-700 dark:text-gray-200",
    'ממתין לאישור מורה': "bg-orange-200 text-orange-800 hover:bg-orange-200/80 dark:bg-orange-800 dark:text-orange-100",
    'ממתין לאישור מנהל': "bg-yellow-200 text-yellow-800 hover:bg-yellow-200/80 dark:bg-yellow-800 dark:text-yellow-100",
    'מאושר': "bg-green-200 text-green-800 hover:bg-green-200/80 dark:bg-green-800 dark:text-green-100",
    'נדחה': "bg-red-200 text-red-800 hover:bg-red-200/80 dark:bg-red-800 dark:text-red-100",
};

export function FormsList({ statusFilter }: { statusFilter?: FormStatus[] }) {
    const forms = statusFilter 
        ? mockFormSubmissions.filter(form => statusFilter.includes(form.status))
        : mockFormSubmissions;

    if (forms.length === 0) {
        return <p className="p-4 text-muted-foreground text-center">לא נמצאו טפסים.</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>שם התלמיד/ה</TableHead>
                    <TableHead>סוג הטופס</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך הגשה</TableHead>
                    <TableHead><span className="sr-only">פעולות</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {forms.map((form) => (
                    <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.studentName}</TableCell>
                        <TableCell>{form.formType}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={statusColors[form.status]}>{form.status}</Badge>
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
    )
}
