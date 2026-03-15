'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileSignature, AlertCircle, Clock, BookOpen, Mic, Award, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

type MinistryForm = {
    id: string;
    type: 'EXAM_REGISTRATION' | 'COMPOSITION_SUBMISSION' | 'RECITAL' | 'SCHOLARSHIP';
    studentName: string;
    conservatorium: string;
    submittedAt: string;
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
    urgency: 'HIGH' | 'NORMAL';
    details: string;
};

const MOCK_FORMS: MinistryForm[] = [
    { id: 'f-1', type: 'EXAM_REGISTRATION', studentName: 'יעל כהן', conservatorium: 'קונסרבטוריון פתח תקווה', submittedAt: '2026-10-14T08:00:00Z', status: 'SUBMITTED', urgency: 'HIGH', details: 'רישום למבחן שלב א׳ (פסנתר). כל דרישות הרפרטואר מולאו ואושרו ע"י המורה.' },
    { id: 'f-2', type: 'COMPOSITION_SUBMISSION', studentName: 'דוד לוי', conservatorium: 'קונסרבטוריון כרמיאל', submittedAt: '2026-10-12T10:30:00Z', status: 'SUBMITTED', urgency: 'NORMAL', details: 'הגשת יצירה מקורית "רוח סתיו" להרכב קאמרי. נושא מצורף כקובץ מלודיה.' },
    { id: 'f-3', type: 'RECITAL', studentName: 'נועה ברק', conservatorium: 'מרכז המוזיקה תל אביב', submittedAt: '2026-10-10T14:15:00Z', status: 'APPROVED', urgency: 'NORMAL', details: 'אישור תוכנית רסיטל בגרות (כינור). 45 דקות רפרטואר מלא.' },
    { id: 'f-4', type: 'SCHOLARSHIP', studentName: 'איתי שפירא', conservatorium: 'קונסרבטוריון באר שבע', submittedAt: '2026-10-05T09:20:00Z', status: 'REJECTED', urgency: 'NORMAL', details: 'בקשת מלגת הצטיינות מטעם משרד החינוך לשנת 2026.' }
];

