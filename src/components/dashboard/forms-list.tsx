import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFormSubmissions } from "@/lib/data";
import type { FormStatus } from "@/lib/types";
import Link from "next/link";
import { StatusBadge } from "../ui/status-badge";


export function FormsList({ statusFilter }: { statusFilter?: FormStatus[] }) {
    const forms = statusFilter 
        ? mockFormSubmissions.filter(form => statusFilter.includes(form.status))
        : mockFormSubmissions;

    if (forms.length === 0) {
        return <p className="p-4 text-muted-foreground text-center">לא נמצאו טפסים.</p>
    }

    return (
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>שם התלמיד/ה</TableHead>
                    <TableHead>סוג הטופס</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך הגשה</TableHead>
                    <TableHead className="text-left"><span className="sr-only">פעולות</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {forms.map((form) => (
                    <TableRow key={form.id}>
                        <TableCell className="font-medium truncate">{form.studentName}</TableCell>
                        <TableCell className="truncate">{form.formType}{form.grade && ` - כיתה ${form.grade}`}</TableCell>
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
    )
}
