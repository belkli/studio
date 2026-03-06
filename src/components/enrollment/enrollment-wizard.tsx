'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getTeacherMatches } from "@/app/actions";
import type { MatchTeacherOutput } from "@/ai/flows/match-teacher-flow";
import { cn } from "@/lib/utils";
import { add, set, format, getDay, isBefore } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowLeft, ArrowRight, User as UserIcon, Contact, Music, Calendar, HeartHandshake, Package as PackageIcon, ShieldCheck, Loader2, CalendarClock, UserPlus, Sparkles } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { Stepper } from "@/components/ui/stepper";
import { isValidIsraeliID } from "@/lib/utils";
import { instruments, schools } from "@/lib/taxonomies";
import type { StudentGoal, DayOfWeek, TimeRange, User, Package, LessonSlot, LessonPackage, ConservatoriumInstrument } from "@/lib/types";
import { collectInstrumentTokensFromConservatoriumInstrument, normalizeInstrumentToken, userHasInstrument } from '@/lib/instrument-matching';
import { Checkbox } from "../ui/checkbox";
import { TeacherMatchCard } from "./teacher-match-card";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import type { OAuthProfile } from '@/lib/auth/oauth';


const getParentSchema = (t: any) => z.object({
  parentFirstName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  parentLastName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  parentEmail: z.string().email(t('validation.invalidEmail')),
  parentIdNumber: z.string().min(1, t('validation.idRequired')).refine(isValidIsraeliID, t('validation.invalidID')),
  parentPhone: z.string().min(9, t('validation.invalidPhone')),
});

const getStudentSchema = (t: any) => z.object({
  childFirstName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  childLastName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  childBirthDate: z.string().min(1, t('validation.date')),
  childSchoolName: z.string().optional(),
  childGrade: z.string().optional(),
});

const getSelfSchema = (t: any) => z.object({
  firstName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  lastName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  email: z.string().email(t('validation.invalidEmail')),
  idNumber: z.string().min(1, t('validation.idRequired')).refine(isValidIsraeliID, t('validation.invalidID')),
  birthDate: z.string().min(1, t('validation.date')),
  phone: z.string().min(9, t('validation.invalidPhone')),
  schoolName: z.string().optional(),
  grade: z.string().optional(),
});

const getFormSchema = (t: any) => z.object({
  registrationType: z.enum(["parent", "self", "playing_school"], { message: t('validation.selectType') }),
  parentDetails: getParentSchema(t).optional(),
  studentDetails: getStudentSchema(t).optional(),
  selfDetails: getSelfSchema(t).optional(),
  password: z.string().min(8, t('validation.passwordLength', { min: 8 })),
  conservatorium: z.string({ message: t('validation.selectConservatorium') }).min(1, t('validation.selectConservatorium')),

  instrument: z.string().min(1, t('validation.selectInstrument')),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Exam Candidate']),
  previousExperience: z.string().optional(),
  goals: z.array(z.string()).optional(),
  lessonDuration: z.coerce.number().optional(),

  availableDays: z.array(z.string()).optional(),
  availableTimes: z.array(z.string()).optional(),
  isVirtualOk: z.enum(['yes', 'no', 'only']).optional(),

  teacherId: z.string().optional(),

  packageId: z.string().min(1, t('validation.selectPackage')),

  firstLessonDate: z.date().optional(),
  firstLessonTime: z.string().optional(),

}).superRefine((data, ctx) => {
  if (data.registrationType === 'parent') {
    if (!data.parentDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentDetails'], message: t('validation.required') });
    if (!data.studentDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['studentDetails'], message: t('validation.required') });
  }
  if (data.registrationType === 'self') {
    if (!data.selfDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['selfDetails'], message: t('validation.required') });
  }
});

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

// These will be localized inside the component
const getGoalOptions = (t: any) => [
  { id: 'EXAMS', label: t('musical.goals_options.EXAMS') },
  { id: 'PERFORMANCE', label: t('musical.goals_options.PERFORMANCE') },
  { id: 'ENJOYMENT', label: t('musical.goals_options.ENJOYMENT') },
  { id: 'COMPETITION', label: t('musical.goals_options.COMPETITION') },
  { id: 'OTHER', label: t('musical.goals_options.OTHER') },
];

const getDayOptions = (t: any) => [
  { id: 'SUN', label: t('schedule.days_options.SUN') },
  { id: 'MON', label: t('schedule.days_options.MON') },
  { id: 'TUE', label: t('schedule.days_options.TUE') },
  { id: 'WED', label: t('schedule.days_options.WED') },
  { id: 'THU', label: t('schedule.days_options.THU') },
  { id: 'FRI', label: t('schedule.days_options.FRI') }
];

const getTimeOptions = (t: any) => [
  { id: 'MORNING', label: t('schedule.times_options.MORNING') },
  { id: 'AFTERNOON', label: t('schedule.times_options.AFTERNOON') },
  { id: 'EVENING', label: t('schedule.times_options.EVENING') }
];

const packageSupportsSelectedInstrument = (
  pkg: LessonPackage,
  selectedInstrumentLabel: string | undefined,
  availableConservatoriumInstruments: ConservatoriumInstrument[],
) => {
  if (!selectedInstrumentLabel) return true;

  const normalizedLabel = selectedInstrumentLabel.trim().toLowerCase();
  const matchingInstrumentRows = availableConservatoriumInstruments.filter((item) =>
    [item.names.he, item.names.en, item.names.ar, item.names.ru]
      .filter(Boolean)
      .some((name) => String(name).trim().toLowerCase() === normalizedLabel)
  );

  if (matchingInstrumentRows.length > 0) {
    const rowIds = new Set(matchingInstrumentRows.map((item) => item.id));
    const catalogIds = new Set(matchingInstrumentRows.map((item) => item.instrumentCatalogId).filter(Boolean) as string[]);

    if ((pkg.conservatoriumInstrumentIds || []).some((id) => rowIds.has(id))) return true;
    if ((pkg.instrumentCatalogIds || []).some((id) => catalogIds.has(id))) return true;
  }

  return (pkg.instruments || []).some((name) => String(name).trim().toLowerCase() === normalizedLabel);
};

const ENROLLMENT_DRAFT_STORAGE_PREFIX = 'enrollment-wizard-draft:v1';

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-1">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-start">{value || '-'}</span>
  </div>
);

