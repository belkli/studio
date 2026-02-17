// @ts-nocheck
'use client';

import { mockFormSubmissions, mockUsers, conservatoriums } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Send, ThumbsDown, ArrowLeft, Signature, Trash, Download } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRef, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FormDetailsPage() {
    const params = useParams();
    const formId = params.id;
    const { toast } = useToast();
    const { user } = useAuth();
    const form = mockFormSubmissions.find(f => f.id === formId);
    
    const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const sigPadRef = useRef<SignatureCanvas>(null);

    if (!form) {
        notFound();
    }
    
    if (!user) {
        return null;
    }
    
    const formUser = mockUsers.find(u => u.id === form.studentId);
    
    const isTeacherApproval = user.role === 'teacher' && form.status === 'ממתין לאישור מורה';
    const isAdminFinalApproval = (user.role === 'conservatorium_admin' || user.role === 'site_admin') && form.status === 'ממתין לאישור מנהל';

    const generatePdf = (form) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        // jsPDF doesn't support Hebrew out-of-the-box. This is a simple workaround.
        const rtl = (text) => text ? text.split('').reverse().join('') : '';

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(form.formType), pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(rtl(`שנת לימודים: ${form.academicYear}`), pageWidth / 2, 28, { align: 'center' });
        doc.text(rtl(`קונסרבטוריון: ${form.conservatoriumName}`), pageWidth - 15, 40, { align: 'right' });
        doc.text(rtl(`תלמיד/ה: ${form.studentName}`), pageWidth - 15, 48, { align: 'right' });


        // Repertoire Table
        autoTable(doc, {
            startY: 60,
            head: [[rtl('משך'), rtl('ז\'אנר'), rtl('שם היצירה'), rtl('מלחין')]],
            body: form.repertoire.map(p => [
                p.duration,
                rtl(p.genre),
                rtl(p.title),
                rtl(p.composer)
            ]),
            styles: {
                halign: 'right',
                font: 'helvetica'
            },
            headStyles: {
                fillColor: [30, 64, 175], // a shade of blue
                halign: 'right'
            },
            columnStyles: { 0: { halign: 'center' } }
        });
        
        // Footer section
        const footerY = pageHeight - 55;

        // Signature
        if (form.signatureUrl) {
            doc.addImage(form.signatureUrl, 'PNG', 140, footerY, 50, 25);
        }
        doc.text(rtl("חתימת המנהל"), 165, footerY + 35, { align: 'center' });

        // Stamp
        const conservatorium = conservatoriums.find(c => c.name === form.conservatoriumName);
        if (conservatorium?.stampUrl) {
            // Set opacity for stamp
            const gState = new (doc as any).GState({opacity: 0.8});
            doc.setGState(gState);
            doc.addImage(conservatorium.stampUrl, 'PNG', 20, footerY - 5, 30, 30);
            // Reset opacity
            doc.setGState(new (doc as any).GState({opacity: 1}));
        }

        doc.save(`form_${form.id}.pdf`);
    };


    const handleTeacherApprove = () => {
        toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר והועבר לאישור מנהל.` });
    }
    
    const handleTeacherReject = () => {
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    }
    
    const handleAdminReject = () => {
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    }

    const handleConfirmApproval = () => {
        if (sigPadRef.current?.isEmpty()) {
            toast({
                variant: 'destructive',
                title: 'חתימה חסרה',
                description: 'יש לחתום על הטופס כדי לאשר אותו.',
            });
            return;
        }
        const signatureDataUrl = sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png');
        console.log('Signature Data URL:', signatureDataUrl); // Simulate saving the signature
        
        toast({ title: "הטופס אושר ונחתם!", description: `הטופס של ${form.studentName} אושר סופית.` });
        setSignatureDialogOpen(false);
    }
    
    const clearSignature = () => {
        sigPadRef.current?.clear();
    }

    const renderApprovalHistory = () => {
        const history = [
            <li key="submission" className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"><Send size={14} /></div>
                <div>
                    <p>הטופס הוגש על ידי {form.studentName}</p>
                    <time className="text-xs">{form.submissionDate}</time>
                </div>
            </li>
        ];

        if (form.status === 'ממתין לאישור מורה') {
            history.push(
                <li key="teacher-pending" className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>ממתין לאישור של {form.teacherDetails?.name || 'המורה'} (מורה)</p>
                    </div>
                </li>
            );
        } else if (['ממתין לאישור מנהל', 'מאושר', 'נדחה'].includes(form.status)) {
             history.push(
                <li key="teacher-approved" className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>אושר על ידי {form.teacherDetails?.name || 'המורה'}</p>
                    </div>
                </li>
            );
        }

        if (form.status === 'ממתין לאישור מנהל') {
            history.push(
                <li key="admin-pending" className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>ממתין לאישור של {user.name} (מנהל/ת)</p>
                    </div>
                </li>
            );
        } else if (form.status === 'מאושר') {
            history.push(
                <li key="admin-approved" className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>אושר סופית ונחתם על ידי {form.conservatoriumManagerName || 'המנהל/ת'}</p>
                        {form.signedAt && <time className="text-xs">{form.signedAt}</time>}
                    </div>
                </li>
            );
        } else if (form.status === 'נדחה') {
             history.push(
                <li key="rejected" className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-700 rounded-full h-6 w-6 flex items-center justify-center"><ThumbsDown size={14} /></div>
                    <div>
                        <p>הטופס נדחה</p>
                    </div>
                </li>
            );
        }

        return <ul className="space-y-4 text-sm text-muted-foreground">{history}</ul>;
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/forms">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        חזרה לכל הטפסים
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                  {form.status === 'מאושר' && (
                    <Button onClick={() => generatePdf(form)} variant="outline">
                        <Download className="ms-2 h-4 w-4" />
                        הורד PDF
                    </Button>
                  )}
                  <StatusBadge status={form.status} />
                </div>
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

                    {isTeacherApproval && (
                         <Card>
                            <CardHeader>
                                <CardTitle>פעולות (מורה)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea placeholder="הוסף הערה (אופציונלי)..." />
                                <div className="flex gap-4">
                                    <Button onClick={handleTeacherApprove} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="ms-2 h-4 w-4" /> אישור והעברה למנהל</Button>
                                    <Button onClick={handleTeacherReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> דחייה</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isAdminFinalApproval && (
                        <Card>
                            <CardHeader>
                                <CardTitle>פעולות (מנהל)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea placeholder="הוסף הערה (אופציונלי)..." />
                                <div className="flex gap-4">
                                    <Button onClick={() => setSignatureDialogOpen(true)} className="flex-1 bg-green-600 hover:bg-green-700"><Signature className="ms-2 h-4 w-4" /> אישור סופי וחתימה</Button>
                                    <Button onClick={handleAdminReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> דחייה</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar>
                                <AvatarImage src={formUser?.avatarUrl} />
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
                           {renderApprovalHistory()}
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
                    {form.signatureUrl && (
                        <Card>
                             <CardHeader>
                                <CardTitle>חתימה דיגיטלית</CardTitle>
                            </CardHeader>
                            <CardContent className='flex justify-center items-center p-4 border-dashed border-2 rounded-lg bg-muted/50'>
                                <img src={form.signatureUrl} alt="Digital Signature" className='h-24' />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <AlertDialog open={isSignatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>חתימה דיגיטלית לאישור הטופס</AlertDialogTitle>
                        <AlertDialogDescription>
                            אנא חתום/י בתיבה למטה כדי לאשר סופית את הטופס. החתימה תצורף למסמך.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="relative w-full aspect-[2/1] rounded-lg border bg-background">
                         <SignatureCanvas
                            ref={sigPadRef}
                            penColor='black'
                            canvasProps={{ className: 'w-full h-full' }}
                        />
                        <Button variant="ghost" size="icon" className="absolute top-2 left-2" onClick={clearSignature}>
                            <Trash className="h-4 w-4 text-destructive" />
                            <span className="sr-only">נקה חתימה</span>
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmApproval}>אשר וחתום</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
