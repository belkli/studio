'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserRole, User } from "@/lib/types";
import { Check, Edit, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGuard } from "@/hooks/use-admin-guard";
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
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const roleTranslations = (t: any): Record<UserRole, string> => ({
    admin: t('roles.conservatorium_admin'),
    superadmin: t('roles.site_admin'),
    student: t('roles.student'),
    teacher: t('roles.teacher'),
    parent: t('roles.parent'),
    conservatorium_admin: t('roles.conservatorium_admin'),
    site_admin: t('roles.site_admin'),
    ministry_director: t('roles.ministry_director'),
    school_coordinator: t('roles.school_coordinator')
});

const getEditUserSchema = (t: any) => z.object({
    name: z.string().min(2, t('validation.nameMin')),
    email: z.string().email(t('validation.emailInvalid')),
    role: z.enum(["admin", "superadmin", "student", "teacher", "parent", "conservatorium_admin", "site_admin", "ministry_director", "school_coordinator"]),
    grade: z.string().optional(),
    idNumber: z.string().refine(isValidIsraeliID, t('validation.idInvalid')),
    phone: z.string().min(9, t('validation.phoneInvalid')).optional(),
    conservatoriumStudyYears: z.coerce.number().min(0, t('validation.yearsPositive')).optional(),
    instruments: z.array(z.object({
        instrument: z.string(),
        teacherName: z.string(),
        yearsOfStudy: z.coerce.number().min(0, t('validation.yearsPositive')).optional(),
    })).optional(),
});

type EditUserSchema = ReturnType<typeof getEditUserSchema>;
type EditUserFormValues = z.input<EditUserSchema>;
type EditUserFormData = z.output<EditUserSchema>;

