'use client';

import { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getTeacherMatches } from "@/app/actions";
import type { MatchTeacherOutput } from "@/ai/flows/match-teacher-flow";
import { cn } from "@/lib/utils";
import { add, set, format, getDay, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowLeft, ArrowRight, User as UserIcon, Contact, Music, Calendar, HeartHandshake, Package as PackageIcon, ShieldCheck, Loader2, CalendarClock, UserPlus } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { Stepper } from "@/components/ui/stepper";
import { isValidIsraeliID } from "@/lib/utils";
import { conservatoriums, instruments, schools, mockTeachers } from "@/lib/data";
import type { StudentGoal, DayOfWeek, TimeRange, User, Package, LessonSlot } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";
import { TeacherMatchCard } from "./teacher-match-card";
import { Calendar as UICalendar } from "@/components/ui/calendar";


const getParentSchema = (t: any) => z.object({
  parentFirstName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  parentLastName: z.string().min(2, t('validation.tooShort', { min: 2 })),
  parentEmail: z.string().email(t('validation.invalidEmail')),
  parentIdNumber: z.string().refine(isValidIsraeliID, t('validation.invalidID')),
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
  idNumber: z.string().refine(isValidIsraeliID, t('validation.invalidID')),
  birthDate: z.string().min(1, t('validation.date')),
  phone: z.string().min(9, t('validation.invalidPhone')),
  schoolName: z.string().optional(),
  grade: z.string().optional(),
});

