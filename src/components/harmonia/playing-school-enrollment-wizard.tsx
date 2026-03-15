'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { resolvePlayingSchoolToken, createPlayingSchoolEnrollment } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, School, ShieldCheck } from 'lucide-react';
import { SignatureCapture } from '@/components/forms/signature-capture';
import { RegistrationAgreement } from '@/components/enrollment/registration-agreement';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type PaymentMethod = 'SCHOOL_FEES' | 'CARDCOM' | 'PELECARD' | 'HYP' | 'TRANZILA' | 'STRIPE';
type AppLocale = 'he' | 'en' | 'ar' | 'ru';

const TERMS_VERSION = '2026.03';
const TERMS_UPDATED_ISO = '2026-03-01';
const PHONE_REGEX = /^\+?[0-9()\-\s]{9,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  token: string;
}

type SchoolInfo = {
  id: string;
  name: string;
  conservatorium: string;
  symbol: string;
  city: string;
  instrument: string;
  grades: string;
  gradeOptions?: string[];
  lessonDay: string;
  basePrice: number;
  monthlyPrice: number;
  subsidies: {
    municipal: number;
    ministry: number;
  };
  parentContribution: number;
};

function StepIndicator({ current }: { current: Step }) {
  const t = useTranslations('PlayingSchool');
  const steps = [
    { id: 1, label: t('wizard.step1') },
    { id: 2, label: t('wizard.step2') },
    { id: 3, label: t('wizard.step3') },
    { id: 4, label: t('wizard.step4') },
    { id: 5, label: t('wizard.step5') },
    { id: 6, label: t('wizard.step6') },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              current === step.id && 'bg-primary text-primary-foreground',
              current > step.id && 'bg-green-600 text-white',
              current < step.id && 'bg-muted text-muted-foreground'
            )}
            aria-label={step.label}
            title={step.label}
          >
            {current > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
          </div>
          {index < steps.length - 1 && (
            <div className={cn('mx-1 h-0.5 w-7', current > step.id ? 'bg-green-600' : 'bg-muted')} />
          )}
        </div>
      ))}
    </div>
  );
}

