'use client';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Check, ThumbsDown, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FormCard = ({ form, onApprove, onReject }: { form: FormSubmission; onApprove: () => void; onReject: () => void }) => {
    const { user } = useAuth();
    const canRevise = (user?.role === 'conservatorium_admin' || user?.role === 'site_admin') && form.status === 'נדרש תיקון';

    return (
        <Card className="mb-4 flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-semibold">{form.studentName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{form.formType}</p>
                    </div>
                    <StatusBadge status={form.status} />
                </div>
            </CardHeader>
            <CardContent className="flex-grow text-sm text-muted-foreground space-y-1">
                <p>הוגש: {form.submissionDate}</p>
                <p>משך: {form.totalDuration}</p>
            </CardContent>
            <CardFooter className="p-2 pt-0 grid grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm" className="col-span-1">
                    <Link href={`/dashboard/forms/${form.id}`}>
                        <Eye className="ms-1 h-4 w-4" />
                        צפייה
                    </Link>
                </Button>

                {canRevise ? (
                     <Button asChild variant="outline" size="sm" className="col-span-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                        <Link href={`/dashboard/forms/${form.id}`}>
                            <Edit className="ms-1 h-4 w-4" />
                            תקן ושלח מחדש
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" size="sm" onClick={onApprove} className="col-span-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                            <Check className="ms-1 h-4 w-4" />
                            אישור
                        </Button>
                        <Button variant="outline" size="sm" onClick={onReject} className="col-span-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                            <ThumbsDown className="ms-1 h-4 w-4" />
                            דחייה
                        </Button>
                    </>
                )}
                
            </CardFooter>
        </Card>
    );
};

export default function ApprovalsPage() {
    const { user, mockFormSubmissions, updateForm } = useAuth();
    const { toast } = useToast();

    const { myQueue, allPending } = useMemo(() => {
        if (!user) return { myQueue: [], allPending: [] };
        
        const myQueueForms: FormSubmission[] = [];
        const allPendingForms = mockFormSubmissions.filter(form => form.status !== 'טיוטה' && form.status !== 'נדחה' && form.status !== 'מאושר סופית');

        mockFormSubmissions.forEach(form => {
            let isInMyQueue = false;

            switch(user.role) {
                case 'teacher':
                    if (form.status === 'ממתין לאישור מורה' && user.students?.includes(form.studentId)) {
                        isInMyQueue = true;
                    }
                    break;
                case 'conservatorium_admin':
                     if ((form.status === 'ממתין לאישור מנהל' || form.status === 'נדרש תיקון') && form.conservatoriumId === user.conservatoriumId) {
                        isInMyQueue = true;
                    }
                    break;
                case 'site_admin':
                     if (form.status === 'ממתין לאישור מנהל' || form.status === 'נדרש תיקון') {
                        isInMyQueue = true;
                    }
                    break;
                case 'ministry_director':
                    if (form.status === 'מאושר') {
                        isInMyQueue = true;
                    }
                    break;
            }

            if (isInMyQueue) {
                myQueueForms.push(form);
            }
        });
        return { myQueue: myQueueForms, allPending: allPendingForms };
    }, [user, mockFormSubmissions]);
    
    const handleApprove = (form: FormSubmission) => {
        let nextStatus: FormSubmission['status'] | null = null;
        if (form.status === 'ממתין לאישור מורה') nextStatus = 'ממתין לאישור מנהל';
        if (form.status === 'ממתין לאישור מנהל') nextStatus = 'מאושר';

        if (nextStatus) {
            updateForm({ ...form, status: nextStatus });
            toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} הועבר לשלב הבא.` });
        }
    };
    
    const handleReject = (form: FormSubmission) => {
        updateForm({ ...form, status: 'נדחה' });
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">אישורים</h1>
                <p className="text-muted-foreground">כאן תוכל לצפות ולאשר טפסים של תלמידים ומורים.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>ממתין לטיפולך ({myQueue.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[60vh] overflow-y-auto p-4">
                        {myQueue.length > 0 ? (
                            myQueue.map(form => (
                                <FormCard 
                                    key={form.id} 
                                    form={form} 
                                    onApprove={() => handleApprove(form)}
                                    onReject={() => handleReject(form)}
                                />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground p-4 text-center">אין טפסים הממתינים לך לטיפול.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>כלל הטפסים הפתוחים במערכת ({allPending.length})</CardTitle>
                    </CardHeader>
                     <CardContent className="max-h-[60vh] overflow-y-auto p-0">
                        {allPending.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>שם התלמיד/ה</TableHead>
                                        <TableHead>סוג</TableHead>
                                        <TableHead>קונסרבטוריון</TableHead>
                                        <TableHead>סטטוס</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allPending.map(form => (
                                        <TableRow key={form.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/dashboard/forms/${form.id}`} className="hover:underline">{form.studentName}</Link>
                                            </TableCell>
                                            <TableCell>{form.formType}</TableCell>
                                            <TableCell>{form.conservatoriumName}</TableCell>
                                            <TableCell><StatusBadge status={form.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <p className="text-sm text-muted-foreground p-4 text-center">אין טפסים פתוחים במערכת.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