export default function UsersPage() {
    const { user: currentUser, isLoading } = useAdminGuard();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const t = useTranslations('UserManagement');
    const { users, approveUser, rejectUser, updateUser, newFeaturesEnabled } = useAuth();
    const defaultTab = searchParams.get('tab') || 'approved';

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
            baseUsers = users.filter(user => user.id !== currentUser.id);
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
            if (user.role !== 'student' || !newFeaturesEnabled) return searchMatch;
            const instrumentMatch = instrumentFilter === 'all' || user.instruments?.some(i => i.instrument === instrumentFilter);
            const teacherMatch = teacherFilter === 'all' || user.instruments?.some(i => i.teacherName === teacherFilter);
            const gradeMatch = gradeFilter === 'all' || user.grade === gradeFilter;
            return searchMatch && instrumentMatch && teacherMatch && gradeMatch;
        });
    }, [approvedUsers, searchTerm, instrumentFilter, teacherFilter, gradeFilter, newFeaturesEnabled]);

    const showFilters = currentUser?.role === 'conservatorium_admin' && approvedUsers.some(u => u.role === 'student') && newFeaturesEnabled;

    if (isLoading || !currentUser) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const handleApprove = (user: User) => {
        approveUser(user.id);
        toast({ title: t('userApproved'), description: t('userApprovedDesc', { name: user.name }) });
    };

    const handleRejectClick = (user: User) => {
        setSelectedUserToReject(user);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    }

    const handleUpdateUser = (updatedData: EditUserFormData) => {
        if (!editingUser) return;

        const finalUpdatedUser: User = {
            ...editingUser,
            ...(updatedData as Partial<User>),
            instruments: updatedData.instruments?.map((instrument) => ({
                ...instrument,
                yearsOfStudy: instrument.yearsOfStudy ?? 0,
            })),
        } as User;

        updateUser(finalUpdatedUser);
        toast({ title: t('userUpdated'), description: t('userUpdatedDesc', { name: finalUpdatedUser.name }) });
        setEditingUser(null);
    }

    const confirmReject = () => {
        if (selectedUserToReject) {
            rejectUser(selectedUserToReject.id, rejectionReason || t('noReasonProvided'));
            toast({ variant: "destructive", title: t('userRejected'), description: t('userRejectedDesc', { name: selectedUserToReject.name }) });
            setSelectedUserToReject(null);
            setRejectionReason('');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('manageUsers')}</p>
            </div>

            <Tabs defaultValue={defaultTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">
                        {t('pendingApprovalCount')}
                        {pendingUsers.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{pendingUsers.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="approved">{t('approvedUsers')}</TabsTrigger>
                </TabsList>

                <TabsContent value="approved" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {currentUser.role === 'site_admin'
                                    ? t('allUsers')
                                    : t('usersIn', { name: currentUser.conservatoriumName })
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative w-full md:flex-grow">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder={t('searchPlaceholder')} className="w-full rounded-lg bg-background pr-10 text-right" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                {showFilters && (
                                    <>
                                        <Select dir="rtl" value={instrumentFilter} onValueChange={setInstrumentFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder={t('filterByInstrument')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('allInstruments')}</SelectItem>{availableInstruments.map(inst => <SelectItem key={inst} value={inst}>{inst}</SelectItem>)}</SelectContent></Select>
                                        <Select dir="rtl" value={teacherFilter} onValueChange={setTeacherFilter}><SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder={t('filterByTeacher')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('allTeachers')}</SelectItem>{availableTeachers.map(teacher => <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>)}</SelectContent></Select>
                                        <Select dir="rtl" value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder={t('filterByGrade')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('allGrades')}</SelectItem>{availableGrades.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}</SelectContent></Select>
                                    </>
                                )}
                            </div>
                            <UsersTable users={filteredApprovedUsers} currentUser={currentUser} showFilters={!!showFilters && newFeaturesEnabled} onEdit={handleEditClick} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('pendingRequests')}</CardTitle>
                            <CardDescription>{t('pendingRequestsDesc')}</CardDescription>
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
                        <AlertDialogTitle>{t('rejectUserTitle', { name: selectedUserToReject?.name || '' })}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('rejectUserDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Textarea placeholder={t('rejectionReasonPlaceholder')} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('rejectBtn')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                <DialogContent dir="rtl" className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t('editUser', { name: editingUser?.name || '' })}</DialogTitle>
                    </DialogHeader>
                    {editingUser && <EditUserForm user={editingUser} onSubmit={handleUpdateUser} onCancel={() => setEditingUser(null)} currentUser={currentUser} t={t} />}
                </DialogContent>
            </Dialog>

        </div>
    );
}

const UsersTable = ({ users, currentUser, showFilters, onEdit }: { users: User[], currentUser: User, showFilters: boolean, onEdit: (user: User) => void }) => {
    const { toast } = useToast();
    const canEdit = currentUser.role === 'site_admin' || currentUser.role === 'conservatorium_admin';
    const t = useTranslations('UserManagement');
    const roles = roleTranslations(t);

    const handleEdit = (user: User) => {
        if (canEdit) {
            onEdit(user);
        } else {
            toast({ title: t('noPermission'), description: t('noPermissionEdit') });
        }
    };

    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-8">{t('noUsersFoundContent')}</p>;
    }

    return (
        <Table>
            <TableHeader><TableRow>
                <TableHead>{t('name')}</TableHead>
                {showFilters && <TableHead>{t('idNumber')}</TableHead>}
                <TableHead dir="ltr" className="text-left">{t('email')}</TableHead>
                {showFilters && <TableHead>{t('phone')}</TableHead>}
                <TableHead>{t('role')}</TableHead>
                {showFilters && <TableHead>{t('instrument')}</TableHead>}
                {showFilters && <TableHead>{t('teacher')}</TableHead>}
                {showFilters && <TableHead>{t('seniority')}</TableHead>}
                {currentUser.role === 'site_admin' && <TableHead>{t('conservatorium')}</TableHead>}
                {canEdit && <TableHead className="text-left">{t('actions')}</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        {showFilters && <TableCell>{user.idNumber || '-'}</TableCell>}
                        <TableCell className="text-left" dir="ltr">{user.email}</TableCell>
                        {showFilters && <TableCell>{user.phone || '-'}</TableCell>}
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{roles[user.role]}</span></TableCell>
                        {showFilters && (
                            <>
                                <TableCell>{user.instruments?.map(i => i.instrument).join(', ') || '-'}</TableCell>
                                <TableCell>{user.instruments?.map(i => i.teacherName).join(', ') || '-'}</TableCell>
                                <TableCell>{user.conservatoriumStudyYears || '-'}</TableCell>
                            </>
                        )}
                        {currentUser.role === 'site_admin' && (<TableCell>{user.conservatoriumName}</TableCell>)}
                        {canEdit && (
                            <TableCell className="text-left">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /><span className="sr-only">Edit</span></Button>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const PendingUsersTable = ({ users, onApprove, onReject }: { users: User[], onApprove: (user: User) => void, onReject: (user: User) => void }) => {
    const t = useTranslations('UserManagement');
    const roles = roleTranslations(t);

    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-8">{t('noPendingRequests')}</p>;
    }
    return (
        <Table>
            <TableHeader><TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead dir="ltr" className="text-left">{t('email')}</TableHead>
                <TableHead>{t('requestedRole')}</TableHead>
                <TableHead className="text-left">{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-left" dir="ltr">{user.email}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{roles[user.role]}</span></TableCell>
                        <TableCell className="text-left space-x-2 space-x-reverse">
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => onApprove(user)}><Check className="h-4 w-4" /><span className="sr-only">{t('approve')}</span></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => onReject(user)}><X className="h-4 w-4" /><span className="sr-only">{t('reject')}</span></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


const EditUserForm = ({ user, onSubmit, onCancel, currentUser, t }: { user: User, onSubmit: (data: EditUserFormData) => void, onCancel: () => void, currentUser: User, t: any }) => {
    const editSchema = useMemo(() => getEditUserSchema(t), [t]);
    const form = useForm<EditUserFormValues, any, EditUserFormData>({
        resolver: zodResolver(editSchema),
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                    <FormField name="name" render={({ field }) => (<FormItem> <FormLabel>{t('fullNameTitle')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    <FormField name="email" render={({ field }) => (<FormItem> <FormLabel>{t('email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    <FormField name="idNumber" render={({ field }) => (<FormItem> <FormLabel>{t('idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    <FormField name="phone" render={({ field }) => (<FormItem> <FormLabel>{t('phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                </div>

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('role')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canChangeRole} dir="rtl">
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder={t('selectRole')} /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currentUser.role === 'site_admin' && <SelectItem value="conservatorium_admin">{t('roles.conservatorium_admin')}</SelectItem>}
                                    <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
                                    <SelectItem value="student">{t('roles.student')}</SelectItem>
                                    <SelectItem value="parent">{t('roles.parent')}</SelectItem>
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
                                        <FormLabel>{t('grade')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('selectGrade')} />
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
                                        <FormLabel>{t('seniorityYears')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={Number(field.value ?? 0)}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                                disabled={!canEditSeniority}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {user.instruments && user.instruments.length > 0 && (
                            <div className="space-y-4 pt-4 mt-4 border-t">
                                <h4 className="font-medium text-muted-foreground">{t('seniorityWithTeachers')}</h4>
                                {(form.getValues('instruments') || []).map((inst, index) => (
                                    <div key={index} className="grid grid-cols-[1fr_1fr_120px] items-end gap-2 p-3 border rounded-md bg-muted/50">
                                        <div>
                                            <FormLabel className="text-xs">{t('instrument')}</FormLabel>
                                            <Input value={inst.instrument} disabled className="bg-background" />
                                        </div>
                                        <div>
                                            <FormLabel className="text-xs">{t('teacherName')}</FormLabel>
                                            <Input value={inst.teacherName} disabled className="bg-background" />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`instruments.${index}.yearsOfStudy`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">{t('yearsSeniority')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={Number(field.value ?? 0)}
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
                    <Button type="button" variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
                    <Button type="submit">{t('saveChanges')}</Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
