'use client';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Check, ThumbsDown, Edit, Download, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ApprovalsTable = ({ 
    forms, 
    onApprove, 
    onReject, 
    showActions 
}: { 
    forms: FormSubmission[], 
    onApprove: (form: FormSubmission) => void, 
    onReject: (form: FormSubmission) => void,
    showActions: boolean
}) => {
    
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const { user } = useAuth();
    
    const handleSelectAll = (checked: boolean | string) => {
        if (checked) {
            setSelectedRows(forms.map(f => f.id));
        } else {
            setSelectedRows([]);
        }
    };
    
    const handleRowSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedRows([...selectedRows, id]);
        } else {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        }
    };
    
    if (forms.length === 0) {
        return <p className="text-center text-muted-foreground p-8">אין טפסים להצגה.</p>;
    }
    
    return (
        <div>
            {user && (user.role === 'conservatorium_admin' || user.role === 'site_admin') && (
                <div className="flex items-center gap-2 mb-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={selectedRows.length === 0}>
                                <MoreHorizontal className="me-2 h-4 w-4" />
                                פעולות קבוצתיות ({selectedRows.length})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                <Check className="ms-2 h-4 w-4 text-green-500" />
                                אשר את כל הבחורים
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <Download className="ms-2 h-4 w-4" />
                                יצא כ-PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                onCheckedChange={handleSelectAll} 
                                checked={selectedRows.length === forms.length && forms.length > 0}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>שם התלמיד/ה</TableHead>
                        <TableHead>סוג</TableHead>
                        <TableHead>קונסרבטוריון</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map(form => {
                         const canRevise = (user?.role === 'conservatorium_admin' || user?.role === 'site_admin') && form.status === 'נדרש תיקון';

                        return (
                            <TableRow key={form.id} data-state={selectedRows.includes(form.id) ? "selected" : ""}>
                                <TableCell>
                                     <Checkbox 
                                        onCheckedChange={(checked) => handleRowSelect(form.id, !!checked)}
                                        checked={selectedRows.includes(form.id)}
                                        aria-label="Select row"
                                     />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/forms/${form.id}`} className="hover:underline">{form.studentName}</Link>
                                </TableCell>
                                <TableCell>{form.formType}</TableCell>
                                <TableCell>{form.conservatoriumName}</TableCell>
                                <TableCell><StatusBadge status={form.status} /></TableCell>
                                <TableCell className="text-left">
                                     <div className="flex justify-end gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/forms/${form.id}`}>
                                                <Eye className="ms-1 h-4 w-4" />
                                                צפייה
                                            </Link>
                                        </Button>
                                        
                                        {showActions && (
                                            <>
                                                {canRevise ? (
                                                    <Button asChild variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                                        <Link href={`/dashboard/forms/${form.id}?edit=true`}>
                                                            <Edit className="ms-1 h-4 w-4" />
                                                            תקן ושלח
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button variant="outline" size="sm" onClick={() => onApprove(form)} className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                                                            <Check className="ms-1 h-4 w-4" />
                                                            אישור
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => onReject(form)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                            <ThumbsDown className="ms-1 h-4 w-4" />
                                                            דחייה
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

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
        if (form.status === 'מאושר' && user?.role === 'ministry_director') nextStatus = 'מאושר סופית';

        if (nextStatus) {
            updateForm({ ...form, status: nextStatus });
            toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} הועבר לשלב הבא.` });
        }
    };
    
    const handleReject = (form: FormSubmission) => {
        let newStatus: FormSubmission['status'] = 'נדחה';
        if (form.status === 'מאושר' && user?.role === 'ministry_director') {
            newStatus = 'נדרש תיקון';
        }
        updateForm({ ...form, status: newStatus });
        toast({ variant: "destructive", title: newStatus === 'נדחה' ? "הטופס נדחה" : "נדרש תיקון", description: `הטופס של ${form.studentName} ${newStatus === 'נדחה' ? 'נדחה' : 'הוחזר לתיקונים'}.` });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">אישורים</h1>
                <p className="text-muted-foreground">כאן תוכל לצפות ולאשר טפסים של תלמידים ומורים.</p>
            </div>
            
             <Tabs defaultValue="my-queue">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="my-queue">
                        לטיפולך
                         {myQueue.length > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{myQueue.length}</span>}
                    </TabsTrigger>
                     <TabsTrigger value="all-open">כלל הטפסים הפתוחים</TabsTrigger>
                     <TabsTrigger value="overdue" disabled>באיחור</TabsTrigger>
                </TabsList>
                <TabsContent value="my-queue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>טפסים הממתינים לטיפולך</CardTitle>
                            <CardDescription>טפסים אלו דורשים את אישורך, דחייתך או תיקונך כדי להתקדם בתהליך.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ApprovalsTable forms={myQueue} onApprove={handleApprove} onReject={handleReject} showActions={true} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="all-open" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>כלל הטפסים הפתוחים במערכת</CardTitle>
                            <CardDescription>סקירה כללית של כל הטפסים שנמצאים בתהליך אישור.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ApprovalsTable forms={allPending} onApprove={handleApprove} onReject={handleReject} showActions={false}/>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