const getFormSchema = (t: any) => z.object({
  registrationType: z.enum(["parent", "self"], { message: t('validation.selectType') }),
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

const schoolOptions = schools.map(s => ({ value: s.name, label: `${s.name} (סמל: ${s.symbol})` }));
const conservatoriumOptions = conservatoriums.map(c => ({ value: c.id, label: c.name }));

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

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-1">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-right">{value || '-'}</span>
  </div>
);

const BookFirstLessonStep = () => {
  const t = useTranslations('EnrollmentWizard');
  const locale = useLocale();
  const form = useFormContext<FormData>();
  const { users, mockLessons } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const teacherId = form.watch('teacherId');
  const selectedDate = form.watch('firstLessonDate');
  const duration = form.watch('lessonDuration') || 45;

  useEffect(() => {
    if (!teacherId || !selectedDate) {
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

      const dayLessons = mockLessons.filter(l =>
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

  }, [teacherId, selectedDate, duration, users, mockLessons]);

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
              locale={locale === 'he' ? he : undefined}
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
                    <label className="flex items-center space-x-3 space-x-reverse p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" dir="rtl">
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
  const form = useFormContext<FormData>();
  const registrationType = form.watch("registrationType");

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.enrollSection')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
            <FormField name="registrationType" control={form.control} render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('role.title')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col gap-3"
                    dir="rtl"
                  >
                    <FormItem className="flex items-center space-x-2 space-x-reverse justify-start border rounded-md p-4 bg-background/50 hover:bg-accent transition-colors">
                      <FormControl><RadioGroupItem value="parent" /></FormControl>
                      <FormLabel className="font-normal flex-1 cursor-pointer">{t('role.parent')}</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-x-reverse justify-start border rounded-md p-4 bg-background/50 hover:bg-accent transition-colors">
                      <FormControl><RadioGroupItem value="self" /></FormControl>
                      <FormLabel className="font-normal flex-1 cursor-pointer">{t('role.self')}</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="conservatorium" render={({ field }) => (
              <FormItem className="flex flex-col" dir="rtl">
                <FormLabel>{t('role.conservatorium')}</FormLabel>
                <Combobox options={conservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder={t('role.conservatoriumPlaceholder')} />
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {registrationType === 'parent' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t('details.parentTitle')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="parentDetails.parentFirstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentLastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentEmail" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentIdNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                <FormField name="parentDetails.parentPhone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="selfDetails.firstName" render={({ field }) => (<FormItem> <FormLabel>{t('details.firstName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.lastName" render={({ field }) => (<FormItem> <FormLabel>{t('details.lastName')}</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.email" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.idNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.birthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
              <FormField name="selfDetails.phone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>{t('musical.title')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="instrument" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('musical.instrument')}</FormLabel>
                <Combobox
                  options={instruments.map(i => ({ value: i, label: i }))}
                  selectedValue={field.value}
                  onSelectedValueChange={field.onChange}
                  placeholder={t('musical.instrumentPlaceholder')}
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="level" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('musical.level')}</FormLabel>
                <Combobox
                  options={[
                    { value: "Beginner", label: t('musical.levels.Beginner') },
                    { value: "Intermediate", label: t('musical.levels.Intermediate') },
                    { value: "Advanced", label: t('musical.levels.Advanced') },
                    { value: "Exam Candidate", label: t('musical.levels.Exam') },
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
                    { value: "30", label: t('musical.minutes', { min: 30 }) },
                    { value: "45", label: t('musical.minutes', { min: 45 }) },
                    { value: "60", label: t('musical.minutes', { min: 60 }) },
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
                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                  <FormControl>
                    <SelectTrigger dir="rtl"><SelectValue placeholder={t('package.placeholder')} /></SelectTrigger>
                  </FormControl>
                  <SelectContent dir="rtl">
                    {(useAuth().mockPackages || []).map(p => <SelectItem key={p.id} value={p.id} dir="rtl">{p.title} - {p.price}₪</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="md:col-span-2"><FormField name="password" render={({ field }) => (<FormItem> <FormLabel>{t('details.password')}</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit">{t('admin.submit')}</Button>
        </div>
      </form>
    </FormProvider>
  )
}

export function EnrollmentWizard({ isAdminFlow = false }: { isAdminFlow?: boolean }) {
  const t = useTranslations('EnrollmentWizard');
  const locale = useLocale();

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
  const { toast } = useToast();
  const router = useRouter();
  const { addUser, mockPackages, addLesson, addToWaitlist } = useAuth();

  const formSchema = useMemo(() => getFormSchema(t), [t]);

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
        availableTeachers: mockTeachers.map(t => ({
          id: t.id!,
          name: t.name!,
          bio: t.bio,
          specialties: t.specialties as string[],
          teachingLanguages: t.teachingLanguages as string[],
        })),
        locale
      });
      setTeacherMatches(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('matching.errorTitle', { defaultValue: 'שגיאה בהתאמת מורה' }), description: t('matching.errorDesc', { defaultValue: 'אירעה שגיאה בעת ניסיון התאמת המורה. אנא נסה שוב.' }) });
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
      case 'details': fieldsToValidate = registrationType === 'parent' ? ['parentDetails', 'studentDetails', 'password'] : ['selfDetails', 'password']; break;
      case 'musical': fieldsToValidate = ['instrument', 'level', 'lessonDuration']; break;
      case 'schedule': fieldsToValidate = ['availableDays', 'availableTimes', 'isVirtualOk']; break;
      case 'matching': fieldsToValidate = ['teacherId']; break;
      case 'package': fieldsToValidate = ['packageId']; break;
      case 'book': fieldsToValidate = ['firstLessonDate', 'firstLessonTime']; break;
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

    const createdUser = addUser(newUser as any, isAdminFlow);

    const conservatorium = conservatoriums.find(c => c.name === data.conservatorium);

    addToWaitlist({
      studentId: createdUser.id,
      teacherId: 'any', // General waitlist
      instrument: data.instrument || 'Piano', // Fallback instrument
      conservatoriumId: conservatorium?.id,
      preferredDays: data.availableDays as DayOfWeek[],
      preferredTimes: data.availableTimes as TimeRange[],
    });

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

    const createdUser = addUser(newUser as any, isAdminFlow);


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

    setIsSubmitted(true);
    toast({
      title: t('toasts.successTitle'),
      description: isAdminFlow ? t('toasts.successAdminDesc', { name: newUser.name }) : t('toasts.successUserDesc'),
    });
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-4 text-center">
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
      <Card className="w-full max-w-4xl mx-4">
        <CardHeader>
          <CardTitle>רישום תלמיד חדש</CardTitle>
          <CardDescription>מלא את כל הפרטים כדי לרשום את התלמיד/ה.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <AdminEnrollmentForm onSubmit={onSubmit} />
          </FormProvider>
        </CardContent>
      </Card>
    );
  }


  const formData = form.getValues();
  const selectedPackage = mockPackages.find(p => p.id === formData.packageId);

  return (
    <Card className="w-full max-w-4xl mx-4 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isAdminFlow ? 'רישום תלמיד חדש (מנהל מערכת)' : t('role.title')}
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
                dir="rtl"
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
                            dir="rtl"
                          >
                            <FormItem className="flex flex-row-reverse items-center justify-end gap-3 rounded-md border p-4 bg-background/50 hover:bg-accent transition-colors cursor-pointer" dir="rtl">
                              <FormLabel className="font-normal flex-1 cursor-pointer text-right">{t('role.parent')}</FormLabel>
                              <FormControl><RadioGroupItem value="parent" /></FormControl>
                            </FormItem>
                            <FormItem className="flex flex-row-reverse items-center justify-end gap-3 rounded-md border p-4 bg-background/50 hover:bg-accent transition-colors cursor-pointer" dir="rtl">
                              <FormLabel className="font-normal flex-1 cursor-pointer text-right">{t('role.self')}</FormLabel>
                              <FormControl><RadioGroupItem value="self" /></FormControl>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="conservatorium" render={({ field }) => (
                      <FormItem className="flex flex-col" dir="rtl">
                        <FormLabel>{t('role.conservatorium')}</FormLabel>
                        <Combobox options={conservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder={t('role.conservatoriumPlaceholder')} />
                        <FormMessage />
                      </FormItem>
                    )} />
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
                            <FormField name="parentDetails.parentEmail" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentIdNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField name="parentDetails.parentPhone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
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
                          <FormField name="selfDetails.email" render={({ field }) => (<FormItem> <FormLabel>{t('details.email')}</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.idNumber" render={({ field }) => (<FormItem> <FormLabel>{t('details.idNumber')}</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.birthDate" render={({ field }) => (<FormItem> <FormLabel>{t('details.birthDate')}</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                          <FormField name="selfDetails.phone" render={({ field }) => (<FormItem> <FormLabel>{t('details.phone')}</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        </div>
                      </div>
                    )}
                    <FormField name="password" render={({ field }) => (<FormItem> <FormLabel>{t('details.password')}</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                  </div>
                )}

                {currentStepId === 'musical' && (
                  <div className="space-y-6">
                    <FormField name="instrument" render={({ field }) => (<FormItem> <FormLabel>{t('musical.instrument')}</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.instrumentPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                    <FormField name="level" render={({ field }) => (<FormItem> <FormLabel>{t('musical.level')}</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.levelPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Beginner">{t('musical.levels.Beginner')}</SelectItem> <SelectItem value="Intermediate">{t('musical.levels.Intermediate')}</SelectItem> <SelectItem value="Advanced">{t('musical.levels.Advanced')}</SelectItem> <SelectItem value="Exam Candidate">{t('musical.levels.Exam')}</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                    <FormField name="previousExperience" render={({ field }) => (<FormItem><FormLabel>{t('musical.experience')}</FormLabel><FormControl><Textarea placeholder={t('musical.experiencePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="goals" render={() => (
                      <FormItem>
                        <div className="mb-4"> <FormLabel>{t('musical.goals')}</FormLabel> </div>
                        <div className="grid grid-cols-2 gap-4">
                          {goalOptions.map((item) => (
                            <FormField key={item.id} name="goals" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                            )} />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="lessonDuration" render={({ field }) => (<FormItem> <FormLabel>{t('musical.duration')}</FormLabel> <Select dir="rtl" onValueChange={(v: any) => field.onChange(Number(v))} defaultValue={String(field.value)}> <FormControl><SelectTrigger><SelectValue placeholder={t('musical.durationPlaceholder')} /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="30">{t('musical.minutes', { min: 30 })}</SelectItem> <SelectItem value="45">{t('musical.minutes', { min: 45 })}</SelectItem> <SelectItem value="60">{t('musical.minutes', { min: 60 })}</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
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
                              <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
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
                              <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id))
                                  }} />

                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
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
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                            <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                              <FormControl><RadioGroupItem value="yes" /></FormControl>
                              <FormLabel className="font-normal flex-1">{t('schedule.virtualOptions.yes')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                              <FormControl><RadioGroupItem value="no" /></FormControl>
                              <FormLabel className="font-normal flex-1">{t('schedule.virtualOptions.no')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                              <FormControl><RadioGroupItem value="only" /></FormControl>
                              <FormLabel className="font-normal flex-1">{t('schedule.virtualOptions.only')}</FormLabel>
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
                                const teacher = mockTeachers.find(t => t.id === match.teacherId);
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
                          <Button onClick={handleWaitlistSubmit}>
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
                            {mockPackages.map((pkg: Package) => (
                              <FormItem key={pkg.id} className="flex-1">
                                <FormControl>
                                  <Card className={cn("cursor-pointer hover:bg-muted/50 transition-all", field.value === pkg.id && "border-primary ring-2 ring-primary")}>
                                    <label htmlFor={pkg.id} className="block cursor-pointer">
                                      <CardHeader>
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <CardTitle>{pkg.title}</CardTitle>
                                            <CardDescription>{pkg.description}</CardDescription>
                                          </div>
                                          <RadioGroupItem value={pkg.id} id={pkg.id} className="ms-4 mt-1" />
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-2xl font-bold">{pkg.price} ₪</p>
                                        <p className="text-xs text-muted-foreground">{pkg.type === 'MONTHLY' ? '/חודש' : ''}</p>
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
                        <DetailItem label={t('role.conservatorium')} value={formData.conservatorium} />
                        <DetailItem label={t('musical.instrument')} value={formData.instrument} />
                        <DetailItem label={t('summary.teacher')} value={mockTeachers.find(t => t.id === formData.teacherId)?.name || t('summary.notSelected')} />
                        <DetailItem label={t('summary.package')} value={selectedPackage?.title} />
                        <DetailItem label={t('summary.firstLesson')} value={formData.firstLessonDate && formData.firstLessonTime ? `${format(formData.firstLessonDate, 'dd/MM/yyyy')} ${t('summary.atTime')} ${formData.firstLessonTime}` : t('summary.later')} />
                        {selectedPackage && <DetailItem label={t('summary.price')} value={`${selectedPackage.price} ₪`} />}
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
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ArrowRight className="h-4 w-4 me-2" />
            הקודם
          </Button>
          <Button onClick={processStep}>
            {step === steps.length - 1 ? "סיום ושליחה" : "הבא"}
            {step < steps.length - 1 && <ArrowLeft className="h-4 w-4 ms-2" />}
          </Button>
        </div>
      </CardFooter>
      {!isAdminFlow && (
        <div className="text-center pb-6">
          <p className="text-sm text-muted-foreground">
            {t('common.alreadyHaveAccount')}{" "}
            <Link href="/login" className="underline text-primary">
              {t('common.loginHere')}
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}