export function PlayingSchoolEnrollmentWizard({ token }: Props) {
  const t = useTranslations('PlayingSchool');
  const locale = useLocale();
  const appLocale: AppLocale = locale === 'he' || locale === 'en' || locale === 'ar' || locale === 'ru' ? locale : 'he';
  const isRtl = locale === 'he' || locale === 'ar';
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;

  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentId, setParentId] = useState('');
  const [instrument, setInstrument] = useState('');
  const [consent, setConsent] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('SCHOOL_FEES');

  useEffect(() => {
    let active = true;

    async function fetchSchool() {
      try {
        const info = await resolvePlayingSchoolToken({ token, locale: appLocale });
        if (!active) return;
        setSchoolInfo(info as SchoolInfo);
        setInstrument((info as SchoolInfo).instrument || '');
      } catch {
        toast({
          variant: 'destructive',
          title: t('wizard.invalidTokenTitle'),
          description: t('wizard.invalidTokenDesc'),
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchSchool();
    return () => {
      active = false;
    };
  }, [appLocale, t, token]);

  const termsUpdatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-SA' : locale === 'ru' ? 'ru-RU' : 'en-US',
        { day: '2-digit', month: '2-digit', year: 'numeric' }
      ).format(new Date(TERMS_UPDATED_ISO)),
    [locale]
  );

  const configuredMethods = useMemo<PaymentMethod[]>(() => {
    const fromEnv = (process.env.NEXT_PUBLIC_PAYMENT_METHODS || '')
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);

    const allowed: PaymentMethod[] = ['SCHOOL_FEES', 'CARDCOM', 'PELECARD', 'HYP', 'TRANZILA', 'STRIPE'];
    const isPaymentMethod = (value: string): value is PaymentMethod =>
      (allowed as readonly string[]).includes(value);

    const envMethods = fromEnv.filter(isPaymentMethod);
    const methods = envMethods.length > 0 ? envMethods : allowed;
    const unique: PaymentMethod[] = [];
    for (const method of methods) {
      if (!unique.includes(method)) unique.push(method);
    }
    return unique;
  }, []);

  const gradeOptions = useMemo(() => {
    if (!schoolInfo) return [];
    if (Array.isArray(schoolInfo.gradeOptions) && schoolInfo.gradeOptions.length > 0) {
      return schoolInfo.gradeOptions;
    }
    return schoolInfo.grades.split('-').map((g) => g.trim()).filter(Boolean);
  }, [schoolInfo]);

  const isValidPhone = PHONE_REGEX.test(parentPhone.trim());
  const isValidEmail = EMAIL_REGEX.test(parentEmail.trim());
  const municipalPercent = schoolInfo?.basePrice ? Math.round((schoolInfo.subsidies.municipal / schoolInfo.basePrice) * 100) : 0;
  const ministryPercent = schoolInfo?.basePrice ? Math.round((schoolInfo.subsidies.ministry / schoolInfo.basePrice) * 100) : 0;

  const canContinueStudent = studentName.trim().length >= 2 && Boolean(studentGrade) && Boolean(studentDob);
  const canContinueParent = parentName.trim().length >= 2 && isValidPhone && isValidEmail;

  const paymentCatalog: ReadonlyArray<{ value: PaymentMethod; title: string; description: string }> = [
    { value: 'SCHOOL_FEES', title: t('wizard.payViaSchool'), description: t('wizard.payViaSchoolDesc') },
    { value: 'CARDCOM', title: t('wizard.payViaCardcom'), description: t('wizard.payViaCardcomDesc') },
    { value: 'PELECARD', title: t('wizard.payViaPelecard'), description: t('wizard.payViaPelecardDesc') },
    { value: 'HYP', title: t('wizard.payViaHyp'), description: t('wizard.payViaHypDesc') },
    { value: 'TRANZILA', title: t('wizard.payViaTranzila'), description: t('wizard.payViaTranzilaDesc') },
    { value: 'STRIPE', title: t('wizard.payViaStripe'), description: t('wizard.payViaStripeDesc') },
  ];
  const paymentItems = paymentCatalog.filter((item) => configuredMethods.includes(item.value));

  const next = () => {
    if (step === 5 && !contractSigned) return;
    setStep((s) => (s < 6 ? ((s + 1) as Step) : s));
  };
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleSubmit = async () => {
    if (!schoolInfo) return;
    setIsSubmitting(true);

    try {
      const result = await createPlayingSchoolEnrollment({
        token,
        registrationType: 'playing_school',
        studentDetails: {
          firstName: studentName.split(' ')[0] || studentName,
          lastName: studentName.split(' ').slice(1).join(' ') || studentName,
          grade: studentGrade,
          schoolName: studentClass,
          dateOfBirth: studentDob,
        },
        parentDetails: {
          firstName: parentName.split(' ')[0] || parentName,
          lastName: parentName.split(' ').slice(1).join(' ') || parentName,
          phone: parentPhone,
          email: parentEmail,
          idNumber: parentId,
        },
        schoolId: schoolInfo.id,
        instrument,
        paymentMethod,
      });

      if (result.success && result.redirectUrl && paymentMethod !== 'SCHOOL_FEES') {
        window.location.href = result.redirectUrl;
        return;
      }
      setSubmitted(true);
    } catch {
      toast({
        variant: 'destructive',
        title: t('wizard.submissionErrorTitle'),
        description: t('wizard.submissionErrorDesc'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md p-8 text-center shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('wizard.loadingSchoolInfo')}</p>
        </div>
      </Card>
    );
  }

  if (!schoolInfo) {
    return (
      <Card className="w-full max-w-md p-8 text-center shadow-lg">
        <p className="font-medium text-destructive">{t('wizard.loadProfileError')}</p>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl shadow-xl" dir={isRtl ? 'rtl' : 'ltr'}>
          <CardContent className="space-y-4 py-10 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold">{t('wizard.success')}</h2>
            <p className="text-muted-foreground">{t('wizard.successDesc', { email: parentEmail, phone: parentPhone })}</p>
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-start">
              <p className="font-medium">{t('wizard.pickupNote')}</p>
              <p>{t('wizard.pickupNoteFull')}</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center pb-2 pt-8 text-center">
          <Link
            href="/playing-school"
            className="mb-4 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:underline"
          >
            {isRtl ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            {t('wizard.backToFinder')}
          </Link>
          <div className="mb-1 flex items-center justify-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{t('wizard.title')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {schoolInfo.name} - {schoolInfo.conservatorium}
          </p>
        </div>

        <StepIndicator current={step} />

        <Card className="mx-auto w-full max-w-4xl shadow-lg">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.programInfo')}</CardTitle>
                <CardDescription>{t('wizard.programInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('wizard.school')}</span>
                    <span className="font-medium">{schoolInfo.name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('wizard.instrument')}</span>
                    <span className="font-medium">{schoolInfo.instrument}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('wizard.grades')}</span>
                    <span className="font-medium">{schoolInfo.grades}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('wizard.lessonDay')}</span>
                    <span className="font-medium">{schoolInfo.lessonDay}</span>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">{t('wizard.costBreakdown')}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('wizard.basePrice')}</span>
                      <span>₪{schoolInfo.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>{t('wizard.municipalSubsidy', { percent: municipalPercent })}</span>
                      <span>-₪{schoolInfo.subsidies.municipal}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>{t('wizard.ministrySubsidy', { percent: ministryPercent })}</span>
                      <span>-₪{schoolInfo.subsidies.ministry}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                      <span>{t('wizard.parentContribution')}</span>
                      <span>₪{schoolInfo.parentContribution}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={next}>
                  {t('wizard.nextStudent')}
                  <NextIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.step2')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('wizard.studentName')}</Label>
                  <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder={t('wizard.studentNamePlaceholder')} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('wizard.grade')}</Label>
                    <Select value={studentGrade} onValueChange={setStudentGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wizard.gradePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeOptions.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('wizard.class')}</Label>
                    <Input value={studentClass} onChange={(e) => setStudentClass(e.target.value)} placeholder={t('wizard.classPlaceholder')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('wizard.dob')}</Label>
                  <Input type="date" value={studentDob} onChange={(e) => setStudentDob(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={prev} className="flex-1">
                    <PrevIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                    {t('wizard.prev')}
                  </Button>
                  <Button type="button" className="flex-1" onClick={next} disabled={!canContinueStudent}>
                    {t('wizard.next')}
                    <NextIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.step3')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('wizard.parentName')}</Label>
                  <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('wizard.parentPhone')}</Label>
                  <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} dir="ltr" className="text-start" />
                  {parentPhone.length > 0 && !isValidPhone && <p className="text-xs text-destructive">{t('wizard.validation.invalidPhone')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('wizard.parentEmail')}</Label>
                  <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} dir="ltr" className="text-start" />
                  {parentEmail.length > 0 && !isValidEmail && <p className="text-xs text-destructive">{t('wizard.validation.invalidEmail')}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('wizard.parentId')}</Label>
                  <Input value={parentId} onChange={(e) => setParentId(e.target.value)} dir="ltr" className="text-start" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={prev} className="flex-1">
                    <PrevIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                    {t('wizard.prev')}
                  </Button>
                  <Button type="button" className="flex-1" onClick={next} disabled={!canContinueParent}>
                    {t('wizard.next')}
                    <NextIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.step4')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('wizard.instrument')}</Label>
                  <Select value={instrument} onValueChange={setInstrument}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={schoolInfo.instrument}>{schoolInfo.instrument}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 rounded-lg border p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('wizard.termsTitle')}</p>
                  <p className="text-xs">{t('wizard.termsVersion', { version: TERMS_VERSION })}</p>
                  <p className="text-xs">{t('wizard.termsUpdatedAt', { date: termsUpdatedAt })}</p>
                  <p>{t('wizard.termsNote1')}</p>
                  <p>{t('wizard.termsNote2')}</p>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
                  <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed">
                    {t('wizard.consentLabel')}
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={prev} className="flex-1">
                    <PrevIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                    {t('wizard.prev')}
                  </Button>
                  <Button type="button" className="flex-1" onClick={next} disabled={!consent}>
                    {t('wizard.next')}
                    <NextIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.step5')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RegistrationAgreement customAddendum={undefined} />
                {!contractSigned && (
                  <SignatureCapture onConfirm={() => setContractSigned(true)} />
                )}
                {contractSigned && (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {t('wizard.consentLabel')}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={prev} className="flex-1">
                    <PrevIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                    {t('wizard.prev')}
                  </Button>
                  <Button type="button" className="flex-1" onClick={next} disabled={!contractSigned}>
                    {t('wizard.next')}
                    <NextIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 6 && (
            <>
              <CardHeader>
                <CardTitle>{t('wizard.paymentTitle')}</CardTitle>
                <CardDescription>{t('wizard.paymentAmt', { amount: schoolInfo.parentContribution })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {paymentItems.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={cn(
                        'w-full rounded-lg border p-4 text-start transition-colors',
                        paymentMethod === item.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                      )}
                      onClick={() => setPaymentMethod(item.value)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2',
                            paymentMethod === item.value ? 'border-primary bg-primary' : 'border-muted-foreground'
                          )}
                          aria-hidden
                        />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">{t('wizard.paymentProviderNote')}</p>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={prev} className="flex-1">
                    <PrevIcon className={cn(isRtl ? 'me-2' : 'ms-2', 'h-4 w-4')} />
                    {t('wizard.prev')}
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('wizard.complete')}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
    </div>
  );
}