export function MinistryInboxPanel() {
    const t = useTranslations('Ministry');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const dateLocale = useDateLocale();

    const { toast } = useToast();
    const [forms, setForms] = useState<MinistryForm[]>(MOCK_FORMS);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectionBoxOpen, setIsRejectionBoxOpen] = useState(false);

    const activeForm = forms.find(f => f.id === selectedFormId);

    const pendingForms = forms.filter(f => f.status === 'SUBMITTED');
    const processedForms = forms.filter(f => f.status !== 'SUBMITTED');

    const handleAction = (formId: string, newStatus: MinistryForm['status']) => {
        setForms(prev => prev.map(f => f.id === formId ? { ...f, status: newStatus } : f));

        let statusMsg = '';
        if (newStatus === 'APPROVED') statusMsg = t('successApprove');
        else if (newStatus === 'REJECTED') statusMsg = t('successReject');
        else statusMsg = t('successNeedsChanges');

        toast({ title: statusMsg });

        setIsRejectionBoxOpen(false);
        setRejectionReason('');
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'EXAM_REGISTRATION': return <Award className="w-4 h-4 text-purple-600" />;
            case 'COMPOSITION_SUBMISSION': return <BookOpen className="w-4 h-4 text-blue-600" />;
            case 'RECITAL': return <Mic className="w-4 h-4 text-orange-600" />;
            case 'SCHOLARSHIP': return <FileText className="w-4 h-4 text-green-600" />;
            default: return <FileSignature className="w-4 h-4" />;
        }
    };

    const getTypeName = (type: string) => {
        return t(`formTypes.${type}`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Sidebar Inbox List */}
            <Card className="lg:col-span-1 shadow-sm flex flex-col overflow-hidden border-t-4 border-t-purple-700">
                <CardHeader className="bg-purple-50/50 pb-2">
                    <CardTitle className="text-purple-900 text-lg flex items-center gap-2">
                        <FileSignature className="w-5 h-5" />
                        {t('inboxTitle')}
                        {pendingForms.length > 0 && <Badge variant="destructive" className="ms-auto rounded-full">{pendingForms.length}</Badge>}
                    </CardTitle>
                </CardHeader>
                <Tabs defaultValue="pending" className="flex-1 flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="px-4 border-b">
                        <TabsList className="w-full grid grid-cols-2 bg-muted/50 mb-2">
                            <TabsTrigger value="pending">{t('pending', { count: pendingForms.length })}</TabsTrigger>
                            <TabsTrigger value="processed">{t('processed', { count: processedForms.length })}</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 px-4 py-2">
                        <TabsContent value="pending" className="mt-0 space-y-2">
                            {pendingForms.map(form => (
                                <button key={form.id} onClick={() => setSelectedFormId(form.id)} className={`w-full text-start p-3 rounded-lg border text-sm transition-colors ${selectedFormId === form.id ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-card hover:bg-muted/50 border-border'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold">{form.studentName}</span>
                                        {form.urgency === 'HIGH' && <Badge variant="destructive" className="text-[10px] px-1 h-4">{t('urgent')}</Badge>}
                                    </div>
                                    <div className="text-muted-foreground text-xs flex items-center gap-1 mb-2">
                                        {getTypeIcon(form.type)} {getTypeName(form.type)}
                                    </div>
                                    <div className="text-xs text-muted-foreground border-t pt-1 mt-1 truncate">
                                        {form.conservatorium}
                                    </div>
                                </button>
                            ))}
                            {pendingForms.length === 0 && <div className="text-center p-6 text-muted-foreground text-sm">{t('emptyInbox')}</div>}
                        </TabsContent>

                        <TabsContent value="processed" className="mt-0 space-y-2">
                            {processedForms.map(form => (
                                <button key={form.id} onClick={() => setSelectedFormId(form.id)} className={`w-full text-start p-3 rounded-lg border text-sm transition-colors ${selectedFormId === form.id ? 'bg-purple-50 border-purple-300' : 'bg-card hover:bg-muted/50'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium">{form.studentName}</span>
                                        <Badge variant={form.status === 'APPROVED' ? 'default' : 'secondary'} className={`text-[10px] px-1 h-4 ${form.status === 'APPROVED' ? 'bg-green-600' : form.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {form.status === 'APPROVED' ? t('approved') : form.status === 'REJECTED' ? t('rejected') : t('returned')}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{getTypeName(form.type)}</div>
                                </button>
                            ))}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </Card>

            {/* Main Form Review Area */}
            <Card className="lg:col-span-2 shadow-sm flex flex-col overflow-hidden">
                {activeForm ? (
                    <>
                        <CardHeader className="border-b bg-muted/10 shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTypeIcon(activeForm.type)}
                                        <Badge variant="outline" className="text-purple-800 border-purple-200 bg-purple-50">{getTypeName(activeForm.type)}</Badge>
                                        <Badge variant="secondary" className="font-mono text-xs">{activeForm.id}</Badge>
                                    </div>
                                    <CardTitle className="text-2xl">{activeForm.studentName}</CardTitle>
                                    <CardDescription className="text-base mt-1">{activeForm.conservatorium}</CardDescription>
                                </div>
                                <div className="text-start text-sm text-muted-foreground">
                                    <div className="flex items-center justify-end gap-1 mb-1"><Clock className="w-3 h-3" /> {t('submittedDate')} {format(new Date(activeForm.submittedAt), 'dd/MM/yyyy', { locale: dateLocale })}</div>
                                    {activeForm.status !== 'SUBMITTED' && (
                                        <Badge className={`mt-2 ${activeForm.status === 'APPROVED' ? 'bg-green-600' : activeForm.status === 'REJECTED' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                                            {t('currentStatus')} {t(activeForm.status === 'APPROVED' ? 'approved' : activeForm.status === 'REJECTED' ? 'rejected' : 'returned')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <ScrollArea className="flex-1 p-6">
                            <div className="max-w-xl space-y-8">

                                <section>
                                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">{t('submissionDetails')}</h3>
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border border-dashed">
                                        {activeForm.details}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">{t('attachments')}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border rounded-lg p-3 flex  items-center gap-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                                            <div className="bg-red-100 text-red-600 p-2 rounded"><FileText className="w-5 h-5" /></div>
                                            <div>
                                                <div className="font-medium text-sm">המלצת מורה מלווה.pdf</div>
                                                <div className="text-xs text-muted-foreground">1.2 MB</div>
                                            </div>
                                        </div>
                                        {(activeForm.type === 'COMPOSITION_SUBMISSION' || activeForm.type === 'RECITAL') && (
                                            <div className="border rounded-lg p-3 flex items-center gap-3 bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                                                <div className="bg-blue-100 text-blue-600 p-2 rounded"><FileText className="w-5 h-5" /></div>
                                                <div>
                                                    <div className="font-medium text-sm">תווים_פרויקט_גמר.pdf</div>
                                                    <div className="text-xs text-muted-foreground">3.4 MB</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">{t('signatures')}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-lg">
                                            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> <span className="font-medium text-sm">{t('teacher')}</span></div>
                                            <span className="text-xs text-muted-foreground italic">{t('digitallySigned', { date: format(new Date(activeForm.submittedAt), 'dd/MM', { locale: dateLocale }) })}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-lg">
                                            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> <span className="font-medium text-sm">{t('manager')}</span></div>
                                            <span className="text-xs text-muted-foreground italic">{t('digitallySigned', { date: format(new Date(activeForm.submittedAt), 'dd/MM', { locale: dateLocale }) })}</span>
                                        </div>
                                    </div>
                                </section>

                            </div>
                        </ScrollArea>

                        {/* Actions Footer */}
                        {activeForm.status === 'SUBMITTED' && (
                            <CardFooter className="bg-muted/20 border-t p-4 flex flex-col items-stretch gap-4 shrink-0">
                                {!isRejectionBoxOpen ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setIsRejectionBoxOpen(true)}>
                                                <XCircle className="w-4 h-4 me-2" /> {t('cancelRejection')}
                                            </Button>
                                        </div>
                                        <Button className="bg-green-600 hover:bg-green-700 font-bold px-8" onClick={() => handleAction(activeForm.id, 'APPROVED')}>
                                            <CheckCircle className="w-4 h-4 me-2" /> {t('ministryApprove')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-full space-y-4 animate-in slide-in-from-bottom-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-red-900 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {t('rejectionReasonLabel')}</label>
                                            <Textarea
                                                placeholder={t('rejectionPlaceholder')}
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="border-red-200 focus-visible:ring-red-500"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setIsRejectionBoxOpen(false)}>{tCommon('cancel')}</Button>
                                            <Button variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-50" onClick={() => handleAction(activeForm.id, 'NEEDS_CHANGES')} disabled={!rejectionReason}>
                                                {t('submitReturn')}
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleAction(activeForm.id, 'REJECTED')} disabled={!rejectionReason}>
                                                {t('submitReject')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                        <FileSignature className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-medium text-foreground mb-2">{t('emptyStateTitle')}</h3>
                        <p className="max-w-md mx-auto">{t('emptyStateDesc')}</p>
                    </div>
                )}
            </Card>

        </div>
    );
}
