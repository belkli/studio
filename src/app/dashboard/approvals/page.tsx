'use client';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Check, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { useMemo } from 'react';

const FormCard = ({ form, onApprove, onReject }: { form: FormSubmission; onApprove: () => void; onReject: () => void }) => {
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
                <Button variant="ghost" size="sm" onClick={onApprove} className="col-span-1 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800">
                    <Check className="ms-1 h-4 w-4" />
                    אישור
                </Button>
                <Button variant="ghost" size="sm" onClick={onReject} className="col-span-1 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800">
                    <ThumbsDown className="ms-1 h-4 w-4" />
                    דחייה
                </Button>
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
        const allPendingForms: FormSubmission[] = [];

        mockFormSubmissions.forEach(form => {
            let isPending = false;
            let isInMyQueue = false;

            if (form.status === 'ממתין לאישור מורה') {
                isPending = true;
                if(user.role === 'teacher' && user.students?.includes(form.studentId)) {
                    isInMyQueue = true;
                }
            } else if (form.status === 'ממתין לאישור מנהל') {
                isPending = true;
                if((user.role === 'conservatorium_admin' || user.role === 'site_admin') && (user.conservatoriumId === form.conservatoriumId || user.role === 'site_admin')) {
                    isInMyQueue = true;
                }
            }

            if (isInMyQueue) {
                myQueueForms.push(form);
            }
            if (isPending) {
                allPendingForms.push(form);
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
                <p className="text-muted-foreground">כאן תוכל לצפות ולאשר טפסים של תלמידים.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>ממתין לאישורך ({myQueue.length})</CardTitle>
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
                            <p className="text-sm text-muted-foreground p-4 text-center">אין טפסים הממתינים לך לאישור.</p>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>כלל הטפסים הממתינים ({allPending.length})</CardTitle>
                    </CardHeader>
                     <CardContent className="max-h-[60vh] overflow-y-auto p-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allPending.length > 0 ? (
                            allPending.map(form => (
                                <Card key={form.id} className="p-4">
                                    <p className="font-semibold">{form.studentName}</p>
                                    <p className="text-sm text-muted-foreground">{form.formType}</p>
                                    <div className="mt-2">
                                        <StatusBadge status={form.status} />
                                    </div>
                                     <Link href={`/dashboard/forms/${form.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">
                                        צפה בפרטים
                                    </Link>
                                </Card>
                            ))
                        ) : (
                             <p className="text-sm text-muted-foreground p-4 text-center">אין טפסים ממתינים במערכת.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
