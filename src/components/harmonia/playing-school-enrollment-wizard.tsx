'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { School, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const STEPS = [
    { id: 1, label: 'פרטי בית הספר' },
    { id: 2, label: 'פרטי התלמיד/ה' },
    { id: 3, label: 'פרטי ההורה' },
    { id: 4, label: 'בחירת כלי + הסכמה' },
    { id: 5, label: 'תשלום' },
] as const;

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        current === step.id && 'bg-primary text-primary-foreground',
                        current > step.id && 'bg-green-500 text-white',
                        current < step.id && 'bg-muted text-muted-foreground',
                    )}>
                        {current > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                    </div>
                    {index < STEPS.length - 1 && (
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
    const [step, setStep] = useState<Step>(1);
    const [submitted, setSubmitted] = useState(false);

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

    const next = () => setStep(s => Math.min(s + 1, 5) as Step);
    const prev = () => setStep(s => Math.max(s - 1, 1) as Step);

    const handleSubmit = () => {
        // In real implementation: call createPlayingSchoolEnrollment cloud function
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                <Card className="max-w-md w-full text-center shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h2 className="text-2xl font-bold">ההרשמה הושלמה בהצלחה!</h2>
                        <p className="text-muted-foreground">אישור ישלח לאימייל {parentEmail} ולווטסאפ {parentPhone}.</p>
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-right">
                            <p className="font-medium mb-1">פרטי איסוף כלי נגינה:</p>
                            <p>יש לגשת לקונסרבטוריון עם שיק פיקדון בתוך 7 ימים לאיסוף הכלי.</p>
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
                <div className="text-center pt-8 pb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <School className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">בית ספר מנגן</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{MOCK_SCHOOL_INFO.schoolName} × {MOCK_SCHOOL_INFO.conservatoriumName}</p>
                </div>

                <StepIndicator current={step} />

                <Card className="shadow-lg">
                    {/* Step 1 — School Info */}
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle>פרטי התוכנית</CardTitle>
                                <CardDescription>מידע על שיעורי המוסיקה בבית ספרך</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">בית ספר:</span><span className="font-medium">{MOCK_SCHOOL_INFO.schoolName}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">כלי:</span><span className="font-medium">{MOCK_SCHOOL_INFO.instrument}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">כיתות:</span><span className="font-medium">{MOCK_SCHOOL_INFO.grades.join(', ')}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">יום שיעור:</span><span className="font-medium">{MOCK_SCHOOL_INFO.lessonDay} {MOCK_SCHOOL_INFO.lessonTime}</span></div>
                                </div>
                                <p className="text-sm text-muted-foreground">{MOCK_SCHOOL_INFO.programDescription}</p>

                                <div className="rounded-lg border p-4 space-y-2">
                                    <p className="font-medium text-sm">פירוט עלויות</p>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between"><span>מחיר בסיס:</span><span>₪{costBreakdown.basePrice}</span></div>
                                        <div className="flex justify-between text-green-600"><span>סובסידיית עירייה (60%):</span><span>-₪{costBreakdown.municipalSubsidy}</span></div>
                                        <div className="flex justify-between text-green-600"><span>סובסידיית משרד החינוך (10%):</span><span>-₪{costBreakdown.ministrySubsidy}</span></div>
                                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>תשלום הורה לשנה:</span><span>₪{costBreakdown.parentContribution}</span></div>
                                    </div>
                                </div>
                                <Button className="w-full" onClick={next}>המשך לפרטי התלמיד/ה <ChevronLeft className="ms-2 h-4 w-4" /></Button>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2 — Student Details */}
                    {step === 2 && (
                        <>
                            <CardHeader>
                                <CardTitle>פרטי התלמיד/ה</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>שם מלא</Label>
                                    <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="שם פרטי ושם משפחה" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>כיתה</Label>
                                        <Select value={studentGrade} onValueChange={setStudentGrade}>
                                            <SelectTrigger><SelectValue placeholder="בחר כיתה..." /></SelectTrigger>
                                            <SelectContent>
                                                {MOCK_SCHOOL_INFO.grades.map(g => (
                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>מחלקה</Label>
                                        <Input value={studentClass} onChange={e => setStudentClass(e.target.value)} placeholder="1ב" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>תאריך לידה</Label>
                                    <Input type="date" value={studentDob} onChange={e => setStudentDob(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={prev} className="flex-1"><ChevronRight className="me-2 h-4 w-4" />חזור</Button>
                                    <Button className="flex-1" onClick={next} disabled={!studentName || !studentGrade}>המשך <ChevronLeft className="ms-2 h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3 — Parent Details */}
                    {step === 3 && (
                        <>
                            <CardHeader>
                                <CardTitle>פרטי ההורה</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>שם מלא</Label>
                                    <Input value={parentName} onChange={e => setParentName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>טלפון נייד</Label>
                                    <Input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>אימייל</Label>
                                    <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>מספר תעודת זהות</Label>
                                    <Input value={parentId} onChange={e => setParentId(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={prev} className="flex-1"><ChevronRight className="me-2 h-4 w-4" />חזור</Button>
                                    <Button className="flex-1" onClick={next} disabled={!parentName || !parentPhone || !parentEmail}>המשך <ChevronLeft className="ms-2 h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 4 — Instrument + Consent */}
                    {step === 4 && (
                        <>
                            <CardHeader>
                                <CardTitle>בחירת כלי נגינה והסכמה</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>כלי נגינה</Label>
                                    <Select value={instrument} onValueChange={setInstrument}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="חליל">חליל</SelectItem>
                                            <SelectItem value="כינור">כינור</SelectItem>
                                            <SelectItem value="קלרינט">קלרינט</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="rounded-lg border p-4 text-sm text-muted-foreground space-y-2">
                                    <p className="font-medium text-foreground">תנאי ההרשמה</p>
                                    <p>הכלי ניתן לתלמיד/ה בהשאלה מהקונסרבטוריון לכל שנת הלימודים. יש להפקיד שיק בטחון בסך ₪1,500 באיסוף הכלי.</p>
                                    <p>בסיום שנת הלימודים יש להשיב את הכלי בתוך 7 ימים. שיק הבטחון יוחזר בחזרת הכלי במצב תקין.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Checkbox id="consent" checked={consent} onCheckedChange={v => setConsent(!!v)} />
                                    <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                                        אני מסכים/ה לתנאי ההרשמה ולעיבוד המידע האישי לצורכי ניהול התוכנית.
                                    </Label>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={prev} className="flex-1"><ChevronRight className="me-2 h-4 w-4" />חזור</Button>
                                    <Button className="flex-1" onClick={next} disabled={!consent}>המשך לתשלום <ChevronLeft className="ms-2 h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </>
                    )}

                    {/* Step 5 — Payment */}
                    {step === 5 && (
                        <>
                            <CardHeader>
                                <CardTitle>תשלום</CardTitle>
                                <CardDescription>סכום לתשלום: ₪{costBreakdown.parentContribution} לשנת הלימודים</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div
                                        className={cn('flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors', paymentMethod === 'SCHOOL_FEES' && 'border-primary bg-primary/5')}
                                        onClick={() => setPaymentMethod('SCHOOL_FEES')}
                                    >
                                        <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0', paymentMethod === 'SCHOOL_FEES' ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                                        <div>
                                            <p className="font-medium">תשלום דרך בית הספר</p>
                                            <p className="text-sm text-muted-foreground">התשלום יצורף לחשבון שכר הלימוד של בית הספר. יש לסמן לביה"ס שברצונך להצטרף לבית ספר מנגן.</p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn('flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors', paymentMethod === 'CARDCOM' && 'border-primary bg-primary/5')}
                                        onClick={() => setPaymentMethod('CARDCOM')}
                                    >
                                        <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0', paymentMethod === 'CARDCOM' ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                                        <div>
                                            <p className="font-medium">תשלום מקוון בכרטיס אשראי</p>
                                            <p className="text-sm text-muted-foreground">10 תשלומים של ₪{Math.round(costBreakdown.parentContribution / 10)} בחודש.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" onClick={prev} className="flex-1"><ChevronRight className="me-2 h-4 w-4" />חזור</Button>
                                    <Button className="flex-1" onClick={handleSubmit}>השלם רישום ✓</Button>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
