'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUsers } from "@/lib/data";
import type { UserRole, User } from "@/lib/types";
import { Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/ui/status-badge";

const roleTranslations: Record<UserRole, string> = {
    student: "תלמיד",
    teacher: "מורה",
    conservatorium_admin: "מנהל קונסרבטוריון",
    site_admin: "מנהל מערכת"
};

export default function UsersPage() {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [instrumentFilter, setInstrumentFilter] = useState('all');
    const [teacherFilter, setTeacherFilter] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    
    if (!currentUser) {
        return null;
    }

    const canEdit = currentUser.role === 'site_admin' || currentUser.role === 'conservatorium_admin';

    const handleEdit = (user: User) => {
        toast({ title: 'עריכת משתמש', description: `כאן תתבצע עריכה עבור ${user.name}.` });
    };

    const usersToDisplay = useMemo(() => {
        let users: User[];

        if (currentUser.role === 'site_admin') {
            users = mockUsers.filter(user => user.role === 'conservatorium_admin');
        } else if (currentUser.role === 'conservatorium_admin') {
            users = mockUsers.filter(user => 
                user.conservatoriumId === currentUser.conservatoriumId && user.id !== currentUser.id && user.role !== 'site_admin'
            );
        } else {
            users = [];
        }
        return users;
    }, [currentUser]);

    const { availableInstruments, availableTeachers, availableGrades } = useMemo(() => {
        const studentUsers = usersToDisplay.filter(u => u.role === 'student');
        const instruments = new Set<string>();
        const teachers = new Set<string>();
        const grades = new Set<string>();

        studentUsers.forEach(user => {
            user.instruments?.forEach(inst => {
                if (inst.instrument) instruments.add(inst.instrument);
                if (inst.teacherName) teachers.add(inst.teacherName);
            });
            if (user.grade) {
                grades.add(user.grade);
            }
        });

        return {
            availableInstruments: Array.from(instruments),
            availableTeachers: Array.from(teachers),
            availableGrades: Array.from(grades).sort(),
        };
    }, [usersToDisplay]);
    
    const filteredUsers = useMemo(() => {
        return usersToDisplay.filter(user => {
            const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (user.role !== 'student') {
                return searchMatch;
            }

            const instrumentMatch = instrumentFilter === 'all' || user.instruments?.some(i => i.instrument === instrumentFilter);
            const teacherMatch = teacherFilter === 'all' || user.instruments?.some(i => i.teacherName === teacherFilter);
            const gradeMatch = gradeFilter === 'all' || user.grade === gradeFilter;

            return searchMatch && instrumentMatch && teacherMatch && gradeMatch;
        });
    }, [usersToDisplay, searchTerm, instrumentFilter, teacherFilter, gradeFilter]);
    
    const showFilters = currentUser.role === 'conservatorium_admin' && usersToDisplay.some(u => u.role === 'student');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
                <p className="text-muted-foreground">נהל משתמשים, הרשאות ותפקידים.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>כל המשתמשים</CardTitle>
                    <CardDescription>
                        {currentUser.role === 'site_admin' 
                            ? 'רשימת מנהלי הקונסרבטוריונים במערכת.'
                            : `רשימת המשתמשים ב${currentUser.conservatoriumName}.`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative w-full md:flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="חיפוש לפי שם או אימייל..."
                                className="w-full ps-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {showFilters && (
                            <>
                               <Select dir="rtl" value={instrumentFilter} onValueChange={setInstrumentFilter}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue placeholder="סינון לפי כלי נגינה" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">כל הכלים</SelectItem>
                                        {availableInstruments.map(inst => <SelectItem key={inst} value={inst}>{inst}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select dir="rtl" value={teacherFilter} onValueChange={setTeacherFilter}>
                                     <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue placeholder="סינון לפי מורה" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">כל המורים</SelectItem>
                                        {availableTeachers.map(teacher => <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select dir="rtl" value={gradeFilter} onValueChange={setGradeFilter}>
                                     <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="סינון לפי כיתה" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">כל הכיתות</SelectItem>
                                        {availableGrades.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </>
                        )}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם</TableHead>
                                <TableHead>אימייל</TableHead>
                                <TableHead>תפקיד</TableHead>
                                {showFilters && <TableHead>כלי נגינה</TableHead>}
                                {showFilters && <TableHead>מורה</TableHead>}
                                {currentUser.role === 'site_admin' && <TableHead>קונסרבטוריון</TableHead>}
                                {canEdit && <TableHead className="text-left">פעולות</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {roleTranslations[user.role]}
                                        </span>
                                    </TableCell>
                                     {showFilters && (
                                        <>
                                            <TableCell>{user.instruments?.map(i => i.instrument).join(', ') || '-'}</TableCell>
                                            <TableCell>{user.instruments?.map(i => i.teacherName).join(', ') || '-'}</TableCell>
                                        </>
                                     )}
                                    {currentUser.role === 'site_admin' && (
                                        <TableCell>{user.conservatoriumName}</TableCell>
                                    )}
                                    {canEdit && (
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">ערוך משתמש</span>
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredUsers.length === 0 && (
                        <p className="text-center text-muted-foreground pt-8">לא נמצאו משתמשים התואמים את החיפוש.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
