// @ts-nocheck
'use client';

import { mockFormSubmissions, mockUsers, conservatoriums } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Send, ThumbsDown, ArrowLeft, Signature, Trash, Download, CircleCheckBig, ShieldAlert, Edit } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRef, useState, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Separator } from '@/components/ui/separator';
import { RecitalForm } from '@/components/forms/recital-form';
import { KenesForm } from '@/components/forms/kenes-form';
import type { FormSubmission } from '@/lib/types';


const DetailsCard = ({ title, children, columns = 4 }: { title: string, children: React.ReactNode, columns?: number }) => (
    <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-x-6 gap-y-4 text-sm`}>
            {children}
        </CardContent>
    </Card>
);

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value || '-'}</span>
    </div>
);


export default function FormDetailsPage() {
    const params = useParams();
    const formId = params.id;
    const { toast } = useToast();
    const { user, mockFormSubmissions: forms, updateForm } = useAuth();
    
    const form = useMemo(() => forms.find(f => f.id === formId), [forms, formId]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [isMinistryRejectionDialogOpen, setMinistryRejectionDialogOpen] = useState(false);
    const [ministryRejectionReason, setMinistryRejectionReason] = useState("");
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
    const isMinistryApproval = user.role === 'ministry_director' && form.status === 'מאושר';
    const isRevisable = (user.role === 'conservatorium_admin' || user.role === 'site_admin') && form.status === 'נדרש תיקון';


    const generatePdf = (form) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        const rtl = (text) => text ? text.split('').reverse().join('') : '';

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(form.formType), pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(rtl(`שנת לימודים: ${form.academicYear}`), pageWidth / 2, 28, { align: 'center' });
        
        let lastY = 40;

        const addSection = (title, body) => {
            doc.setFont('helvetica', 'bold');
            doc.text(rtl(title), pageWidth - 15, lastY, { align: 'right' });
            autoTable(doc, {
                startY: lastY + 5,
                body,
                theme: 'grid',
                styles: { halign: 'right', font: 'helvetica' },
                columnStyles: { 1: { halign: 'left' } },
            });
            lastY = (doc as any).lastAutoTable.finalY + 10;
        };

        if (form.formType === 'רסיטל בגרות') {
             addSection("פרטי התלמיד/ה", [
                [rtl(form.studentName), rtl('שם מלא')],
                [formUser?.idNumber, rtl('ת.ז.')],
                [form.applicantDetails?.birthDate, rtl('תאריך לידה')],
                [rtl(form.applicantDetails?.city), rtl('עיר מגורים')],
                [form.applicantDetails?.phone, rtl('טלפון')],
                [formUser?.email, rtl('דוא"ל')],
             ]);
              addSection("פרטי בית ספר", [
                [rtl(form.schoolDetails?.schoolName), rtl('בית ספר')],
                [rtl(form.schoolDetails?.hasMusicMajor ? 'כן' : 'לא'), rtl('מגמת מוזיקה')],
                [rtl(form.schoolDetails?.isMajorParticipant ? 'כן' : 'לא'), rtl('משתתף במגמה')],
              ]);
        }
        
        addSection("רפרטואר", form.repertoire.map(p => [
            p.duration,
            rtl(p.genre),
            rtl(p.title),
            rtl(p.composer)
        ]));
        doc.setFont('helvetica', 'bold');
        doc.text(rtl(`סה"כ: ${form.totalDuration}`), 15, lastY -10, { align: 'left' });


        if (form.signatureUrl) {
            doc.addImage(form.signatureUrl, 'PNG', 140, pageHeight - 55, 50, 25);
        }
        doc.text(rtl("חתימת המנהל"), 165, pageHeight - 20, { align: 'center' });

        const conservatorium = conservatoriums.find(c => c.name === form.conservatoriumName);
        if (conservatorium?.stampUrl) {
            doc.setGState(new (doc as any).GState({opacity: 0.8}));
            doc.addImage(conservatorium.stampUrl, 'PNG', 20, pageHeight - 60, 30, 30);
            doc.setGState(new (doc as any).GState({opacity: 1}));
        }

        doc.save(`form_${form.id}.pdf`);
    };


    const handleTeacherApprove = () => {
        const updatedForm = { ...form, status: 'ממתין לאישור מנהל' };
        updateForm(updatedForm);
        toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר והועבר לאישור מנהל.` });
    }
    
    const handleTeacherReject = () => {
        const updatedForm = { ...form, status: 'נדחה' };
        updateForm(updatedForm);
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    }
    
    const handleAdminReject = () => {
        const updatedForm = { ...form, status: 'נדחה' };
        updateForm(updatedForm);
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
        const updatedForm = { ...form, status: 'מאושר', signatureUrl: signatureDataUrl, signedAt: new Date().toLocaleDateString('he-IL') };
        updateForm(updatedForm);
        
        toast({ title: "הטופס אושר ונחתם!", description: `הטופס של ${form.studentName} אושר סופית.` });
        setSignatureDialogOpen(false);
    }
    
    const handleMinistryFinalApprove = () => {
        const updatedForm = { ...form, status: 'מאושר סופית' };
        updateForm(updatedForm);
        toast({ title: "הטופס אושר סופית", description: `הטופס של ${form.studentName} אושר סופית על ידי משרד החינוך.` });
    }

    const handleMinistryRequestChanges = () => {
        const updatedForm = { ...form, status: 'נדרש תיקון', ministryComment: ministryRejectionReason };
        updateForm(updatedForm);
        setMinistryRejectionDialogOpen(false);
        toast({ variant: "destructive", title: "דרישה לתיקונים נשלחה", description: `הטופס של ${form.studentName} הוחזר למנהל הקונסרבטוריון לתיקונים.` });
        setMinistryRejectionReason("");
    }
    
    const handleResubmit = (data: Partial<FormSubmission>) => {
        const totalDuration = (data.repertoire || []).reduce((total, item) => {
            if (!item?.duration) return total;
            const [minutes, seconds] = item.duration.split(':').map(Number);
            if(isNaN(minutes) || isNaN(seconds)) return total;
            return total + (minutes * 60) + seconds;
        }, 0);

        const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;

        const updatedForm = { 
            ...form, 
            ...data, 
            totalDuration: totalDurationFormatted,
            status: 'מאושר', // Send back for ministry approval
            ministryComment: undefined,
        };
        updateForm(updatedForm);
        toast({ title: 'הטופס עודכן ונשלח מחדש לאישור.' });
        setIsEditing(false);
    };

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
        } else if (['ממתין לאישור מנהל', 'מאושר', 'מאושר סופית', 'נדרש תיקון', 'נדחה'].includes(form.status)) {
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
        } else if (['מאושר', 'מאושר סופית', 'נדרש תיקון'].includes(form.status)) {
            history.push(
                <li key="admin-approved" className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>אושר ונחתם על ידי {form.conservatoriumManagerName || 'המנהל/ת'}</p>
                        {form.signedAt && <time className="text-xs">{form.signedAt}</time>}
                    </div>
                </li>
            );
        }
        
        if (form.status === 'נדרש תיקון') {
             history.push(
                <li key="ministry-rejected" className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full h-6 w-6 flex items-center justify-center"><ShieldAlert size={14} /></div>
                    <div>
                        <p>הוחזר לתיקונים על ידי משרד החינוך</p>
                    </div>
                </li>
            );
        } else if (form.status === 'מאושר סופית') {
             history.push(
                <li key="ministry-approved" className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-700 rounded-full h-6 w-6 flex items-center justify-center"><CircleCheckBig size={14} /></div>
                    <div>
                        <p>אושר סופית על ידי משרד החינוך</p>
                    </div>
                </li>
            );
        }


        if (form.status === 'נדחה') {
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
                  {isRevisable && (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="ms-2 h-4 w-4" />
                      תקן ושלח מחדש
                    </Button>
                  )}
                  {(form.status === 'מאושר' || form.status === 'מאושר סופית') && (
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

                    {isEditing ? (
                         <div className="space-y-6">
                            {form.formType === 'רסיטל בגרות' && formUser && (
                                <RecitalForm
                                    user={user}
                                    student={formUser}
                                    initialData={form}
                                    onSubmit={handleResubmit}
                                    isEditing={true}
                                    onCancel={() => setIsEditing(false)}
                                />
                            )}
                            {form.formType === 'כנס / אירוע' && (
                                <KenesForm
                                    user={user}
                                    initialData={form}
                                    onSubmit={handleResubmit}
                                    isEditing={true}
                                    onCancel={() => setIsEditing(false)}
                                />
                            )}
                         </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{form.formType}</CardTitle>
                                    <CardDescription>
                                        {form.conservatoriumName} • שנת לימודים: {form.academicYear} • כיתה: {form.grade} • הוגש ב-{form.submissionDate}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            {form.formType === 'רסיטל בגרות' && (
                                <>
                                    <DetailsCard title="1. פרטים אישיים של המועמד/ת" columns={4}>
                                        <DetailItem label="שם מלא" value={form.studentName} />
                                        <DetailItem label="ת.ז." value={formUser?.idNumber} />
                                        <DetailItem label="תאריך לידה" value={form.applicantDetails?.birthDate} />
                                        <DetailItem label="מין" value={form.applicantDetails?.gender} />
                                        <DetailItem label="עיר מגורים" value={form.applicantDetails?.city} />
                                        <DetailItem label="טלפון נייד" value={form.applicantDetails?.phone} />
                                        <DetailItem label="אימייל" value={formUser?.email} />
                                    </DetailsCard>
                                     <DetailsCard title="2. פרטי בית ספר תיכון" columns={3}>
                                        <DetailItem label="בית ספר" value={form.schoolDetails?.schoolName} />
                                        <DetailItem label="האם קיימת מגמת מוזיקה?" value={form.schoolDetails?.hasMusicMajor ? "כן" : "לא"} />
                                        <DetailItem label="האם משתתף/ת במגמה?" value={form.schoolDetails?.isMajorParticipant ? "כן" : "לא"} />
                                     </DetailsCard>
                                    <DetailsCard title="3 & 4. פרטי לימוד והוראה" columns={2}>
                                        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                                            <h4 className="font-semibold text-muted-foreground">פרטי הכלי</h4>
                                             <DetailItem label="כלי נגינה / שירה" value={formUser?.instruments?.[0]?.instrument} />
                                             <DetailItem label="סך שנות לימוד בכלי" value={formUser?.instruments?.[0]?.yearsOfStudy} />
                                        </div>
                                         <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                                             <h4 className="font-semibold text-muted-foreground">פרטי המורה</h4>
                                            <DetailItem label="שם המורה" value={form.teacherDetails?.name} />
                                            <DetailItem label="סך שנות לימוד עם המורה" value={form.teacherDetails?.yearsWithTeacher} />
                                        </div>
                                    </DetailsCard>
                                </>
                            )}
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>תוכנית לביצוע</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>מלחין</TableHead>
                                                <TableHead>שם היצירה</TableHead>
                                                <TableHead>ז'אנר</TableHead>
                                                <TableHead className="text-center">משך</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {form.repertoire.map((piece, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{piece.composer}</TableCell>
                                                    <TableCell>{piece.title}</TableCell>
                                                    <TableCell>{piece.genre}</TableCell>
                                                    <TableCell className="text-center">{piece.duration}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                                <Separator />
                                <CardFooter className="justify-end font-bold text-lg pt-6">
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
                                            <Button onClick={() => setSignatureDialogOpen(true)} className="flex-1 bg-green-600 hover:bg-green-700"><Signature className="ms-2 h-4 w-4" /> אישור וחתימה</Button>
                                            <Button onClick={handleAdminReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> דחייה</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
        
                            {isMinistryApproval && (
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>פעולות (משרד החינוך)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-4">
                                        <Button onClick={handleMinistryFinalApprove} className="flex-1 bg-blue-600 hover:bg-blue-700"><CircleCheckBig className="ms-2 h-4 w-4" /> אישור סופי</Button>
                                        <Button onClick={() => setMinistryRejectionDialogOpen(true)} variant="destructive" className="flex-1 bg-purple-600 hover:bg-purple-700"><ShieldAlert className="ms-2 h-4 w-4" /> דרישה לתיקונים</Button>
                                    </CardContent>
                                </Card>
                            )}
                        </>
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
                     {form.ministryComment && (
                        <Card className="border-purple-300 bg-purple-50/50">
                            <CardHeader>
                                <CardTitle className="text-purple-800">הערת משרד החינוך</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-purple-700">"{form.ministryComment}"</p>
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
                <AlertDialogContent dir="rtl" className="sm:max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>חתימה דיגיטלית לאישור הטופס</AlertDialogTitle>
                        <AlertDialogDescription>
                            אנא חתום/י בתיבה למטה כדי לאשר סופית את הטופס. החתימה תצורף למסמך.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="relative w-full aspect-[3/1] rounded-lg border bg-background">
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
                        <AlertDialogAction onClick={handleConfirmApproval}>אישור וחתימה</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isMinistryRejectionDialogOpen} onOpenChange={setMinistryRejectionDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>דרישה לתיקונים</AlertDialogTitle>
                        <AlertDialogDescription>
                            נא לפרט את הסיבה להחזרת הטופס לתיקונים. ההערה תוצג למנהל הקונסרבטוריון.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea 
                        placeholder="פרט את הסיבות כאן..."
                        value={ministryRejectionReason}
                        onChange={(e) => setMinistryRejectionReason(e.target.value)}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMinistryRequestChanges}>שלח דרישה לתיקונים</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
