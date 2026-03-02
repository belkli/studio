'use client';

import { mockUsers, conservatoriums, examLevels, examTypes } from '@/lib/data';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Send, ThumbsDown, ArrowLeft, Signature, Trash, Download, CircleCheckBig, ShieldAlert, Edit } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRef, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Separator } from '@/components/ui/separator';
import { RecitalForm } from '@/components/forms/recital-form';
import { KenesForm } from '@/components/forms/kenes-form';
import { ExamRegistrationForm } from '@/components/forms/exam-registration-form';
import type { FormSubmission, FormStatus } from '@/lib/types';


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
    const searchParams = useSearchParams();
    const formId = params.id as string;
    const { toast } = useToast();
    const { user, mockFormSubmissions: forms, updateForm, mockFormTemplates } = useAuth();
    const t = useTranslations('Forms');
    const ts = useTranslations('Status');
    const tl = useTranslations('Forms.labels');
    const tt = useTranslations('Forms.toasts');

    const form = useMemo(() => forms.find(f => f.id === formId), [forms, formId]);

    const { isTeacherApproval, isAdminFinalApproval, isMinistryApproval, isRevisable } = useMemo(() => {
        if (!user || !form) {
            return { isTeacherApproval: false, isAdminFinalApproval: false, isMinistryApproval: false, isRevisable: false };
        }
        return {
            isTeacherApproval: user.role === 'teacher' && form.status === 'PENDING_TEACHER',
            isAdminFinalApproval: (user.role === 'conservatorium_admin' || user.role === 'site_admin') && form.status === 'PENDING_ADMIN',
            isMinistryApproval: user.role === 'ministry_director' && form.status === 'APPROVED',
            isRevisable: (user.role === 'conservatorium_admin' || user.role === 'site_admin') && form.status === 'REVISION_REQUIRED',
        }
    }, [user, form]);

    const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === 'true' && isRevisable);
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
    const customFormTemplate = form.formTemplateId ? mockFormTemplates.find(t => t.id === form.formTemplateId) : undefined;


    const generatePdf = (form: FormSubmission) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        const rtl = (text: string | number) => text ? String(text).split('').reverse().join('') : '';

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(rtl(form.formType), pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(rtl(`שנת לימודים: ${form.academicYear || new Date().getFullYear()}`), pageWidth / 2, 28, { align: 'center' });

        let lastY = 40;

        const addSection = (title: string, body: (string | number | undefined)[][]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(rtl(title), pageWidth - 15, lastY, { align: 'right' });
            autoTable(doc, {
                startY: lastY + 5,
                body: body.map(row => row.map(cell => rtl(cell || ''))),
                theme: 'grid',
                styles: { halign: 'right', font: 'helvetica' },
                columnStyles: { 1: { halign: 'left' } },
            });
            lastY = (doc as any).lastAutoTable.finalY + 10;
        };

        if (customFormTemplate && form.formData) {
            const body = customFormTemplate.fields.map(field => [
                String(form.formData![field.id] || ''),
                field.label
            ]);
            addSection(rtl(t("formDetails")), body as any);
        } else {
            if (form.formType === 'רסיטל בגרות' || form.formType === 'הרשמה לבחינה') {
                addSection(t("personalDetails"), [
                    [form.studentName, tl('fullName')],
                    [formUser?.idNumber, tl('idNumber')],
                    [form.applicantDetails?.birthDate, tl('birthDate')],
                    [form.applicantDetails?.city, tl('city')],
                    [form.applicantDetails?.phone, tl('phone')],
                    [formUser?.email, tl('email')],
                ]);
            }
            if (form.formType === 'רסיטל בגרות') {
                addSection(t("schoolDetails"), [
                    [form.schoolDetails?.schoolName, tl('school')],
                    [form.schoolDetails?.hasMusicMajor ? String(t("labels.yes") || 'כן') : String(t("labels.no") || 'לא'), tl('hasMajor')],
                    [form.schoolDetails?.isMajorParticipant ? String(t("labels.yes") || 'כן') : String(t("labels.no") || 'לא'), tl('isMajorParticipant')],
                ]);
            }

            if (form.formType === 'הרשמה לבחינה') {
                addSection(t("examDetails" as any) || "פרטי הבחינה", [
                    [form.examLevel, tl('examLevel' as any) || 'רמת בחינה'],
                    [form.examType, tl('examType' as any) || 'סוג בחינה'],
                ]);
            }

            if (form.repertoire && form.repertoire.length > 0) {
                addSection(t("repertoireTitle"), form.repertoire.map(p => [
                    p.duration,
                    p.genre,
                    p.title,
                    p.composer
                ]) as any);
                doc.setFont('helvetica', 'bold');
                doc.text(rtl(`${tl('total')}: ${form.totalDuration}`), 15, lastY - 10, { align: 'left' });
            }
        }


        if (form.signatureUrl) {
            doc.addImage(form.signatureUrl, 'PNG', 140, pageHeight - 55, 50, 25);
        }
        doc.text(rtl(tl("managerSignature")), 165, pageHeight - 20, { align: 'center' });

        const conservatorium = conservatoriums.find(c => c.name === form.conservatoriumName);
        if (conservatorium?.stampUrl) {
            doc.setGState(new (doc as any).GState({ opacity: 0.8 }));
            doc.addImage(conservatorium.stampUrl, 'PNG', 20, pageHeight - 60, 30, 30);
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
        }

        doc.save(`form_${form.id}.pdf`);
    };


    const handleTeacherApprove = () => {
        const updatedForm = { ...form, status: 'PENDING_ADMIN' as FormStatus };
        updateForm(updatedForm);
        toast({ title: tt("approved"), description: tt("approvedDesc", { name: form.studentName }) });
    }

    const handleTeacherReject = () => {
        const updatedForm = { ...form, status: 'REJECTED' as FormStatus };
        updateForm(updatedForm);
        toast({ variant: "destructive", title: tt("rejected"), description: tt("rejectedDesc", { name: form.studentName }) });
    }

    const handleAdminReject = () => {
        const updatedForm = { ...form, status: 'REJECTED' as FormStatus };
        updateForm(updatedForm);
        toast({ variant: "destructive", title: tt("rejected"), description: tt("rejectedDesc", { name: form.studentName }) });
    }

    const handleConfirmApproval = () => {
        if (sigPadRef.current?.isEmpty()) {
            toast({
                variant: 'destructive',
                title: tt("signatureMissing"),
                description: tt("signatureMissingDesc"),
            });
            return;
        }
        const signatureDataUrl = sigPadRef.current?.getTrimmedCanvas().toDataURL('image/png');
        const updatedForm = { ...form, status: 'APPROVED' as FormStatus, signatureUrl: signatureDataUrl, signedAt: new Date().toLocaleDateString('he-IL') };
        updateForm(updatedForm);

        toast({ title: tt("signed"), description: tt("signedDesc", { name: form.studentName }) });
        setSignatureDialogOpen(false);
    }

    const handleMinistryFinalApprove = () => {
        const updatedForm = { ...form, status: 'FINAL_APPROVED' as FormStatus };
        updateForm(updatedForm);
        toast({ title: tt("ministryApprove"), description: tt("ministryApproveDesc", { name: form.studentName }) });
    }

    const handleMinistryRequestChanges = () => {
        const updatedForm = { ...form, status: 'REVISION_REQUIRED' as FormStatus, ministryComment: ministryRejectionReason };
        updateForm(updatedForm);
        setMinistryRejectionDialogOpen(false);
        toast({ variant: "destructive", title: tt("changesRequested"), description: tt("changesRequestedDesc", { name: form.studentName }) });
        setMinistryRejectionReason("");
    }

    const handleResubmit = (data: Partial<FormSubmission>) => {
        const totalDuration = (data.repertoire || []).reduce((total, item) => {
            if (!item?.duration) return total;
            const [minutes, seconds] = item.duration.split(':').map(Number);
            if (isNaN(minutes) || isNaN(seconds)) return total;
            return total + (minutes * 60) + seconds;
        }, 0);

        const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;

        const updatedForm: FormSubmission = {
            ...form,
            ...data,
            totalDuration: totalDurationFormatted,
            status: 'APPROVED',
            ministryComment: undefined,
        };
        updateForm(updatedForm);
        toast({ title: tt("resubmitted") });
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
                    <p>{ts('history.submitted', { name: form.studentName })}</p>
                    <time className="text-xs">{form.submissionDate}</time>
                </div>
            </li>
        ];

        if (form.status === 'PENDING_TEACHER') {
            history.push(
                <li key="teacher-pending" className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>{ts('history.pendingTeacher', { name: form.teacherDetails?.name || t('teacher') })}</p>
                    </div>
                </li>
            );
        } else if (['PENDING_ADMIN', 'APPROVED', 'FINAL_APPROVED', 'REVISION_REQUIRED', 'REJECTED'].includes(form.status)) {
            history.push(
                <li key="teacher-approved" className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>{ts('history.approvedTeacher', { name: form.teacherDetails?.name || t('teacher') })}</p>
                    </div>
                </li>
            );
        }

        if (form.status === 'PENDING_ADMIN') {
            history.push(
                <li key="admin-pending" className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>{ts('history.pendingAdmin', { name: user.name })}</p>
                    </div>
                </li>
            );
        } else if (['APPROVED', 'FINAL_APPROVED', 'REVISION_REQUIRED'].includes(form.status)) {
            history.push(
                <li key="admin-approved" className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center"><Check size={14} /></div>
                    <div>
                        <p>{ts('history.approvedAdmin', { name: form.conservatoriumManagerName || t('manager') })}</p>
                        {form.signedAt && <time className="text-xs">{form.signedAt}</time>}
                    </div>
                </li>
            );
        }

        if (form.status === 'REVISION_REQUIRED') {
            history.push(
                <li key="ministry-rejected" className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full h-6 w-6 flex items-center justify-center"><ShieldAlert size={14} /></div>
                    <div>
                        <p>{ts('history.ministryRejected')}</p>
                    </div>
                </li>
            );
        } else if (form.status === 'FINAL_APPROVED') {
            history.push(
                <li key="ministry-approved" className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-700 rounded-full h-6 w-6 flex items-center justify-center"><CircleCheckBig size={14} /></div>
                    <div>
                        <p>{ts('history.ministryApproved')}</p>
                    </div>
                </li>
            );
        }


        if (form.status === 'REJECTED') {
            history.push(
                <li key="rejected" className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-700 rounded-full h-6 w-6 flex items-center justify-center"><ThumbsDown size={14} /></div>
                    <div>
                        <p>{ts('history.rejected')}</p>
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
                        {t('backToAll')}
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                    {isRevisable && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="ms-2 h-4 w-4" />
                            {t('fixAndResubmit')}
                        </Button>
                    )}
                    {(form.status === 'APPROVED' || form.status === 'FINAL_APPROVED') && (
                        <Button onClick={() => generatePdf(form)} variant="outline">
                            <Download className="ms-2 h-4 w-4" />
                            {t('downloadPdf')}
                        </Button>
                    )}
                    <StatusBadge status={form.status} label={ts(form.status)} />
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
                            {form.formType === 'הרשמה לבחינה' && formUser && (
                                <ExamRegistrationForm
                                    user={user}
                                    student={formUser}
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
                                        {form.conservatoriumName} • {t('academicYear')}: {form.academicYear} {form.grade && `• ${t('gradeLabel')}: ${form.grade}`} • {t('submittedAt')} {form.submissionDate}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {customFormTemplate && form.formData && (
                                <DetailsCard title={t("formDetails")} columns={1}>
                                    {customFormTemplate.fields.map(field => {
                                        const value = form.formData![field.id];
                                        if (value === undefined || value === null) return null;

                                        let displayValue = String(value);
                                        if (field.type === 'checkbox') {
                                            displayValue = value ? (t('labels.yes') || 'כן') : (t('labels.no') || 'לא');
                                        } else if (typeof value === 'boolean') {
                                            displayValue = value ? (t('labels.yes') || 'כן') : (t('labels.no') || 'לא');
                                        }

                                        return <DetailItem key={field.id} label={field.label} value={displayValue} />;
                                    })}
                                </DetailsCard>
                            )}

                            {(form.formType === 'רסיטל בגרות' || form.formType === 'הרשמה לבחינה') && (
                                <DetailsCard title={t("personalDetails")} columns={4}>
                                    <DetailItem label={tl('fullName')} value={form.studentName} />
                                    <DetailItem label={tl('idNumber')} value={formUser?.idNumber} />
                                    <DetailItem label={tl('birthDate')} value={form.applicantDetails?.birthDate} />
                                    <DetailItem label={tl('gender')} value={form.applicantDetails?.gender} />
                                    <DetailItem label={tl('city')} value={form.applicantDetails?.city} />
                                    <DetailItem label={tl('phone')} value={form.applicantDetails?.phone} />
                                    <DetailItem label={tl('email')} value={formUser?.email} />
                                </DetailsCard>
                            )}


                            {form.formType === 'רסיטל בגרות' && (
                                <>
                                    <DetailsCard title={t("schoolDetails")} columns={3}>
                                        <DetailItem label={tl('school')} value={form.schoolDetails?.schoolName} />
                                        <DetailItem label={tl('hasMajor')} value={form.schoolDetails?.hasMusicMajor ? (t('labels.yes') || "כן") : (t('labels.no') || "לא")} />
                                        <DetailItem label={tl('isMajorParticipant')} value={form.schoolDetails?.isMajorParticipant ? (t('labels.yes') || "כן") : (t('labels.no') || "לא")} />
                                    </DetailsCard>
                                    <DetailsCard title={t("studyDetails")} columns={2}>
                                        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                                            <h4 className="font-semibold text-muted-foreground">{t('instrumentDetails')}</h4>
                                            <DetailItem label={tl('instrument')} value={form.instrumentDetails?.instrument} />
                                            <DetailItem label={tl('yearsOfStudy')} value={form.instrumentDetails?.yearsOfStudy} />
                                        </div>
                                        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                                            <h4 className="font-semibold text-muted-foreground">{t('teacherDetails')}</h4>
                                            <DetailItem label={tl('teacherName')} value={form.teacherDetails?.name} />
                                            <DetailItem label={tl('yearsWithTeacher')} value={form.teacherDetails?.yearsWithTeacher} />
                                        </div>
                                    </DetailsCard>
                                </>
                            )}
                            {form.formType === 'כנס / אירוע' && (
                                <>
                                    <DetailsCard title="1. פרטי האירוע" columns={3}>
                                        <DetailItem label="שם האירוע" value={form.eventName} />
                                        <DetailItem label="תאריך" value={form.eventDate} />
                                        <DetailItem label="מיקום" value={form.eventLocation} />
                                    </DetailsCard>
                                    <DetailsCard title="2. פרטי ההרכב" columns={3}>
                                        <DetailItem label="מנצח/ת" value={form.conductor} />
                                        <DetailItem label="מלווה" value={form.accompanist} />
                                        <DetailItem label="מספר משתתפים" value={form.numParticipants} />
                                    </DetailsCard>
                                </>
                            )}

                            {form.formType === 'הרשמה לבחינה' && (
                                <DetailsCard title={t("examDetails" as any) || "פרטי בחינה"} columns={3}>
                                    <DetailItem label={tl('examLevel' as any) || "רמת בחינה"} value={form.examLevel} />
                                    <DetailItem label={tl('examType' as any) || "סוג בחינה"} value={form.examType} />
                                    <DetailItem label={tl('preferredDateRange' as any) || "טווח תאריכים מועדף"} value={form.preferredExamDateRange} />
                                </DetailsCard>
                            )}

                            {form.repertoire.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('repertoireTitle')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{tl('composer')}</TableHead>
                                                    <TableHead>{tl('pieceTitle')}</TableHead>
                                                    <TableHead>{tl('genre')}</TableHead>
                                                    <TableHead className="text-center">{tl('duration')}</TableHead>
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
                                        <span>{t('totalDuration')}: {form.totalDuration}</span>
                                    </CardFooter>
                                </Card>
                            )}

                            {isTeacherApproval && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('teacherActions')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea placeholder={t('labels.addNote' as any) || "הוסף הערה (אופציונלי)..."} />
                                        <div className="flex gap-4">
                                            <Button onClick={handleTeacherApprove} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="ms-2 h-4 w-4" /> {t('approveAndForward')}</Button>
                                            <Button onClick={handleTeacherReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> {t('reject')}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {isAdminFinalApproval && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('adminActions')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea placeholder={t('labels.addNote' as any) || "הוסף הערה (אופציונלי)..."} />
                                        <div className="flex gap-4">
                                            <Button onClick={() => setSignatureDialogOpen(true)} className="flex-1 bg-green-600 hover:bg-green-700"><Signature className="ms-2 h-4 w-4" /> {t('approveAndSign')}</Button>
                                            <Button onClick={handleAdminReject} variant="destructive" className="flex-1"><ThumbsDown className="ms-2 h-4 w-4" /> {t('reject')}</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {isMinistryApproval && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('ministryActions')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex gap-4">
                                        <Button onClick={handleMinistryFinalApprove} className="flex-1 bg-blue-600 hover:bg-blue-700"><CircleCheckBig className="ms-2 h-4 w-4" /> {t('finalApprove')}</Button>
                                        <Button onClick={() => setMinistryRejectionDialogOpen(true)} variant="destructive" className="flex-1 bg-purple-600 hover:bg-purple-700"><ShieldAlert className="ms-2 h-4 w-4" /> {t('requestChanges')}</Button>
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
                                <CardDescription>{t('studentRole' as any) || 'תלמיד/ה'}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('history')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderApprovalHistory()}
                        </CardContent>
                    </Card>
                    {form.teacherComment && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('teacherComment')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic">"{form.teacherComment}"</p>
                            </CardContent>
                        </Card>
                    )}
                    {form.ministryComment && (
                        <Card className="border-purple-300 bg-purple-50/50">
                            <CardHeader>
                                <CardTitle className="text-purple-800">{t('ministryComment')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-purple-700">"{form.ministryComment}"</p>
                            </CardContent>
                        </Card>
                    )}
                    {form.signatureUrl && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('digitalSignature')}</CardTitle>
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
                        <AlertDialogTitle>{t('signatureDialogTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('signatureDialogDesc')}
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
                            <span className="sr-only">{t('clearSignature')}</span>
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('labels.cancel' as any) || 'ביטול'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmApproval}>{t('approveAndSign')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isMinistryRejectionDialogOpen} onOpenChange={setMinistryRejectionDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('ministryChangesTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('ministryChangesDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder={t('labels.reasonPlaceholder' as any) || "פרט את הסיבות כאן..."}
                        value={ministryRejectionReason}
                        onChange={(e) => setMinistryRejectionReason(e.target.value)}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('labels.cancel' as any) || 'ביטול'}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMinistryRequestChanges}>{t('sendChangesRequest')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
