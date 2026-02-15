'use client';

import { mockFormSubmissions, mockUser } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FormStatus } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Send, ThumbsDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


const statusColors: Record<FormStatus, string> = {
    'טיוטה': "bg-gray-200 text-gray-800 hover:bg-gray-200/80 dark:bg-gray-700 dark:text-gray-200",
    'ממתין לאישור מורה': "bg-orange-200 text-orange-800 hover:bg-orange-200/80 dark:bg-orange-800 dark:text-orange-100",
    'ממתין לאישור מנהל': "bg-yellow-200 text-yellow-800 hover:bg-yellow-200/80 dark:bg-yellow-800 dark:text-yellow-100",
    'מאושר': "bg-green-200 text-green-800 hover:bg-green-200/80 dark:bg-green-800 dark:text-green-100",
    'נדחה': "bg-red-200 text-red-800 hover:bg-red-200/80 dark:bg-red-800 dark:text-red-100",
};


export default function FormDetailsPage() {
    const params = useParams();
    const formId = params.id;
    const { toast } = useToast();
    const form = mockFormSubmissions.find(f => f.id === formId);
    const user = mockUser;

    if (!form) {
        notFound();
    }

    const canApprove = user.role === 'teacher' || user.role === 'conservatorium_admin' || user.role === 'site_admin';

    const handleApprove = () => {
        toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר בהצלחה.` });
    }
    
    const handleReject = () => {
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/forms">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        חזרה לכל הטפסים
                    </Link>
                </Button>
                <Badge variant="outline" className={statusColors[form.status]}>{form.status}</Badge>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{form.formType}</CardTitle>
                            <CardDescription>הוגש בתאריך {form.submissionDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>מלחין</TableHead>
                                        <TableHead>שם היצירה</TableHead>
                                        <TableHead>ז'אנר</TableHead>
                                        <TableHead className="text-right">משך</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.repertoire.map((piece, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{piece.composer}</TableCell>
                                            <TableCell>{piece.title}</TableCell>
                                            <TableCell>{piece.genre}</TableCell>
                                            <TableCell className="text-right">{piece.duration}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-end font-bold text-lg">
                            <span>סה"כ זמן ביצוע: {form.totalDuration}</span>
                        </CardFooter>
                    </Card>

                    {canApprove && (
                         <Card>
                            <CardHeader>
                                <CardTitle>פעולות</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea placeholder="הוסף הערה (אופציונלי)..." />
                                <div className="flex gap-4">
                                    <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="ms-2 h-4 w-4" /> אישור</Button>
                                    <Button onClick={handleReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> דחייה</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${form.studentId}`} />
                                <AvatarFallback>{form.studentName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{form.studentName}</CardTitle>
                                <CardDescription>תלמיד/ה</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>היסטוריית אישורים</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4 text-sm text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"><Send size={14} /></div>
                                    <div>
                                        <p>הטופס הוגש על ידי {form.studentName}</p>
                                        <time className="text-xs">{form.submissionDate}</time>
                                    </div>
                                </li>
                                {form.status !== 'טיוטה' && (
                                    <li className="flex items-start gap-3">
                                         <div className="bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                                        <div>
                                            <p>ממתין לאישור של {mockUser.name} (מורה)</p>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                    {form.teacherComment && (
                        <Card>
                            <CardHeader>
                                <CardTitle>הערת המורה</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic">"{form.teacherComment}"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
