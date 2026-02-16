'use client';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/data";
import type { UserRole } from "@/lib/types";

const roleTranslations: Record<UserRole, string> = {
    student: "תלמיד",
    teacher: "מורה",
    conservatorium_admin: "מנהל קונסרבטוריון",
    site_admin: "מנהל מערכת"
}

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
                <p className="text-muted-foreground">נהל משתמשים, הרשאות ותפקידים.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>כל המשתמשים</CardTitle>
                    <CardDescription>רשימת המשתמשים הרשומים במערכת.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם</TableHead>
                                <TableHead>אימייל</TableHead>
                                <TableHead>תפקיד</TableHead>
                                <TableHead>קונסרבטוריון</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{roleTranslations[user.role]}</Badge>
                                    </TableCell>
                                    <TableCell>{user.conservatoriumName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
