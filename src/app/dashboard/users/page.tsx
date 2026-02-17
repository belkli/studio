'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/data";
import type { UserRole } from "@/lib/types";
import { Edit } from "lucide-react";

const roleTranslations: Record<UserRole, string> = {
    student: "תלמיד",
    teacher: "מורה",
    conservatorium_admin: "מנהל קונסרבטוריון",
    site_admin: "מנהל מערכת"
}

export default function UsersPage() {
    // In a real app, you would check the current user's role
    // const canEdit = user.role === 'site_admin' || user.role === 'conservatorium_admin'
    const canEdit = true; 

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
                                {canEdit && <TableHead className="text-left">פעולות</TableHead>}
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
                                    {canEdit && (
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">ערוך משתמש</span>
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
