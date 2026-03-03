'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { resolvePlayingSchoolToken, createPlayingSchoolEnrollment } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/i18n/routing';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, School } from 'lucide-react';

// ── Mock school data (derived from token) ────────────────────────────────────

const MOCK_SCHOOL_INFO = {
    schoolName: 'בית ספר אורט רמת גן',
    conservatoriumName: 'קונסרבטוריון רמת גן',
    instrument: 'חליל',
    grades: ["ב'", "ג'"],
    lessonDay: 'רביעי',
    lessonTime: '10:00',
    programDescription: 'שיעורי קבוצה שבועיים לתלמידי כיתות ב׳–ג׳ במסגרת תוכנית "בית ספר מנגן".',
    costBreakdown: {
        basePrice: 1000,
        municipalSubsidy: 600,
        ministrySubsidy: 100,
        parentContribution: 300,
    },
};

// ── Step types ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

function StepIndicator({ current }: { current: Step }) {
    const t = useTranslations('PlayingSchool');
    const steps = [
        { id: 1, label: t('wizard.step1') },
        { id: 2, label: t('wizard.step2') },
        { id: 3, label: t('wizard.step3') },
        { id: 4, label: t('wizard.step4') },
        { id: 5, label: t('wizard.step5') },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        current === step.id && 'bg-primary text-primary-foreground',
                        current > step.id && 'bg-green-500 text-white',
                        current < step.id && 'bg-muted text-muted-foreground',
                    )}>
                        {current > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                    </div>
                    {index < steps.length - 1 && (
                        <div className={cn('h-0.5 w-8 mx-1', current > step.id ? 'bg-green-500' : 'bg-muted')} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
    token: string;
}

export function PlayingSchoolEnrollmentWizard({ token }: Props) {
    const t = useTranslations('PlayingSchool');
    const router = useRouter();
    const locale = (router as any).locale || 'he';
    const isRtl = locale === 'he' || locale === 'ar';

    // Direction-aware icons
    const NextIcon = isRtl ? ChevronLeft : ChevronRight;
    const PrevIcon = isRtl ? ChevronRight : ChevronLeft;

    const [step, setStep] = useState<Step>(1);
    const [submitted, setSubmitted] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchSchool() {
            try {
                const info = await resolvePlayingSchoolToken(token);
                setSchoolInfo(info);
            } catch (err) {
                toast({ variant: 'destructive', title: 'Invalid Token', description: 'The school registration link is invalid or expired.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSchool();
    }, [token]);

    // Form state
    const [studentName, setStudentName] = useState('');
    const [studentGrade, setStudentGrade] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentDob, setStudentDob] = useState('');
    const [parentName, setParentName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentId, setParentId] = useState('');
    const [instrument, setInstrument] = useState('חליל');
    const [consent, setConsent] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'SCHOOL_FEES' | 'CARDCOM'>('SCHOOL_FEES');

    const { costBreakdown } = MOCK_SCHOOL_INFO;

    const next = () => {
        console.log('Advancing from step', step);
        setStep(s => Math.min(s + 1, 5) as Step);
    };
    const prev = () => setStep(s => Math.max(s - 1, 1) as Step);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await createPlayingSchoolEnrollment({
                token,
                registrationType: 'playing_school',
                studentDetails: { name: studentName, grade: studentGrade, class: studentClass, dob: studentDob },
                parentDetails: { name: parentName, phone: parentPhone, email: parentEmail, id: parentId },
                schoolId: schoolInfo.id,
                instrument,
                paymentMethod
            });

            if (result.success && result.redirectUrl && paymentMethod === 'CARDCOM') {
                window.location.href = result.redirectUrl;
            } else {
                setSubmitted(true);
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Submission Error', description: 'There was an error processing your enrollment. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                <Card className="max-w-md w-full text-center shadow-xl p-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-muted-foreground">Loading school information...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (!schoolInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                <Card className="max-w-md w-full text-center shadow-xl p-8">
                    <p className="text-destructive font-medium">Error loading school profile. Please check your token and try again.</p>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4" dir="rtl">
                <Card className="max-w-md w-full text-center shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h2 className="text-2xl font-bold">{t('wizard.success')}</h2>
                        <p className="text-muted-foreground">{t('wizard.successDesc', { email: parentEmail, phone: parentPhone })}</p>
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-right">
                            <p className="font-medium mb-1">{t('wizard.pickupNote')}</p>
                            <p>{t('wizard.pickupNoteFull')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center pt-8 pb-4">
                    <Link
                        href="/playing-school"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-4 bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
                    >
                        {isRtl ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        {t('wizard.backToFinder') || 'Back to School Finder'}
                    </Link>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <School className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">{t('wizard.title')}</span>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">{schoolInfo.name} × {schoolInfo.conservatorium}</p>
                </div>

                <StepIndicator current={step} />

                <Card className="shadow-lg">
                    {/* Step 1 — School Info */}
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>{t('wizard.programInfo')}</CardTitle>
                                <CardDescription>{t('wizard.programInfoDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('wizard.school')}</span><span className="font-medium">{schoolInfo.name}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('wizard.instrument')}</span><span className="font-medium">{schoolInfo.instrument}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('wizard.grades')}</span><span className="font-medium">{schoolInfo.grades}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">{t('wizard.lessonDay')}</span><span className="font-medium">{schoolInfo.lessonDay}</span></div>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('wizard.programInfoDesc')}</p>

                                <div className="rounded-lg border p-4 space-y-2">
                                    <p className="font-medium text-sm">{t('wizard.costBreakdown')}</p>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between"><span>{t('wizard.basePrice')}</span><span>₪{schoolInfo.basePrice}</span></div>
                                        <div className="flex justify-between text-green-600"><span>{t('wizard.municipalSubsidy', { percent: 0 })}</span><span>-₪{schoolInfo.subsidies.municipal}</span></div>
                                        <div className="flex justify-between text-green-600"><span>{t('wizard.ministrySubsidy', { percent: 0 })}</span><span>-₪{schoolInfo.subsidies.ministry}</span></div>
                                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>{t('wizard.parentContribution')}</span><span>₪{schoolInfo.parentContribution}</span></div>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={next}>{t('wizard.nextStudent')} <NextIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} /></Button>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2 — Student Details */}
                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>{t('wizard.step2')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('wizard.studentName')}</Label>
                                    <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder={t('wizard.studentNamePlaceholder')} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('wizard.grade')}</Label>
                                        <Select value={studentGrade} onValueChange={setStudentGrade}>
                                            <SelectTrigger><SelectValue placeholder={t('wizard.gradePlaceholder')} /></SelectTrigger>
                                            <SelectContent>
                                                {schoolInfo.grades.split(' - ').map((g: string) => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('wizard.class')}</Label>
                                        <Input value={studentClass} onChange={e => setStudentClass(e.target.value)} placeholder={t('wizard.classPlaceholder')} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('wizard.dob')}</Label>
                                    <Input type="date" value={studentDob} onChange={e => setStudentDob(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={prev} className="flex-1"><PrevIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} />{t('wizard.prev')}</Button>
                                    <Button type="button" className="flex-1" onClick={next} disabled={!studentName || !studentGrade}>{t('wizard.next')} <NextIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3 — Parent Details */}
                    {step === 3 && (
                        <>
                            <CardHeader>
                                <CardTitle>{t('wizard.step3')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('wizard.parentName')}</Label>
                                    <Input value={parentName} onChange={e => setParentName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('wizard.parentPhone')}</Label>
                                    <Input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('wizard.parentEmail')}</Label>
                                    <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('wizard.parentId')}</Label>
                                    <Input value={parentId} onChange={e => setParentId(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={prev} className="flex-1"><PrevIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} />{t('wizard.prev')}</Button>
                                    <Button type="button" className="flex-1" onClick={next} disabled={!parentName || !parentPhone || !parentEmail}>{t('wizard.next')} <NextIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 4 — Instrument + Consent */}
                    {step === 4 && (
                        <>
                            <CardHeader>
                                <CardTitle>{t('wizard.step4')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('wizard.instrument')}</Label>
                                    <Select value={instrument} onValueChange={setInstrument}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="חליל">{t('wizard.instrument')}</SelectItem> {/* In real app would use instrument list */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                                    <p className="font-medium text-foreground">{t('wizard.termsTitle')}</p>
                                    <p>{t('wizard.termsNote1')}</p>
                                    <p>{t('wizard.termsNote2')}</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Checkbox id="consent" checked={consent} onCheckedChange={v => setConsent(!!v)} />
                                    <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                                        {t('wizard.consentLabel')}
                                    </Label>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={prev} className="flex-1"><PrevIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} />{t('wizard.prev')}</Button>
                                    <Button type="button" className="flex-1" onClick={next} disabled={!consent}>{t('wizard.next')} <NextIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 5 — Payment */}
                    {step === 5 && (
                        <>
                            <CardHeader>
                                <CardTitle>{t('wizard.paymentTitle')}</CardTitle>
                                <CardDescription>{t('wizard.paymentAmt', { amount: schoolInfo.parentContribution })}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div
                                        className={cn('flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors', paymentMethod === 'SCHOOL_FEES' && 'border-primary bg-primary/5')}
                                        onClick={() => setPaymentMethod('SCHOOL_FEES')}
                                    >
                                        <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0', paymentMethod === 'SCHOOL_FEES' ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                                        <div>
                                            <p className="font-medium">{t('wizard.payViaSchool')}</p>
                                            <p className="text-sm text-muted-foreground">{t('wizard.payViaSchoolDesc')}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn('flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors', paymentMethod === 'CARDCOM' && 'border-primary bg-primary/5')}
                                        onClick={() => setPaymentMethod('CARDCOM')}
                                    >
                                        <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0', paymentMethod === 'CARDCOM' ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                                        <div>
                                            <p className="font-medium">{t('wizard.payOnline')}</p>
                                            <p className="text-sm text-muted-foreground">{t('wizard.payOnlineDesc', { amount: Math.round(schoolInfo.parentContribution / 10) })}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={prev} className="flex-1"><PrevIcon className={cn(isRtl ? "me-2" : "ms-2", "h-4 w-4")} />{t('wizard.prev')}</Button>
                                    <Button type="button" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('wizard.complete')}
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
