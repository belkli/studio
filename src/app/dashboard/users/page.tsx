'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserRole, User } from "@/lib/types";
import { Check, Edit, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const roleTranslations: Record<UserRole, string> = {
    student: "תלמיד",
    teacher: "מורה",
    conservatorium_admin: "מנהל קונסרבטוריון",
    site_admin: "מנהל מערכת"
};

export default function UsersPage() {
    const { toast } = useToast();
    const { user: currentUser, users, approveUser, rejectUser, updateUser } = useAuth();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [instrumentFilter, setInstrumentFilter] = useState('all');
    const [teacherFilter, setTeacherFilter] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedUserToReject, setSelectedUserToReject] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { pendingUsers, approvedUsers, availableInstruments, availableTeachers, availableGrades } = useMemo(() => {
        if (!currentUser) {
            return { pendingUsers: [], approvedUsers: [], availableInstruments: [], availableTeachers: [], availableGrades: [] };
        }

        let baseUsers: User[];
        if (currentUser.role === 'site_admin') {
            baseUsers = users.filter(user => user.role === 'conservatorium_admin');
        } else if (currentUser.role === 'conservatorium_admin') {
            baseUsers = users.filter(user => 
                user.conservatoriumId === currentUser.conservatoriumId && user.id !== currentUser.id && user.role !== 'site_admin'
            );
        } else {
            baseUsers = [];
        }

        const studentUsers = baseUsers.filter(u => u.approved && u.role === 'student');
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
            pendingUsers: baseUsers.filter(u => !u.approved),
            approvedUsers: baseUsers.filter(u => u.approved),
            availableInstruments: Array.from(instruments),
            availableTeachers: Array.from(teachers),
            availableGrades: Array.from(grades).sort(),
        }
    }, [currentUser, users]);
    
    const filteredApprovedUsers = useMemo(() => {
        return approvedUsers.filter(user => {
            const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
            if (user.role !== 'student') return searchMatch;
            const instrumentMatch = instrumentFilter === 'all' || user.instruments?.some(i => i.instrument === instrumentFilter);
            const teacherMatch = teacherFilter === 'all' || user.instruments?.some(i => i.teacherName === teacherFilter);
            const gradeMatch = gradeFilter === 'all' || user.grade === gradeFilter;
            return searchMatch && instrumentMatch && teacherMatch && gradeMatch;
        });
    }, [approvedUsers, searchTerm, instrumentFilter, teacherFilter, gradeFilter]);
    
    const showFilters = currentUser?.role === 'conservatorium_admin' && approvedUsers.some(u => u.role === 'student');

    if (!currentUser) {
        return null; // Or a loading spinner
    }

    const handleApprove = (user: User) => {
        approveUser(user.id);
        toast({ title: 'משתמש אושר', description: `חשבונו של ${user.name} אושר.` });
    };

    const handleRejectClick = (user: User) => {
        setSelectedUserToReject(user);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    }

    const handleUpdateUser = (updatedData: Partial<User>) => {
        if (!editingUser) return;
        const updatedUser = { ...editingUser, ...updatedData };
        updateUser(updatedUser);
        toast({ title: 'משתמש עודכן', description: `פרטיו של ${updatedUser.name} עודכנו בהצלחה.` });
        setEditingUser(null);
    }
    
    const confirmReject = () => {
        if (selectedUserToReject) {
            rejectUser(selectedUserToReject.id, rejectionReason || 'לא צוינה סיבה');
            toast({ variant: "destructive", title: 'משתמש נדחה', description: `חשבונו של ${selectedUserToReject.name} נדחה.` });
            setSelectedUserToReject(null);
            setRejectionReason('');
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
                <p className="text-muted-foreground">נהל משתמשים, הרשאות ובקשות הצטרפות.</p>
            </div>

            <Tabs defaultValue="approved">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="approved">משתמשים מאושרים</TabsTrigger>
                    <TabsTrigger value="pending">
                        ממתינים לאישור
                        {pendingUsers.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{pendingUsers.length}</span>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="approved" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {currentUser.role === 'site_admin' 
                                    ? 'מנהלי קונסרבטוריונים'
                                    : `משתמשים ב${currentUser.conservatoriumName}`
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative w-full md:flex-grow">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder="חיפוש לפי שם או אימייל..." className="w-full pe-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                {showFilters && (
                                    <>
                                        <Select dir="rtl" value={instrumentFilter} onValueChange={setInstrumentFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="סינון לפי כלי נגינה" /></SelectTrigger><SelectContent><SelectItem value="all">כל הכלים</SelectItem>{availableInstruments.map(inst => <SelectItem key={inst} value={inst}>{inst}</SelectItem>)}</SelectContent></Select>
                                        <Select dir="rtl" value={teacherFilter} onValueChange={setTeacherFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="סינון לפי מורה" /></SelectTrigger><SelectContent><SelectItem value="all">כל המורים</SelectItem>{availableTeachers.map(teacher => <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>)}</SelectContent></Select>
                                        <Select dir="rtl" value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="סינון לפי כיתה" /></SelectTrigger><SelectContent><SelectItem value="all">כל הכיתות</SelectItem>{availableGrades.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}</SelectContent></Select>
                                    </>
                                )}
                            </div>
                            <UsersTable users={filteredApprovedUsers} currentUser={currentUser} showFilters={!!showFilters} onEdit={handleEditClick} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>בקשות הצטרפות ממתינות</CardTitle>
                            <CardDescription>אשר או דחה בקשות של משתמשים חדשים להצטרף לקונסרבטוריון שלך.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PendingUsersTable users={pendingUsers} onApprove={handleApprove} onReject={handleRejectClick} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <AlertDialog open={!!selectedUserToReject} onOpenChange={(isOpen) => !isOpen && setSelectedUserToReject(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>דחיית משתמש: {selectedUserToReject?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך לדחות את בקשת ההצטרפות? ניתן לציין סיבה לדחייה (אופציונלי).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Textarea placeholder="סיבת הדחייה..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">דחה משתמש</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>עריכת משתמש: {editingUser?.name}</DialogTitle>
                    </DialogHeader>
                    {editingUser && <EditUserForm user={editingUser} onSubmit={handleUpdateUser} onCancel={() => setEditingUser(null)} />}
                </DialogContent>
            </Dialog>

        </div>
    );
}

const UsersTable = ({ users, currentUser, showFilters, onEdit }: { users: User[], currentUser: User, showFilters: boolean, onEdit: (user: User) => void }) => {
    const canEdit = currentUser.role === 'site_admin' || currentUser.role === 'conservatorium_admin';

    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-8">לא נמצאו משתמשים התואמים את החיפוש.</p>;
    }

    return (
        <Table>
            <TableHeader><TableRow>
                <TableHead>שם</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>תפקיד</TableHead>
                {showFilters && <TableHead>כלי נגינה</TableHead>}
                {showFilters && <TableHead>מורה</TableHead>}
                {currentUser.role === 'site_admin' && <TableHead>קונסרבטוריון</TableHead>}
                {canEdit && <TableHead className="text-right">פעולות</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{roleTranslations[user.role]}</span></TableCell>
                        {showFilters && (
                            <>
                                <TableCell>{user.instruments?.map(i => i.instrument).join(', ') || '-'}</TableCell>
                                <TableCell>{user.instruments?.map(i => i.teacherName).join(', ') || '-'}</TableCell>
                            </>
                        )}
                        {currentUser.role === 'site_admin' && (<TableCell>{user.conservatoriumName}</TableCell>)}
                        {canEdit && (
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(user)}><Edit className="h-4 w-4" /><span className="sr-only">ערוך</span></Button>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const PendingUsersTable = ({ users, onApprove, onReject }: { users: User[], onApprove: (user: User) => void, onReject: (user: User) => void }) => {
    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-8">אין בקשות ממתינות לאישור.</p>;
    }
    return (
        <Table>
            <TableHeader><TableRow>
                <TableHead>שם</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>תפקיד מבוקש</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{roleTranslations[user.role]}</span></TableCell>
                        <TableCell className="text-right space-x-2 space-x-reverse">
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => onApprove(user)}><Check className="h-4 w-4" /><span className="sr-only">אשר</span></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => onReject(user)}><X className="h-4 w-4" /><span className="sr-only">דחה</span></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


const editUserSchema = z.object({
    name: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים."),
    email: z.string().email("כתובת אימייל לא תקינה."),
    role: z.enum(["student", "teacher", "conservatorium_admin", "site_admin"]),
    grade: z.enum(['י', 'יא', 'יב']).optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

const EditUserForm = ({ user, onSubmit, onCancel }: { user: User, onSubmit: (data: EditUserFormData) => void, onCancel: () => void }) => {
    const form = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            role: user.role,
            grade: user.grade,
        },
    });

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>שם מלא</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>אימייל</FormLabel>
                            <FormControl>
                                <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {user.role === 'student' && (
                    <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>כיתה</FormLabel>
                                <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="בחר כיתה"/></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="י">י'</SelectItem>
                                        <SelectItem value="יא">י"א</SelectItem>
                                        <SelectItem value="יב">י"ב</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {/* Note: Role editing could be added here for Site Admins */}
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>ביטול</Button>
                    <Button type="submit">שמור שינויים</Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}