const BookFirstLessonStep = () => {
  const t = useTranslations('EnrollmentWizard');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const dateLocale = useDateLocale();
  const form = useFormContext<FormData>();
  const { users, lessons } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const teacherId = form.watch('teacherId');
  const selectedDate = form.watch('firstLessonDate');
  const duration = form.watch('lessonDuration') || 45;

  useEffect(() => {
    if (!teacherId || !selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    // Simulate fetching slots
    setTimeout(() => {
      const teacher = users.find(u => u.id === teacherId);
      if (!teacher?.availability) {
        setAvailableSlots([]);
        setIsLoadingSlots(false);
        return;
      }

      const dayIndex = getDay(selectedDate);
      const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIndex];
      const teacherDayAvailability = teacher.availability.find(a => a.dayOfWeek === dayOfWeek);

      if (!teacherDayAvailability) {
        setAvailableSlots([]);
        setIsLoadingSlots(false);
        return;
      }

      const dayLessons = lessons.filter(l =>
        l.teacherId === teacherId &&
        format(new Date(l.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );

      const slots: string[] = [];
      let currentTime = set(new Date(), { hours: parseInt(teacherDayAvailability.startTime.split(':')[0]), minutes: 0 });
      const endTime = set(new Date(), { hours: parseInt(teacherDayAvailability.endTime.split(':')[0]), minutes: 0 });

      while (isBefore(currentTime, endTime)) {
        const slotTimeStr = format(currentTime, 'HH:mm');
        const isBooked = dayLessons.some(l => format(new Date(l.startTime), 'HH:mm') === slotTimeStr);

        if (!isBooked) {
          const potentialSlotTime = set(selectedDate, { hours: parseInt(slotTimeStr.split(':')[0]), minutes: parseInt(slotTimeStr.split(':')[1]) });
          if (isBefore(new Date(), potentialSlotTime)) {
            slots.push(slotTimeStr);
          }
        }
        currentTime = add(currentTime, { minutes: duration });
      }

      setAvailableSlots(slots);
      setIsLoadingSlots(false);
    }, 300);

  }, [teacherId, selectedDate, duration, users, lessons]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <FormField name="firstLessonDate" control={form.control} render={({ field }) => (
        <FormItem className="flex justify-center">
          <FormControl>
            <UICalendar
              mode="single"
              selected={field.value}
              onSelect={(date) => {
                field.onChange(date);
                form.setValue('firstLessonTime', undefined); // Reset time when date changes
              }}
              disabled={(date) => isBefore(date, new Date())}
              initialFocus
              locale={dateLocale}
              className="rounded-md border"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField name="firstLessonTime" control={form.control} render={({ field }) => (
        <FormItem>
          <FormLabel>{t('booking.availableSlots')}</FormLabel>
          <FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-1 border rounded-md">
              {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
              {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">{t('booking.noSlots')}</p>}
              {!isLoadingSlots && availableSlots.map(slot => (
                <FormItem key={slot}>
                  <FormControl>
                    <label className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
                      <RadioGroupItem value={slot} id={`time-${slot}`} className="hidden" />
                      <span className="font-mono">{slot}</span>
                    </label>
                  </FormControl>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  )
}

const AdminEnrollmentForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  const t = useTranslations('EnrollmentWizard');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const form = useFormContext<FormData>();
  const { toast } = useToast();
  const registrationType = form.watch('registrationType');
  const { user, users, conservatoriums: authConservatoriums, conservatoriumInstruments, lessonPackages } = useAuth();
  const isSiteAdmin = user?.role === 'site_admin';
  const selectedConservatoriumId = form.watch('conservatorium');
  const selectedInstrument = form.watch('instrument');
  const selectedDuration = form.watch('lessonDuration') || 45;
  const selectedTeacherId = form.watch('teacherId');
  const dayOptions = getDayOptions(t);
  const timeOptions = getTimeOptions(t);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTeacher, setSuggestedTeacher] = useState<{ id: string; score: number; reasons: string[] } | null>(null);

  useEffect(() => {
    if (!isSiteAdmin && user?.conservatoriumId) {
      form.setValue('conservatorium', user.conservatoriumId, { shouldValidate: true });
    }
  }, [form, isSiteAdmin, user?.conservatoriumId]);

  const adminConservatoriumOptions = authConservatoriums.map((item) => ({ value: item.id, label: item.name }));
  const instrumentLabel = (item: { names: { he: string; en: string; ar?: string; ru?: string } }) => {
    if (locale === 'he') return item.names.he;
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    return item.names.en;
  };

  const availableInstruments = conservatoriumInstruments
    .filter((item) => item.isActive && item.availableForRegistration && item.conservatoriumId === selectedConservatoriumId)
    .map((item) => ({ value: item.names.he, label: instrumentLabel(item) }));

  const availablePackages = lessonPackages.filter((item) => {
    if (!item.isActive) return false;
    if (item.conservatoriumId !== selectedConservatoriumId) return false;
    if (item.durationMinutes !== selectedDuration) return false;
    return packageSupportsSelectedInstrument(item, selectedInstrument, conservatoriumInstruments);
  });

  const availableTeachers = users.filter((item) => {
    if (item.role !== 'teacher' || !item.approved) return false;
    if (selectedConservatoriumId && item.conservatoriumId !== selectedConservatoriumId) return false;
    if (!selectedInstrument) return true;
    return userHasInstrument((item.instruments || []).map((instrument) => instrument.instrument), selectedInstrument, conservatoriumInstruments, item.conservatoriumId);
  });

  const runTeacherSuggestion = async () => {
    if (!selectedInstrument || !selectedConservatoriumId) {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.selectInstrumentFirst') });
      return;
    }

    const fallbackBirthDate = registrationType === 'self' ? '2005-01-01' : '2012-01-01';
    const birthDate = registrationType === 'self'
      ? (form.getValues('selfDetails.birthDate') || fallbackBirthDate)
      : (form.getValues('studentDetails.childBirthDate') || fallbackBirthDate);

    const teacherProfiles = availableTeachers.map((item) => ({
      id: item.id,
      name: item.name,
      bio: item.bio || '',
      specialties: (item.specialties || []).map((specialty) => String(specialty)),
      teachingLanguages: item.teachingLanguages || [],
    }));

    if (teacherProfiles.length === 0) {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.noTeachersForFilters') });
      return;
    }

    setIsSuggesting(true);
    setSuggestedTeacher(null);
    try {
      const result = await getTeacherMatches({
        studentProfile: {
          instrument: selectedInstrument,
          level: form.getValues('level'),
          goals: form.getValues('goals'),
          preferredDays: form.getValues('availableDays'),
          preferredTimes: form.getValues('availableTimes'),
          isVirtualOk: form.getValues('isVirtualOk'),
          birthDate,
        },
        availableTeachers: teacherProfiles,
        locale,
      });
      const topMatch = result.matches[0];
      if (!topMatch) {
        toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.noAiSuggestion') });
        return;
      }
      setSuggestedTeacher({ id: topMatch.teacherId, score: topMatch.score, reasons: topMatch.matchReasons });
    } catch {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.aiError') });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.enrollSection')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField name="registrationType" control={form.control} render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('role.title')}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
                    <FormItem className="flex items-center justify-start gap-2 rounded-md border bg-background/50 p-4 transition-colors hover:bg-accent">
                      <FormControl><RadioGroupItem value="parent" /></FormControl>
                      <FormLabel className="flex-1 cursor-pointer font-normal text-start">{t('role.parent')}</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center justify-start gap-2 rounded-md border bg-background/50 p-4 transition-colors hover:bg-accent">
                      <FormControl><RadioGroupItem value="self" /></FormControl>
                      <FormLabel className="flex-1 cursor-pointer font-normal text-start">{t('role.self')}</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="conservatorium" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('role.conservatorium')}</FormLabel>
                {isSiteAdmin ? (
                  <Combobox options={adminConservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder={t('role.conservatoriumPlaceholder')} />
                ) : (
                  <div className="rounded-md bg-muted p-3 text-start text-sm">{user?.conservatoriumName}</div>
                )}
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {registrationType === 'parent' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('details.parentTitle')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="parentDetails.parentFirstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentLastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentEmail" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentIdNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentPhone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('details.studentTitle')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="studentDetails.childFirstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="studentDetails.childLastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="studentDetails.childBirthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              </CardContent>
            </Card>
          </div>
        )}
        {registrationType === 'self' && (
          <Card>
            <CardHeader><CardTitle>{t('details.selfTitle')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField name="selfDetails.firstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.lastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.email" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.idNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.birthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.phone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>{t('musical.title')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField name="instrument" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('musical.instrument')}</FormLabel>
                <Combobox options={availableInstruments} selectedValue={field.value} onSelectedValueChange={field.onChange} placeholder={t('musical.instrumentPlaceholder')} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="level" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('musical.level')}</FormLabel>
                <Combobox
                  options={[
                    { value: 'Beginner', label: t('musical.levels.Beginner') },
                    { value: 'Intermediate', label: t('musical.levels.Intermediate') },
                    { value: 'Advanced', label: t('musical.levels.Advanced') },
                    { value: 'Exam Candidate', label: t('musical.levels.Exam') },
                  ]}
                  selectedValue={field.value}
                  onSelectedValueChange={field.onChange}
                  placeholder={t('musical.levelPlaceholder')}
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="lessonDuration" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('musical.duration')}</FormLabel>
                <Combobox
                  options={[
                    { value: '30', label: t('musical.minutes', { min: 30 }) },
                    { value: '45', label: t('musical.minutes', { min: 45 }) },
                    { value: '60', label: t('musical.minutes', { min: 60 }) },
                  ]}
                  selectedValue={String(field.value)}
                  onSelectedValueChange={(v) => field.onChange(Number(v))}
                  placeholder={t('musical.durationPlaceholder')}
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="packageId" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>{t('summary.package')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={t('package.placeholder')} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availablePackages.map((p) => <SelectItem key={p.id} value={p.id}>{p.names.he} - {p.priceILS} ILS</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="md:col-span-2"><FormField name="password" render={({ field }) => (<FormItem> <FormLabel>{t('details.password')}</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('admin.teacherAssignmentTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('admin.manualAssign')}</p>
              <FormField name="teacherId" control={form.control} render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t('admin.selectTeacher')} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">{t('admin.aiSuggest')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.aiSuggestHint')}</p>
              <FormField name="availableDays" render={() => (
                <FormItem>
                  <FormLabel>{t('schedule.days')}</FormLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {dayOptions.map((day) => (
                      <FormField
                        key={day.id}
                        name="availableDays"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-md border p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), day.id]);
                                  } else {
                                    field.onChange((field.value || []).filter((value: string) => value !== day.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{day.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )} />

              <FormField name="availableTimes" render={() => (
                <FormItem>
                  <FormLabel>{t('schedule.times')}</FormLabel>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {timeOptions.map((time) => (
                      <FormField
                        key={time.id}
                        name="availableTimes"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 rounded-md border p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(time.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), time.id]);
                                  } else {
                                    field.onChange((field.value || []).filter((value: string) => value !== time.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{time.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )} />

              <FormField name="isVirtualOk" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule.virtual')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t('schedule.virtual')} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">{t('schedule.virtualOptions.yes')}</SelectItem>
                      <SelectItem value="no">{t('schedule.virtualOptions.no')}</SelectItem>
                      <SelectItem value="only">{t('schedule.virtualOptions.only')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <Button type="button" variant="outline" onClick={runTeacherSuggestion} disabled={isSuggesting}>
                {isSuggesting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
                {t('admin.getSuggestion')}
              </Button>

              {suggestedTeacher && (
                <Card className={cn('border-dashed', selectedTeacherId === suggestedTeacher.id && 'border-primary')}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {availableTeachers.find((item) => item.id === suggestedTeacher.id)?.name || t('summary.notSelected')}
                    </CardTitle>
                    <CardDescription>{t('admin.aiScore', { score: suggestedTeacher.score })}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {suggestedTeacher.reasons.map((reason) => (
                      <p key={reason} className="text-sm text-muted-foreground">{reason}</p>
                    ))}
                    <Button type="button" onClick={() => form.setValue('teacherId', suggestedTeacher.id, { shouldValidate: true })}>
                      {t('admin.useSuggestion')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">{t('admin.submit')}</Button>
        </div>
      </form>
    </FormProvider>
  )
}

export function EnrollmentWizard({ isAdminFlow = false, teacherIdFromQuery, conservatoriumIdFromQuery }: { isAdminFlow?: boolean; teacherIdFromQuery?: string; conservatoriumIdFromQuery?: string }) {
  const t = useTranslations('EnrollmentWizard');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const searchParams = useSearchParams();

  const steps = [
    { id: 'role', title: t('steps.role') },
    { id: 'details', title: t('steps.details') },
    { id: 'musical', title: t('steps.musical') },
    { id: 'schedule', title: t('steps.schedule') },
    { id: 'matching', title: t('steps.matching') },
    { id: 'booking', title: t('steps.booking') },
    { id: 'package', title: t('steps.package') },
    { id: 'summary', title: t('steps.summary') },
  ];

  const goalOptions = getGoalOptions(t);
  const dayOptions = getDayOptions(t);
  const timeOptions = getTimeOptions(t);

  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [teacherMatches, setTeacherMatches] = useState<MatchTeacherOutput | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [oauthPrefill, setOauthPrefill] = useState<OAuthProfile | null>(null);
  const isOauthRegistration = Boolean(oauthPrefill);
  const { toast } = useToast();
  const router = useRouter();
  const { user, users, addUser, addLesson, addToWaitlist, lessonPackages, conservatoriumInstruments, conservatoriums: authConservatoriums } = useAuth();
  const conservatoriumOptions = useMemo(() => authConservatoriums.map((item) => ({ value: item.id, label: item.name })), [authConservatoriums]);

  const formSchema = useMemo(() => getFormSchema(t), [t]);

  const [schoolSearch, setSchoolSearch] = useState("");
  const [playingSchoolToken, setPlayingSchoolToken] = useState("");
  const filteredSchools = useMemo(() => {
    if (!schoolSearch) return [];
    return schools.filter(s =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.symbol.toString().includes(schoolSearch)
    );
  }, [schoolSearch]);

  const goToPlayingSchoolByToken = useCallback(() => {
    const token = playingSchoolToken.trim();
    if (!token) return;
    router.push(`/register/school?token=${encodeURIComponent(token)}`);
  }, [playingSchoolToken, router]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      registrationType: 'parent',
      goals: [],
      availableDays: [],
      availableTimes: [],
      lessonDuration: 45,
      firstLessonDate: new Date(),
    },
  });

  const draftStorageKey = `${ENROLLMENT_DRAFT_STORAGE_PREFIX}:${locale}:${isAdminFlow ? 'admin' : 'public'}`;
  const teacherIdQueryParam = (teacherIdFromQuery || searchParams.get('teacher') || '').trim();
  const conservatoriumIdQueryParam = (conservatoriumIdFromQuery || searchParams.get('conservatorium') || '').trim();

  const resolveTeacherInstrument = useCallback((teacher: User) => {
    const teacherInstrument = (teacher.instruments || []).find((item) => Boolean(item?.instrument))?.instrument;
    if (!teacherInstrument) return '';

    const matchedInstrument = conservatoriumInstruments.find((instrument) =>
      instrument.conservatoriumId === teacher.conservatoriumId &&
      (
        instrument.id === teacherInstrument ||
        instrument.names.he === teacherInstrument ||
        instrument.names.en === teacherInstrument ||
        instrument.names.ar === teacherInstrument ||
        instrument.names.ru === teacherInstrument
      )
    );

    if (matchedInstrument) return matchedInstrument.names.he;
    return teacherInstrument;
  }, [conservatoriumInstruments]);

  const resolveTeacherConservatoriumIds = useCallback((teacher: User) => {
    const ids = new Set<string>();

    if (teacher.conservatoriumId) {
      ids.add(teacher.conservatoriumId);
    }

    const teacherAny = teacher as unknown as {
      conservatoriumIds?: string[];
      assignedConservatoriumIds?: string[];
      conservatoriumRoles?: Array<{ conservatoriumId?: string }>;
    };

    for (const id of teacherAny.conservatoriumIds || []) {
      if (id) ids.add(id);
    }

    for (const id of teacherAny.assignedConservatoriumIds || []) {
      if (id) ids.add(id);
    }

    for (const item of teacherAny.conservatoriumRoles || []) {
      if (item?.conservatoriumId) ids.add(item.conservatoriumId);
    }

    return Array.from(ids);
  }, []);


  useEffect(() => {
    if (isAdminFlow) return;
    if (searchParams.get('source') !== 'oauth') return;

    const raw = sessionStorage.getItem('oauth_prefill');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as OAuthProfile;
      if (!parsed.email) return;
      setOauthPrefill(parsed);
      form.setValue('registrationType', 'self');
      form.setValue('selfDetails.firstName', parsed.firstName || '');
      form.setValue('selfDetails.lastName', parsed.lastName || '');
      form.setValue('selfDetails.email', parsed.email);
      form.setValue('parentDetails.parentFirstName', parsed.firstName || '');
      form.setValue('parentDetails.parentLastName', parsed.lastName || '');
      form.setValue('parentDetails.parentEmail', parsed.email);
    } catch {
      sessionStorage.removeItem('oauth_prefill');
    }
  }, [form, isAdminFlow, searchParams]);

  useEffect(() => {
    if (isAdminFlow) return;

    if (conservatoriumIdQueryParam) {
      const conservatoriumExists = authConservatoriums.some((item) => item.id === conservatoriumIdQueryParam);
      if (conservatoriumExists) {
        form.setValue('conservatorium', conservatoriumIdQueryParam, { shouldValidate: true });
      }
    }

    if (!teacherIdQueryParam) return;

    // Wait until users data has loaded before checking for teacher
    if (users.length === 0) return;

    const matchedTeacher = users.find((candidate) => candidate.id === teacherIdQueryParam && candidate.role === 'teacher' && candidate.approved);
    if (!matchedTeacher) {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.noTeachersForFilters') });
      return;
    }

    const teacherConservatoriumIds = resolveTeacherConservatoriumIds(matchedTeacher);
    const teacherPrimaryConservatoriumId = teacherConservatoriumIds[0] || '';
    const requestedConservatoriumId = conservatoriumIdQueryParam || '';
    const hasRequestedConservatoriumMismatch = Boolean(requestedConservatoriumId && teacherConservatoriumIds.length > 0 && !teacherConservatoriumIds.includes(requestedConservatoriumId));

    const resolvedConservatoriumId = hasRequestedConservatoriumMismatch
      ? requestedConservatoriumId
      : (requestedConservatoriumId || teacherPrimaryConservatoriumId);

    if (resolvedConservatoriumId) {
      form.setValue('conservatorium', resolvedConservatoriumId, { shouldValidate: true });
    }

    const hasTeacherAvailability = matchedTeacher.availableForNewStudents !== false && Array.isArray(matchedTeacher.availability) && matchedTeacher.availability.length > 0;

    const instrumentFromTeacher = resolveTeacherInstrument(matchedTeacher);
    if (instrumentFromTeacher) {
      form.setValue('instrument', instrumentFromTeacher, { shouldValidate: true });
    }

    if (hasRequestedConservatoriumMismatch || !hasTeacherAvailability) {
      form.setValue('teacherId', undefined, { shouldValidate: true });
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('admin.noTeachersForFilters') });
      return;
    }

    form.setValue('teacherId', matchedTeacher.id, { shouldValidate: true });
  }, [
    authConservatoriums,
    conservatoriumIdQueryParam,
    form,
    isAdminFlow,
    resolveTeacherConservatoriumIds,
    resolveTeacherInstrument,
    t,
    teacherIdQueryParam,
    toast,
    users,
  ]);

  const instrumentLabelByLocale = useCallback((item: { names: { he: string; en: string; ar?: string; ru?: string } }) => {
    if (locale === 'he') return item.names.he;
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    return item.names.en;
  }, [locale]);

  const selectedConservatoriumId = form.watch('conservatorium');
  const selectedDuration = form.watch('lessonDuration') || 45;
  const selectedInstrument = form.watch('instrument');

  const availableTeachers = useMemo(() => users.filter((item) => {
    if (item.role !== 'teacher' || !item.approved) return false;
    if (selectedConservatoriumId && item.conservatoriumId !== selectedConservatoriumId) return false;
    if (!selectedInstrument) return true;
    return userHasInstrument((item.instruments || []).map((instrument) => instrument.instrument), selectedInstrument, conservatoriumInstruments, item.conservatoriumId);
  }), [users, selectedConservatoriumId, selectedInstrument]);

  const filteredInstrumentOptions = useMemo(() => {
    const filtered = conservatoriumInstruments
      .filter((item) => item.isActive && item.availableForRegistration && item.conservatoriumId === selectedConservatoriumId)
      .map((item) => ({ value: item.names.he, label: instrumentLabelByLocale(item) }));

    return filtered.length > 0 ? filtered : instruments.map((item) => ({ value: item, label: item }));
  }, [conservatoriumInstruments, selectedConservatoriumId, instrumentLabelByLocale]);

  const filteredPackages = useMemo(() => {
    return lessonPackages.filter((item) => {
      if (!item.isActive) return false;
      if (item.conservatoriumId !== selectedConservatoriumId) return false;
      if (item.durationMinutes !== selectedDuration) return false;
      return packageSupportsSelectedInstrument(item, selectedInstrument, conservatoriumInstruments);
    });
  }, [lessonPackages, selectedConservatoriumId, selectedDuration, selectedInstrument]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(draftStorageKey);
  }, [draftStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // When arriving via a direct teacher/conservatorium link, skip draft restore so that
    // the URL-param values set by the earlier effect are not wiped by form.reset().
    if (teacherIdQueryParam || conservatoriumIdQueryParam) return;

    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      const values = draft?.values ?? {};
      const restoredValues = {
        ...values,
        firstLessonDate: values?.firstLessonDate ? new Date(values.firstLessonDate) : undefined,
      };
      form.reset(restoredValues);

      if (typeof draft?.step === 'number' && draft.step >= 0 && draft.step < steps.length) {
        setStep(draft.step);
      }
    } catch {
      localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, form, steps.length, teacherIdQueryParam, conservatoriumIdQueryParam]);

  const persistDraft = useCallback(() => {
    if (typeof window === 'undefined' || isSubmitted) return;
    const values = form.getValues();
    const serializedValues = {
      ...values,
      firstLessonDate:
        values.firstLessonDate instanceof Date ? values.firstLessonDate.toISOString() : values.firstLessonDate ?? null,
    };

    localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        step,
        values: serializedValues,
      })
    );
  }, [draftStorageKey, form, isSubmitted, step]);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = window.setInterval(persistDraft, 30_000);
    return () => window.clearInterval(interval);
  }, [isSubmitted, persistDraft]);

  useEffect(() => {
    if (!isSubmitted) {
      persistDraft();
    }
  }, [isSubmitted, persistDraft, step]);

  const registrationType = form.watch("registrationType");
  const currentStepId = steps[step].id;

  const triggerTeacherMatching = async () => {
    setIsMatchingLoading(true);
    const formData = form.getValues();
    const studentProfile = {
      instrument: formData.instrument,
      level: formData.level,
      goals: formData.goals,
      preferredDays: formData.availableDays,
      preferredTimes: formData.availableTimes,
      isVirtualOk: formData.isVirtualOk,
      birthDate: formData.registrationType === 'self' ? formData.selfDetails?.birthDate! : formData.studentDetails?.childBirthDate!,
    };

    try {
      const result = await getTeacherMatches({
        studentProfile,
        availableTeachers: availableTeachers.map((item) => ({
          id: item.id,
          name: item.name,
          bio: item.bio || '',
          specialties: (item.specialties || []).map((specialty) => String(specialty)),
          teachingLanguages: item.teachingLanguages || [],
        })),
        locale
      });
      setTeacherMatches(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('matching.errorTitle'), description: t('matching.errorDesc') });
    } finally {
      setIsMatchingLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminFlow && currentStepId === 'matching' && !teacherMatches) {
      triggerTeacherMatching();
    }
  }, [currentStepId, teacherMatches, isAdminFlow]);


  const processStep = async () => {
    let fieldsToValidate: any[] = [];
    switch (currentStepId) {
      case 'role': fieldsToValidate = ['registrationType', 'conservatorium']; break;
      case 'details':
        fieldsToValidate = registrationType === 'parent' ? ['parentDetails', 'studentDetails'] : ['selfDetails'];
        if (!isOauthRegistration) fieldsToValidate.push('password');
        break;
      case 'musical': fieldsToValidate = ['instrument', 'level', 'lessonDuration']; break;
      case 'schedule': fieldsToValidate = ['availableDays', 'availableTimes', 'isVirtualOk']; break;
      case 'matching': fieldsToValidate = ['teacherId']; break;
      case 'package': fieldsToValidate = ['packageId']; break;
      case 'booking': fieldsToValidate = ['firstLessonDate', 'firstLessonTime']; break;
      default: break;
    }

    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
    if (!isValid) return;

    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onSubmit(form.getValues());
    }
  };

  const handleWaitlistSubmit = () => {
    const data = form.getValues();
    let newUser: any;


    if (data.registrationType === 'self' && data.selfDetails) {
      newUser = {
        name: `${data.selfDetails.firstName} ${data.selfDetails.lastName}`,
        email: data.selfDetails.email,
        role: 'student',
        idNumber: data.selfDetails.idNumber,
        birthDate: data.selfDetails.birthDate,
        phone: data.selfDetails.phone,
        conservatoriumName: data.conservatorium,
        grade: data.selfDetails?.grade,
        packageId: data.packageId,
      } as any;

    } else if (data.registrationType === 'parent' && data.studentDetails && data.parentDetails) {
      newUser = {
        name: `${data.studentDetails.childFirstName} ${data.studentDetails.childLastName}`,
        email: data.parentDetails.parentEmail,
        role: 'student',
        birthDate: data.studentDetails.childBirthDate,
        conservatoriumName: data.conservatorium,
        grade: data.studentDetails?.childGrade,
        parentId: 'parent-user-id',
        packageId: data.packageId,
      }
    } else {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('validation.missingDetails') });
      return;
    }

    if (oauthPrefill) {
      const now = new Date().toISOString();
      newUser.registrationSource = oauthPrefill.provider;
      newUser.avatarUrl = newUser.avatarUrl || oauthPrefill.avatarUrl;
      newUser.oauthProviders = [{
        userId: '',
        provider: oauthPrefill.provider,
        providerUserId: oauthPrefill.providerUserId,
        providerEmail: oauthPrefill.email,
        linkedAt: now,
        lastUsedAt: now,
      }];
    } else {
      newUser.registrationSource = newUser.registrationSource || 'email';
    }

    const createdUser = addUser(newUser as any, isAdminFlow);
    if (oauthPrefill) {
      createdUser.oauthProviders = (createdUser.oauthProviders || []).map((item) => ({ ...item, userId: createdUser.id }));
    }

    const conservatorium = authConservatoriums.find((c) => c.id === data.conservatorium || c.name === data.conservatorium);

    addToWaitlist({
      studentId: createdUser.id,
      teacherId: 'any', // General waitlist
      instrument: data.instrument || 'Piano', // Fallback instrument
      conservatoriumId: conservatorium?.id,
      preferredDays: data.availableDays as DayOfWeek[],
      preferredTimes: data.availableTimes as TimeRange[],
    });
    clearDraft();
    if (oauthPrefill) {
      sessionStorage.removeItem('oauth_prefill');
    }
    setIsSubmitted(true);
    toast({
      title: t('toasts.waitlistTitle'),
      description: isAdminFlow ? t('toasts.waitlistAdminDesc', { name: createdUser.name }) : t('toasts.waitlistUserDesc'),
    });
  };

  const onSubmit = (data: FormData) => {
    let newUser: any;


    if (data.registrationType === 'self' && data.selfDetails) {
      newUser = {
        name: `${data.selfDetails.firstName} ${data.selfDetails.lastName}`,
        email: data.selfDetails.email,
        role: 'student',
        idNumber: data.selfDetails.idNumber,
        birthDate: data.selfDetails.birthDate,
        phone: data.selfDetails.phone,
        conservatoriumName: data.conservatorium,
        grade: data.selfDetails?.grade,
      } as any;

    } else if (data.registrationType === 'parent' && data.studentDetails && data.parentDetails) {
      newUser = {
        name: `${data.studentDetails.childFirstName} ${data.studentDetails.childLastName}`,
        email: data.parentDetails.parentEmail,
        role: 'student',
        birthDate: data.studentDetails.childBirthDate,
        conservatoriumName: data.conservatorium,
        grade: data.studentDetails?.childGrade,
        parentId: 'parent-user-id',
      } as any;

    } else {
      toast({ variant: 'destructive', title: t('toasts.errorTitle'), description: t('validation.missingDetails') });
      return;
    }

    if (oauthPrefill) {
      const now = new Date().toISOString();
      newUser.registrationSource = oauthPrefill.provider;
      newUser.avatarUrl = newUser.avatarUrl || oauthPrefill.avatarUrl;
      newUser.oauthProviders = [{
        userId: '',
        provider: oauthPrefill.provider,
        providerUserId: oauthPrefill.providerUserId,
        providerEmail: oauthPrefill.email,
        linkedAt: now,
        lastUsedAt: now,
      }];
    } else {
      newUser.registrationSource = newUser.registrationSource || 'email';
    }

    const createdUser = addUser(newUser as any, isAdminFlow);
    if (oauthPrefill) {
      createdUser.oauthProviders = (createdUser.oauthProviders || []).map((item) => ({ ...item, userId: createdUser.id }));
    }


    if (data.firstLessonDate && data.firstLessonTime) {
      const [hours, minutes] = data.firstLessonTime.split(':');
      const lessonStartTime = set(data.firstLessonDate, { hours: parseInt(hours), minutes: parseInt(minutes) });
      addLesson({
        studentId: createdUser.id,
        teacherId: data.teacherId,
        instrument: data.instrument,
        startTime: lessonStartTime.toISOString(),
        durationMinutes: data.lessonDuration as 30 | 45 | 60,
        type: 'ADHOC',
        bookingSource: isAdminFlow ? 'ADMIN' : (data.registrationType === 'parent' ? 'PARENT' : 'STUDENT_SELF'),
      });
    }
    clearDraft();
    if (oauthPrefill) {
      sessionStorage.removeItem('oauth_prefill');
    }
    setIsSubmitted(true);
    toast({
      title: t('toasts.successTitle'),
      description: isAdminFlow ? t('toasts.successAdminDesc', { name: newUser.name }) : t('toasts.successUserDesc'),
    });
  };

  const formData = form.getValues();
  const selectedPackage = filteredPackages.find(p => p.id === formData.packageId);
  const paymentSchedule = useMemo(() => {
    if (!selectedPackage) return [];

    const installmentsByType: Record<string, number> = {
      single: 1,
      monthly: 4,
      semester: 4,
      annual: 12,
    };

    const installments = installmentsByType[selectedPackage.type] ?? 1;
    const amount = Number((selectedPackage.priceILS / installments).toFixed(2));
    const formatter = new Intl.DateTimeFormat(
      locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar-SA' : locale === 'ru' ? 'ru-RU' : 'en-US',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    );

    return Array.from({ length: installments }, (_, index) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + index);
      return {
        index: index + 1,
        amount,
        dueDate: formatter.format(dueDate),
      };
    });
  }, [locale, selectedPackage]);

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
            <ShieldCheck className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">
            {isAdminFlow ? t('success.adminTitle') : t('success.userTitle')}
          </CardTitle>
          <CardDescription>
            {isAdminFlow
              ? t('success.adminDesc')
              : t('success.userDesc')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(isAdminFlow ? '/dashboard/users' : '/')}>
            {isAdminFlow ? t('success.backToUsers') : t('success.backToHome')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAdminFlow) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('admin.title')}</CardTitle>
          <CardDescription>{t('admin.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <AdminEnrollmentForm onSubmit={onSubmit} />
          </FormProvider>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {t('role.title')}
        </CardTitle>
        <CardDescription>{t('role.subtitle')}</CardDescription>
        <div className="pt-4">
          <Stepper currentStep={step} steps={steps} />
        </div>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {currentStepId === 'role' && (
                  <div className="space-y-6">
                    <FormField name="registrationType" control={form.control} render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t('role.title')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col gap-3"
                            dir={isRtl ? 'rtl' : 'ltr'}
                          >
                            <FormItem className="flex items-center justify-end gap-3 rounded-md border p-4 bg-background/50 hover:bg-accent transition-colors cursor-pointer">
                              <FormLabel className="font-normal flex-1 cursor-pointer text-start">{t('role.parent')}</FormLabel>
                              <FormControl><RadioGroupItem value="parent" /></FormControl>
                            </FormItem>
                            <FormItem className="flex items-center justify-end gap-3 rounded-md border p-4 bg-background/50 hover:bg-accent transition-colors cursor-pointer">
                              <FormLabel className="font-normal flex-1 cursor-pointer text-start">{t('role.self')}</FormLabel>
                              <FormControl><RadioGroupItem value="self" /></FormControl>
                            </FormItem>
                            <FormItem className="flex items-center justify-end gap-3 rounded-md border p-4 bg-background/50 hover:bg-accent transition-colors cursor-pointer">
                              <div className="flex flex-col flex-1 text-start">
                                <FormLabel className="font-medium cursor-pointer">{t('role.playingSchool')}</FormLabel>
                                <span className="text-xs text-muted-foreground">{t('role.playingSchoolDescription')}</span>
                              </div>
                              <FormControl><RadioGroupItem value="playing_school" /></FormControl>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {registrationType !== 'playing_school' && (
                      <FormField name="conservatorium" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('role.conservatorium')}</FormLabel>
                          <Combobox options={conservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder={t('role.conservatoriumPlaceholder')} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {registrationType === 'playing_school' && (
                        <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <FormLabel>{t('role.findSchool')}</FormLabel>
                          <Input
                            placeholder={t('role.findSchoolPlaceholder')}
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            className="bg-background/50"
                          />
                        </div>

                        {filteredSchools.length > 0 && (
                          <div className="grid gap-2 max-h-48 overflow-y-auto p-1">
                            {filteredSchools.map((s) => (
                              <Button
                                type="button"
                                key={s.symbol}
                                variant="outline"
                                className="justify-start h-auto py-3 px-4 text-start"
                                onClick={() => router.push(`/register/school?token=mock-token-${s.symbol}`)}
                                dir={isRtl ? 'rtl' : 'ltr'}
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-medium">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">{t('role.schoolSymbol', { symbol: s.symbol })}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 py-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground uppercase">{t('role.or')}</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="space-y-2">
                          <FormLabel>{t('role.hasTokenQuestion')}</FormLabel>
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('role.tokenPlaceholder')}
                              className="font-mono bg-background/50"
                              value={playingSchoolToken}
                              onChange={(e) => setPlayingSchoolToken(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  goToPlayingSchoolByToken();
                                }
                              }}
                            />
                            <Button type="button" variant="secondary" onClick={goToPlayingSchoolByToken}>
                              {t('role.go')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStepId === 'details' && (
                  <div className="space-y-8">
                    {registrationType === 'parent' && (
                      <>
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">{t('details.parentTitle')}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField name="parentDetails.parentFirstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentLastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentEmail" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-start" {...field} readOnly={isOauthRegistration} disabled={isOauthRegistration} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentIdNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentPhone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">{t('details.studentTitle')}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField name="studentDetails.childFirstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="studentDetails.childLastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="studentDetails.childBirthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          </div>
                        </div>
                      </>
                    )}
                    {registrationType === 'self' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">{t('details.selfTitle')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField name="selfDetails.firstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.lastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.email" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-start" {...field} readOnly={isOauthRegistration} disabled={isOauthRegistration} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.idNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.birthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.phone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        </div>
                      </div>
                    )}
                    {!isOauthRegistration && <FormField name="password" render={({ field }) => (<FormItem> <FormLabel>{t('details.password')}</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-start" {...field} /></FormControl> <FormMessage /> </FormItem>)} />}
                    {isOauthRegistration && <p className="text-sm text-muted-foreground">{t('details.oauthEmailReadonly')}</p>}
                  </div>
                )}

                {currentStepId === 'musical' && (
                  <div className="space-y-6">
                    <FormField name="instrument" render={({ field }) => (<FormItem> <FormLabel>{t('musical.instrument')}</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.instrumentPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> {filteredInstrumentOptions.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                    <FormField name="level" render={({ field }) => (<FormItem> <FormLabel>{t('musical.level')}</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.levelPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Beginner">{t('musical.levels.Beginner')}</SelectItem> <SelectItem value="Intermediate">{t('musical.levels.Intermediate')}</SelectItem> <SelectItem value="Advanced">{t('musical.levels.Advanced')}</SelectItem> <SelectItem value="Exam Candidate">{t('musical.levels.Exam')}</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                    <FormField name="previousExperience" render={({ field }) => (<FormItem><FormLabel>{t('musical.experience')}</FormLabel><FormControl><Textarea placeholder={t('musical.experiencePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="goals" render={() => (
                      <FormItem>
                        <div className="mb-4"> <FormLabel>{t('musical.goals')}</FormLabel> </div>
                        <div className="grid grid-cols-2 gap-4">
                          {goalOptions.map((item) => (
                            <FormField key={item.id} name="goals" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row-reverse items-center gap-3 space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal flex-1 text-start">{item.label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="lessonDuration" render={({ field }) => (<FormItem> <FormLabel>{t('musical.duration')}</FormLabel> <Select onValueChange={(v: any) => field.onChange(Number(v))} defaultValue={String(field.value)}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.durationPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="30">{t('musical.minutes', { min: 30 })}</SelectItem> <SelectItem value="45">{t('musical.minutes', { min: 45 })}</SelectItem> <SelectItem value="60">{t('musical.minutes', { min: 60 })}</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                  </div>
                )}

                {currentStepId === 'schedule' && (
                  <div className="space-y-6">
                    <FormField name="availableDays" render={() => (
                      <FormItem>
                        <div className="mb-4"> <FormLabel>{t('schedule.days')}</FormLabel> </div>
                        <div className="grid grid-cols-3 gap-4">
                          {dayOptions.map((item) => (
                            <FormField key={item.id} name="availableDays" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row-reverse items-center gap-3 space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal flex-1 text-start">{item.label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="availableTimes" render={() => (
                      <FormItem>
                        <div className="mb-4"> <FormLabel>{t('schedule.times')}</FormLabel> </div>
                        <div className="grid grid-cols-3 gap-4">
                          {timeOptions.map((item) => (
                            <FormField key={item.id} name="availableTimes" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row-reverse items-center gap-3 space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal flex-1 text-start">{item.label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="isVirtualOk" control={form.control} render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t('schedule.virtual')}</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col gap-2">
                            <FormItem className="flex flex-row-reverse items-center gap-3 rounded-md border p-4">
                              <FormControl><RadioGroupItem value="yes" /></FormControl>
                              <FormLabel className="font-normal flex-1 text-start">{t('schedule.virtualOptions.yes')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex flex-row-reverse items-center gap-3 rounded-md border p-4">
                              <FormControl><RadioGroupItem value="no" /></FormControl>
                              <FormLabel className="font-normal flex-1 text-start">{t('schedule.virtualOptions.no')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex flex-row-reverse items-center gap-3 rounded-md border p-4">
                              <FormControl><RadioGroupItem value="only" /></FormControl>
                              <FormLabel className="font-normal flex-1 text-start">{t('schedule.virtualOptions.only')}</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {currentStepId === 'matching' && (
                  <>
                    {isMatchingLoading && (
                      <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p>{t('matching.loading')}</p>
                      </div>
                    )}
                    {!isMatchingLoading && teacherMatches && teacherMatches.matches.length > 0 && (
                      <FormField name="teacherId" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                              {teacherMatches.matches.map(match => {
                                const teacher = availableTeachers.find((candidate) => candidate.id === match.teacherId);
                                if (!teacher) return null;
                                return (
                                  <FormItem key={match.teacherId}>
                                    <FormControl>
                                      <TeacherMatchCard match={match} teacher={teacher} isSelected={field.value === match.teacherId} />
                                    </FormControl>
                                  </FormItem>
                                )
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="pt-4" />
                        </FormItem>
                      )} />
                    )}
                    {!isMatchingLoading && (!teacherMatches || teacherMatches.matches.length === 0) && (
                      <Card className="text-center col-span-full">
                        <CardHeader>
                          <CardTitle>{t('matching.noTeachersTitle')}</CardTitle>
                          <CardDescription>
                            {t('matching.noTeachersDesc')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button type="button" onClick={handleWaitlistSubmit}>
                            <UserPlus className="me-2 h-4 w-4" />
                            {t('matching.joinWaitlist')}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('matching.goBack')}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {currentStepId === 'package' && (
                  <div className="space-y-4">
                    <FormField name="packageId" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('package.title')}</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {filteredPackages.map((pkg) => (
                              <FormItem key={pkg.id} className="flex-1">
                                <FormControl>
                                  <Card className={cn("cursor-pointer hover:bg-muted/50 transition-all", field.value === pkg.id && "border-primary ring-2 ring-primary")}>
                                    <label htmlFor={pkg.id} className="block cursor-pointer">
                                      <CardHeader>
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <CardTitle>{pkg.names.he}</CardTitle>
                                            <CardDescription>{pkg.notes || pkg.names.en}</CardDescription>
                                          </div>
                                          <RadioGroupItem value={pkg.id} id={pkg.id} className="ms-4 mt-1" />
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-2xl font-bold">{pkg.priceILS} â‚ª</p>
                                        <p className="text-xs text-muted-foreground">{pkg.type === 'monthly' ? t('package.perMonth') : ''}</p>
                                      </CardContent>
                                    </label>
                                  </Card>
                                </FormControl>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {selectedPackage && paymentSchedule.length > 0 && (
                      <Card className="border-dashed">
                        <CardHeader>
                          <CardTitle className="text-base">{t('paymentPlan.title')}</CardTitle>
                          <CardDescription>{t('paymentPlan.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {paymentSchedule.map((entry) => (
                            <div key={entry.index} className="grid grid-cols-3 gap-2 text-sm">
                              <span>{t('paymentPlan.installment', { index: entry.index })}</span>
                              <span className="text-muted-foreground">{entry.dueDate}</span>
                              <span className="font-medium text-start">{entry.amount} â‚ª</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {currentStepId === 'book' && <BookFirstLessonStep />}

                {currentStepId === 'summary' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">{t('summary.title')}</h3>
                    <Card>
                      <CardContent className="p-6 space-y-3">
                        {formData.registrationType === 'self' && formData.selfDetails && (
                          <>
                            <DetailItem label={t('summary.studentName')} value={`${formData.selfDetails.firstName} ${formData.selfDetails.lastName}`} />
                            <DetailItem label={t('summary.email')} value={formData.selfDetails.email} />
                          </>
                        )}
                        {formData.registrationType === 'parent' && formData.studentDetails && formData.parentDetails && (
                          <>
                            <DetailItem label={t('summary.studentName')} value={`${formData.studentDetails.childFirstName} ${formData.studentDetails.childLastName}`} />
                            <DetailItem label={t('summary.parentName')} value={`${formData.parentDetails.parentFirstName} ${formData.parentDetails.parentLastName}`} />
                            <DetailItem label={t('summary.email')} value={formData.parentDetails.parentEmail} />
                          </>
                        )}
                        <DetailItem label={t('role.conservatorium')} value={authConservatoriums.find((item) => item.id === formData.conservatorium)?.name || formData.conservatorium} />
                        <DetailItem label={t('musical.instrument')} value={formData.instrument} />
                        <DetailItem label={t('summary.teacher')} value={users.find((candidate) => candidate.id === formData.teacherId)?.name || t('summary.notSelected')} />
                        <DetailItem label={t('summary.package')} value={selectedPackage?.names.he} />
                        <DetailItem label={t('summary.firstLesson')} value={formData.firstLessonDate && formData.firstLessonTime ? `${format(formData.firstLessonDate, 'dd/MM/yyyy')} ${t('summary.atTime')} ${formData.firstLessonTime}` : t('summary.later')} />
                        {selectedPackage && <DetailItem label={t('summary.price')} value={`${selectedPackage.priceILS} â‚ª`} />}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowRight className="h-4 w-4 me-2" />
            {t('common.back')}
          </Button>
          <Button type="button" onClick={processStep}>
            {step === steps.length - 1 ? t('common.submit') : t('common.next')}
            {step < steps.length - 1 && <ArrowLeft className="h-4 w-4 ms-2" />}
          </Button>
        </div>
      </CardFooter>
      {!isAdminFlow && (
        <div className="text-center pb-6">
          <p className="text-sm text-muted-foreground">
            {t('common.alreadyHaveAccount')}{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent('/dashboard/schedule/book?tab=deals')}`}
              className="underline text-primary"
            >
              {t('common.loginHere')}
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}




