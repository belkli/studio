import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFormSubmissions } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "../ui/status-badge";


export function RecentForms() {
    const recentForms = mockFormSubmissions.slice(0, 5);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>הגשות אחרונות</CardTitle>
                    <CardDescription>
                        אלו הטפסים האחרונים שהוגשו על ידי התלמידים שלך.
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
                            <TableHead>שם התלמיד/ה</TableHead>
                            <TableHead>סוג הטופס</TableHead>
                            <TableHead>סטטוס</TableHead>
                            <TableHead>תאריך הגשה</TableHead>
                            <TableHead><span className="sr-only">פעולות</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentForms.map((form) => (
                            <TableRow key={form.id}>
                                <TableCell className="font-medium">{form.studentName}</TableCell>
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
