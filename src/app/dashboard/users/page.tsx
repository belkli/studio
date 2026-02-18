// @ts-nocheck
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
import { isValidIsraeliID } from "@/lib/utils";


const roleTranslations: Record<UserRole, string> = {
    student: "תלמיד",
    teacher: "מורה",
    conservatorium_admin: "מנהל קונסרבטוריון",
    site_admin: "מנהל מערכת"
};

const editUserSchema = z.object({
    name: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים."),
    email: z.string().email("כתובת אימייל לא תקינה."),
    role: z.enum(["student", "teacher", "conservatorium_admin", "site_admin"]),
    grade: z.string().optional(),
    idNumber: z.string().refine(isValidIsraeliID, "מספר ת.ז. לא תקין."),
    phone: z.string().min(9, "מספר נייד לא תקין.").optional(),
    conservatoriumStudyYears: z.coerce.number().min(0, "שנים חייבות להיות מספר חיובי.").optional(),
    instruments: z.array(z.object({
        instrument: z.string(),
        teacherName: z.string(),
        yearsOfStudy: z.coerce.number().min(0, "שנים חייבות להיות מספר חיובי.").optional(),
    })).optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function UsersPage() {
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
        if (!approvedUsers) return [];
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
        const { toast } = useToast();
        approveUser(user.id);
        toast({ title: 'משתמש אושר', description: `חשבונו של ${user.name} אושר.` });
    };

    const handleRejectClick = (user: User) => {
        setSelectedUserToReject(user);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    }

    const handleUpdateUser = (updatedData: EditUserFormData) => {
        if (!editingUser) return;
        const { toast } = useToast();
        
        const finalUpdatedUser: User = { 
            ...editingUser, 
            ...updatedData,
        };

        updateUser(finalUpdatedUser);
        toast({ title: 'משתמש עודכן', description: `פרטיו של ${finalUpdatedUser.name} עודכנו בהצלחה.` });
        setEditingUser(null);
    }
    
    const confirmReject = () => {
        if (selectedUserToReject) {
            const { toast } = useToast();
            rejectUser(selectedUserToReject.id, rejectionReason || 'לא צוינה סיבה');
            toast({ variant: "destructive", title: 'משתמש נדחה', description: `חשבונו של ${selectedUserToReject.name} נדחה.` });
            setSelectedUserToReject(null);
            setRejectionReason('');
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-right">ניהול משתמשים</h1>
                <p className="text-muted-foreground text-right">נהל משתמשים, הרשאות ובקשות הצטרפות.</p>
            </div>

            <Tabs defaultValue="approved">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">
                        ממתינים לאישור
                        {pendingUsers.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{pendingUsers.length}</span>}
                    </TabsTrigger>
                     <TabsTrigger value="approved">משתמשים מאושרים</TabsTrigger>
                </TabsList>

                <TabsContent value="approved" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">
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
                                    <Input type="search" placeholder="חיפוש לפי שם או אימייל..." className="w-full rounded-lg bg-background pr-10 text-right" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                            <CardTitle className="text-right">בקשות הצטרפות ממתינות</CardTitle>
                            <CardDescription className="text-right">אשר או דחה בקשות של משתמשים חדשים להצטרף לקונסרבטוריון שלך.</CardDescription>
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
                <DialogContent dir="rtl" className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>עריכת משתמש: {editingUser?.name}</DialogTitle>
                    </DialogHeader>
                    {editingUser && <EditUserForm user={editingUser} onSubmit={handleUpdateUser} onCancel={() => setEditingUser(null)} currentUser={currentUser} />}
                </DialogContent>
            </Dialog>

        </div>
    );
}

const UsersTable = ({ users, currentUser, showFilters, onEdit }: { users: User[], currentUser: User, showFilters: boolean, onEdit: (user: User) => void }) => {
    const { toast } = useToast();
    const canEdit = currentUser.role === 'site_admin' || currentUser.role === 'conservatorium_admin';

    const handleEdit = (user: User) => {
        if(canEdit) {
            onEdit(user);
        } else {
            toast({ title: 'אין הרשאה', description: 'אין לך הרשאה לערוך משתמש זה.' });
        }
    };
    
    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-8">לא נמצאו משתמשים התואמים את החיפוש.</p>;
    }

    return (
        <Table>
            <TableHeader><TableRow>
                <TableHead>שם</TableHead>
                <TableHead>ת.ז.</TableHead>
                <TableHead dir="ltr" className="text-left">אימייל</TableHead>
                <TableHead>נייד</TableHead>
                <TableHead>תפקיד</TableHead>
                {showFilters && <TableHead>כלי נגינה</TableHead>}
                {showFilters && <TableHead>מורה</TableHead>}
                {showFilters && <TableHead>וותק בקונ'</TableHead>}
                {showFilters && <TableHead>וותק עם מורה</TableHead>}
                {currentUser.role === 'site_admin' && <TableHead>קונסרבטוריון</TableHead>}
                {canEdit && <TableHead className="text-left">פעולות</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.idNumber || '-'}</TableCell>
                        <TableCell className="text-left" dir="ltr">{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{roleTranslations[user.role]}</span></TableCell>
                        {showFilters && (
                            <>
                                <TableCell>{user.instruments?.map(i => i.instrument).join(', ') || '-'}</TableCell>
                                <TableCell>{user.instruments?.map(i => i.teacherName).join(', ') || '-'}</TableCell>
                                <TableCell>{user.conservatoriumStudyYears || '-'}</TableCell>
                                <TableCell>{user.instruments?.map(i => i.yearsOfStudy).join(', ') || '-'}</TableCell>
                            </>
                        )}
                        {currentUser.role === 'site_admin' && (<TableCell>{user.conservatoriumName}</TableCell>)}
                        {canEdit && (
                            <TableCell className="text-left">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /><span className="sr-only">ערוך</span></Button>
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
                <TableHead dir="ltr" className="text-left">אימייל</TableHead>
                <TableHead>תפקיד מבוקש</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-left" dir="ltr">{user.email}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{roleTranslations[user.role]}</span></TableCell>
                        <TableCell className="text-left space-x-2 space-x-reverse">
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => onApprove(user)}><Check className="h-4 w-4" /><span className="sr-only">אשר</span></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => onReject(user)}><X className="h-4 w-4" /><span className="sr-only">דחה</span></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


const EditUserForm = ({ user, onSubmit, onCancel, currentUser }: { user: User, onSubmit: (data: EditUserFormData) => void, onCancel: () => void, currentUser: User }) => {
    const form = useForm<EditUserFormData>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: user.name || '',
            email: user.email || '',
            role: user.role,
            grade: user.grade || '',
            idNumber: user.idNumber || '',
            phone: user.phone || '',
            conservatoriumStudyYears: user.conservatoriumStudyYears || 0,
            instruments: user.instruments || [],
        },
    });
    
    const canChangeRole = currentUser.role === 'site_admin' || (currentUser.role === 'conservatorium_admin' && user.role !== 'conservatorium_admin');
    const canEditSeniority = currentUser.role === 'conservatorium_admin';


    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField name="name" render={({ field }) => ( <FormItem> <FormLabel>שם מלא</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="email" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="idNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    <FormField name="phone" render={({ field }) => ( <FormItem> <FormLabel>נייד</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                </div>
                
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>תפקיד</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canChangeRole} dir="rtl">
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="בחר תפקיד" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currentUser.role === 'site_admin' && <SelectItem value="conservatorium_admin">מנהל קונסרבטוריון</SelectItem>}
                                    <SelectItem value="teacher">מורה</SelectItem>
                                    <SelectItem value="student">תלמיד</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {form.watch('role') === 'student' && (
                     <div className="space-y-4 pt-4 mt-4 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="grade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>כיתה</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="בחר כיתה"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="יב">י"ב</SelectItem>
                                                <SelectItem value="יא">י"א</SelectItem>
                                                <SelectItem value="י">י'</SelectItem>
                                                <SelectItem value="ט">ט'</SelectItem>
                                                <SelectItem value="ח">ח'</SelectItem>
                                                <SelectItem value="ז">ז'</SelectItem>
                                                <SelectItem value="ו">ו'</SelectItem>
                                                <SelectItem value="ה">ה'</SelectItem>
                                                <SelectItem value="ד">ד'</SelectItem>
                                                <SelectItem value="ג">ג'</SelectItem>
                                                <SelectItem value="ב">ב'</SelectItem>
                                                <SelectItem value="א">א'</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="conservatoriumStudyYears"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>וותק בקונס' (שנים)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} disabled={!canEditSeniority} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {user.instruments && user.instruments.length > 0 && (
                            <div className="space-y-4 pt-4 mt-4 border-t">
                                <h4 className="font-medium text-muted-foreground">וותק עם מורים</h4>
                                {(form.getValues('instruments') || []).map((inst, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_1fr_120px] items-end gap-2 p-3 border rounded-md bg-muted/50">
                                        <div>
                                            <FormLabel className="text-xs">כלי נגינה</FormLabel>
                                            <Input value={inst.instrument} disabled className="bg-background" />
                                        </div>
                                        <div>
                                            <FormLabel className="text-xs">שם המורה</FormLabel>
                                            <Input value={inst.teacherName} disabled className="bg-background" />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`instruments.${index}.yearsOfStudy`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">שנות וותק</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? 0}
                                                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                            disabled={!canEditSeniority}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>ביטול</Button>
                    <Button type="submit">שמור שינויים</Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}

