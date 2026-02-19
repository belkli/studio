'use client';

import { useState, useMemo, useEffect } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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


const parentSchema = z.object({
  parentFirstName: z.string().min(2, "שם פרטי חייב להכיל לפחות 2 תווים."),
  parentLastName: z.string().min(2, "שם משפחה חייב להכיל לפחות 2 תווים."),
  parentEmail: z.string().email("כתובת אימייל לא תקינה."),
  parentIdNumber: z.string().refine(isValidIsraeliID, "מספר ת.ז. לא תקין."),
  parentPhone: z.string().min(9, "מספר נייד לא תקין."),
});

const studentSchema = z.object({
  childFirstName: z.string().min(2, "שם פרטי חייב להכיל לפחות 2 תווים."),
  childLastName: z.string().min(2, "שם משפחה חייב להכיל לפחות 2 תווים."),
  childBirthDate: z.string().min(1, "יש להזין תאריך לידה."),
  childSchoolName: z.string().optional(),
  childGrade: z.string().optional(),
});

const selfSchema = z.object({
  firstName: z.string().min(2, "שם פרטי חייב להכיל לפחות 2 תווים."),
  lastName: z.string().min(2, "שם משפחה חייב להכיל לפחות 2 תווים."),
  email: z.string().email("כתובת אימייל לא תקינה."),
  idNumber: z.string().refine(isValidIsraeliID, "מספר ת.ז. לא תקין."),
  birthDate: z.string().min(1, "יש להזין תאריך לידה."),
  phone: z.string().min(9, "מספר נייד לא תקין."),
  schoolName: z.string().optional(),
  grade: z.string().optional(),
});

const formSchema = z.object({
  registrationType: z.enum(["parent", "self"], { required_error: "חובה לבחור סוג הרשמה." }),
  parentDetails: parentSchema.optional(),
  studentDetails: studentSchema.optional(),
  selfDetails: selfSchema.optional(),
  password: z.string().min(8, "סיסמה חייבת להכיל לפחות 8 תווים."),
  conservatorium: z.string({ required_error: "חובה לבחור קונסרבטוריון." }).min(1, "חובה לבחור קונסרבטוריון."),
  
  instrument: z.string().min(1, "חובה לבחור כלי נגינה."),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Exam Candidate']),
  previousExperience: z.string().optional(),
  goals: z.array(z.string()).optional(),
  lessonDuration: z.coerce.number().optional(),

  availableDays: z.array(z.string()).optional(),
  availableTimes: z.array(z.string()).optional(),
  isVirtualOk: z.enum(['yes', 'no', 'only']).optional(),
  
  teacherId: z.string().optional(),

  packageId: z.string().min(1, "חובה לבחור חבילה."),

  firstLessonDate: z.date().optional(),
  firstLessonTime: z.string().optional(),

}).superRefine((data, ctx) => {
  if (data.registrationType === 'parent') {
    if (!data.parentDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['parentDetails'], message: "נדרש" });
    if (!data.studentDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['studentDetails'], message: "נדרש" });
  }
  if (data.registrationType === 'self') {
    if (!data.selfDetails) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['selfDetails'], message: "נדרש" });
  }
});

type FormData = z.infer<typeof formSchema>;

const schoolOptions = schools.map(s => ({ value: s.name, label: `${s.name} (סמל: ${s.symbol})` }));
const conservatoriumOptions = conservatoriums.map(c => ({ value: c.name, label: c.name }));

const steps = [
  { id: 'role', title: 'סוג הרשמה', icon: UserIcon },
  { id: 'details', title: 'פרטים אישיים', icon: Contact },
  { id: 'musical', title: 'פרופיל מוזיקלי', icon: Music },
  { id: 'schedule', title: 'העדפות מערכת', icon: Calendar },
  { id: 'matching', title: 'התאמת מורה', icon: HeartHandshake },
  { id: 'package', title: 'בחירת חבילה', icon: PackageIcon },
  { id: 'book', title: 'תיאום שיעור ראשון', icon: CalendarClock },
  { id: 'summary', title: 'סיכום ואישור', icon: ShieldCheck },
];

const goalOptions: {id: StudentGoal; label: string}[] = [
    {id: 'EXAMS', label: 'בחינות משרד החינוך'},
    {id: 'PERFORMANCE', label: 'הופעות ורסיטלים'},
    {id: 'ENJOYMENT', label: 'הנאה אישית'},
    {id: 'COMPETITION', label: 'תחרויות'},
    {id: 'OTHER', label: 'אחר'},
];

const dayOptions: {id: DayOfWeek; label: string}[] = [
    {id: 'SUN', label: 'ראשון'}, {id: 'MON', label: 'שני'}, {id: 'TUE', label: 'שלישי'}, {id: 'WED', label: 'רביעי'}, {id: 'THU', label: 'חמישי'}, {id: 'FRI', label: 'שישי'}
]
const timeOptions: {id: TimeRange; label: string}[] = [
    {id: 'MORNING', label: 'בוקר (8-13)'}, {id: 'AFTERNOON', label: 'צהריים (13-17)'}, {id: 'EVENING', label: 'ערב (17-21)'}
]

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium text-right">{value || '-'}</span>
    </div>
);

const BookFirstLessonStep = () => {
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
                     const potentialSlotTime = set(selectedDate, { hours: parseInt(slotTimeStr.split(':')[0]), minutes: parseInt(slotTimeStr.split(':')[1])});
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
                          locale={he}
                          className="rounded-md border"
                      />
                  </FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField name="firstLessonTime" control={form.control} render={({ field }) => (
              <FormItem>
                  <FormLabel>שעות פנויות</FormLabel>
                  <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="max-h-80 overflow-y-auto p-1 border rounded-md">
                          {isLoadingSlots && <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>}
                          {!isLoadingSlots && availableSlots.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">לא נמצאו שעות פנויות למורה בתאריך זה.</p>}
                          {!isLoadingSlots && availableSlots.map(slot => (
                              <FormItem key={slot}>
                                  <FormControl>
                                      <label className="flex items-center space-x-3 space-x-reverse p-3 rounded-md hover:bg-muted cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                          <RadioGroupItem value={slot} id={`time-${slot}`} className="hidden"/>
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
    const form = useFormContext<FormData>();
    const registrationType = form.watch("registrationType");

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>פרטי הרשמה</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="registrationType" control={form.control} render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>מי נרשם?</FormLabel>
                            <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-2 space-x-reverse">
                                <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl><RadioGroupItem value="parent" /></FormControl>
                                <FormLabel className="font-normal">הורה רושם ילד/ה</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-x-reverse">
                                <FormControl><RadioGroupItem value="self" /></FormControl>
                                <FormLabel className="font-normal">תלמיד/ה 13+</FormLabel>
                                </FormItem>
                            </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                        <FormField name="conservatorium" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>קונסרבטוריון</FormLabel>
                            <Combobox options={conservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder="חפש קונסרבטוריון..." />
                            <FormMessage />
                        </FormItem>
                        )} />
                    </CardContent>
                </Card>

                {registrationType === 'parent' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                             <CardHeader><CardTitle>פרטי ההורה</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <FormField name="parentDetails.parentFirstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentLastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentEmail" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentIdNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentPhone" render={({ field }) => ( <FormItem> <FormLabel>טלפון נייד</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                             </CardContent>
                        </Card>
                        <Card>
                             <CardHeader><CardTitle>פרטי התלמיד/ה</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <FormField name="studentDetails.childFirstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="studentDetails.childLastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="studentDetails.childBirthDate" render={({ field }) => ( <FormItem> <FormLabel>תאריך לידה</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            </CardContent>
                        </Card>
                    </div>
                )}
                 {registrationType === 'self' && (
                    <Card>
                        <CardHeader><CardTitle>פרטים אישיים</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="selfDetails.firstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="selfDetails.lastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="selfDetails.email" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="selfDetails.idNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="selfDetails.birthDate" render={({ field }) => ( <FormItem> <FormLabel>תאריך לידה</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField name="selfDetails.phone" render={({ field }) => ( <FormItem> <FormLabel>טלפון נייד</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        </CardContent>
                    </Card>
                )}
                
                <Card>
                    <CardHeader><CardTitle>פרופיל מוזיקלי</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="instrument" render={({ field }) => ( <FormItem> <FormLabel>כלי נגינה</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר כלי נגינה" /></SelectTrigger></FormControl> <SelectContent> {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField name="level" render={({ field }) => ( <FormItem> <FormLabel>רמה נוכחית</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר רמה" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Beginner">מתחיל/ה</SelectItem> <SelectItem value="Intermediate">ביניים</SelectItem> <SelectItem value="Advanced">מתקדם/ת</SelectItem> <SelectItem value="Exam Candidate">מועמד/ת לבחינה</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField name="lessonDuration" render={({ field }) => ( <FormItem> <FormLabel>אורך שיעור</FormLabel> <Select dir="rtl" onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}> <FormControl><SelectTrigger><SelectValue placeholder="בחר אורך שיעור" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="30">30 דקות</SelectItem> <SelectItem value="45">45 דקות</SelectItem> <SelectItem value="60">60 דקות</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField name="packageId" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>חבילה</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="בחר חבילה..." /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(useAuth().mockPackages || []).map(p => <SelectItem key={p.id} value={p.id}>{p.title} - {p.price}₪</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="md:col-span-2"><FormField name="password" render={({ field }) => ( <FormItem> <FormLabel>סיסמה התחלתית</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} /></div>
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit">רשום תלמיד</Button>
                </div>
            </form>
        </FormProvider>
    )
}

export function EnrollmentWizard({ isAdminFlow = false }: { isAdminFlow?: boolean }) {
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [teacherMatches, setTeacherMatches] = useState<MatchTeacherOutput | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addUser, mockPackages, addLesson, addToWaitlist } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
                }))
            });
            setTeacherMatches(result);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'שגיאה בהתאמת מורה', description: 'אירעה שגיאה בעת ניסיון התאמת המורה. אנא נסה שוב.' });
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
        let newUser: Partial<User>;
        
        if (data.registrationType === 'self' && data.selfDetails) {
            newUser = {
                name: `${data.selfDetails.firstName} ${data.selfDetails.lastName}`,
                email: data.selfDetails.email,
                role: 'student',
                idNumber: data.selfDetails.idNumber,
                birthDate: data.selfDetails.birthDate,
                phone: data.selfDetails.phone,
                conservatoriumName: data.conservatorium,
                grade: data.grade,
                packageId: data.packageId,
            }
        } else if (data.registrationType === 'parent' && data.studentDetails && data.parentDetails) {
            newUser = {
                name: `${data.studentDetails.childFirstName} ${data.studentDetails.childLastName}`,
                email: data.parentDetails.parentEmail,
                role: 'student',
                birthDate: data.studentDetails.childBirthDate,
                conservatoriumName: data.conservatorium,
                grade: data.grade,
                parentId: 'parent-user-id',
                packageId: data.packageId,
            }
        } else {
            toast({ variant: 'destructive', title: 'שגיאה', description: 'פרטים חסרים, לא ניתן להשלים את ההרשמה.' });
            return;
        }

        const createdUser = addUser(newUser, isAdminFlow);
        const conservatorium = conservatoriums.find(c => c.name === data.conservatorium);

        addToWaitlist({
            studentId: createdUser.id,
            teacherId: 'any', // General waitlist
            instrument: data.instrument,
            conservatoriumId: conservatorium?.id,
            preferredDays: data.availableDays as DayOfWeek[],
            preferredTimes: data.availableTimes as TimeRange[],
        });
        
        setIsSubmitted(true);
        toast({
          title: "הצטרפת לרשימת ההמתנה!",
          description: isAdminFlow ? `${createdUser.name} נוסף למערכת ולרשימת המתנה.` : "נודיע לך כאשר יתפנה מקום.",
        });
    };

  const onSubmit = (data: FormData) => {
    let newUser: Partial<User>;
    
    if (data.registrationType === 'self' && data.selfDetails) {
        newUser = {
            name: `${data.selfDetails.firstName} ${data.selfDetails.lastName}`,
            email: data.selfDetails.email,
            role: 'student',
            idNumber: data.selfDetails.idNumber,
            birthDate: data.selfDetails.birthDate,
            phone: data.selfDetails.phone,
            conservatoriumName: data.conservatorium,
            grade: data.grade,
        }
    } else if (data.registrationType === 'parent' && data.studentDetails && data.parentDetails) {
        newUser = {
            name: `${data.studentDetails.childFirstName} ${data.studentDetails.childLastName}`,
            email: data.parentDetails.parentEmail, 
            role: 'student',
            birthDate: data.studentDetails.childBirthDate,
            conservatoriumName: data.conservatorium,
            grade: data.grade,
            parentId: 'parent-user-id', 
        }
    } else {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'פרטים חסרים, לא ניתן להשלים את ההרשמה.' });
        return;
    }
    
    const createdUser = addUser(newUser, isAdminFlow);

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
      title: "ההרשמה נשלחה בהצלחה!",
      description: isAdminFlow ? `${newUser.name} נוסף למערכת.` : "בקשתך נשלחה לאישור מנהל הקונסרבטוריון.",
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
             {isAdminFlow ? "התלמיד נרשם בהצלחה!" : "ההרשמה הושלמה בהצלחה!"}
          </CardTitle>
          <CardDescription>
            {isAdminFlow 
            ? 'התלמיד נוסף למערכת וניתן לנהל את הפרופיל שלו.'
            : <>בקשתך נשלחה למנהל/ת הקונסרבטוריון לאישור.
            <br />
            תקבל/י הודעת אימייל כאשר חשבונך יאושר ותוכל/י להתחבר למערכת.</>
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(isAdminFlow ? '/dashboard/users' : '/')}>
            {isAdminFlow ? 'חזרה לניהול משתמשים' : 'חזרה לדף הבית'}
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
            {isAdminFlow ? 'רישום תלמיד חדש (מנהל מערכת)' : 'הרשמה לקונסרבטוריון'}
        </CardTitle>
        <CardDescription>מלא/י את הפרטים כדי להצטרף להרמוניה.</CardDescription>
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
              >
                {currentStepId === 'role' && (
                  <div className="space-y-6">
                    <FormField name="registrationType" control={form.control} render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>מי נרשם?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                            <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                              <FormControl><RadioGroupItem value="parent" /></FormControl>
                              <FormLabel className="font-normal flex-1">אני רושם/ת את הילד/ה שלי</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                              <FormControl><RadioGroupItem value="self" /></FormControl>
                              <FormLabel className="font-normal flex-1">אני רושם/ת את עצמי (מעל גיל 13)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="conservatorium" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>קונסרבטוריון</FormLabel>
                        <Combobox options={conservatoriumOptions} selectedValue={field.value ?? ''} onSelectedValueChange={field.onChange} placeholder="חפש קונסרבטוריון..." />
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
                            <h3 className="font-semibold text-lg">פרטי ההורה</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="parentDetails.parentFirstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentLastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentEmail" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentIdNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="parentDetails.parentPhone" render={({ field }) => ( <FormItem> <FormLabel>טלפון נייד</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            </div>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold text-lg">פרטי התלמיד/ה</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="studentDetails.childFirstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="studentDetails.childLastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="studentDetails.childBirthDate" render={({ field }) => ( <FormItem> <FormLabel>תאריך לידה</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            </div>
                        </div>
                      </>
                    )}
                     {registrationType === 'self' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">פרטים אישיים</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="selfDetails.firstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="selfDetails.lastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="selfDetails.email" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="selfDetails.idNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="selfDetails.birthDate" render={({ field }) => ( <FormItem> <FormLabel>תאריך לידה</FormLabel> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                <FormField name="selfDetails.phone" render={({ field }) => ( <FormItem> <FormLabel>טלפון נייד</FormLabel> <FormControl><Input type="tel" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            </div>
                        </div>
                     )}
                    <FormField name="password" render={({ field }) => ( <FormItem> <FormLabel>סיסמה</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                )}
                
                {currentStepId === 'musical' && (
                    <div className="space-y-6">
                        <FormField name="instrument" render={({ field }) => ( <FormItem> <FormLabel>כלי נגינה</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר כלי נגינה" /></SelectTrigger></FormControl> <SelectContent> {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        <FormField name="level" render={({ field }) => ( <FormItem> <FormLabel>רמה נוכחית</FormLabel> <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="בחר רמה" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Beginner">מתחיל/ה</SelectItem> <SelectItem value="Intermediate">ביניים</SelectItem> <SelectItem value="Advanced">מתקדם/ת</SelectItem> <SelectItem value="Exam Candidate">מועמד/ת לבחינה</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                         <FormField name="previousExperience" render={({ field }) => ( <FormItem><FormLabel>ניסיון קודם (אופציונלי)</FormLabel><FormControl><Textarea placeholder="לדוגמה: 3 שנות פסנתר, ללא רקע בתיאוריה..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField name="goals" render={() => (
                             <FormItem>
                                <div className="mb-4"> <FormLabel>מטרות ויעדים</FormLabel> </div>
                                <div className="grid grid-cols-2 gap-4">
                                {goalOptions.map((item) => (
                                    <FormField key={item.id} name="goals" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                                }} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField name="lessonDuration" render={({ field }) => ( <FormItem> <FormLabel>אורך שיעור מועדף</FormLabel> <Select dir="rtl" onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}> <FormControl><SelectTrigger><SelectValue placeholder="בחר אורך שיעור" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="30">30 דקות</SelectItem> <SelectItem value="45">45 דקות</SelectItem> <SelectItem value="60">60 דקות</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                    </div>
                )}

                {currentStepId === 'schedule' && (
                     <div className="space-y-6">
                        <FormField name="availableDays" render={() => (
                             <FormItem>
                                <div className="mb-4"> <FormLabel>ימים פנויים</FormLabel> </div>
                                <div className="grid grid-cols-3 gap-4">
                                {dayOptions.map((item) => (
                                    <FormField key={item.id} name="availableDays" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                                }} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField name="availableTimes" render={() => (
                             <FormItem>
                                <div className="mb-4"> <FormLabel>זמנים מועדפים</FormLabel> </div>
                                <div className="grid grid-cols-3 gap-4">
                                {timeOptions.map((item) => (
                                    <FormField key={item.id} name="availableTimes" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                                }} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField name="isVirtualOk" control={form.control} render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>שיעורים וירטואליים</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                                <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                                  <FormControl><RadioGroupItem value="yes" /></FormControl>
                                  <FormLabel className="font-normal flex-1">כן, אפשרי</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                                  <FormControl><RadioGroupItem value="no" /></FormControl>
                                  <FormLabel className="font-normal flex-1">לא, רק פרונטלי</FormLabel>
                                </FormItem>
                                 <FormItem className="flex items-center space-x-3 space-x-reverse rounded-md border p-4">
                                  <FormControl><RadioGroupItem value="only" /></FormControl>
                                  <FormLabel className="font-normal flex-1">רק וירטואלי</FormLabel>
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
                            <p>ממליץ על המורים המתאימים ביותר עבורך...</p>
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
                                <CardTitle>לא נמצאו מורים פנויים כרגע</CardTitle>
                                <CardDescription>
                                    כל המורים המתאימים להעדפותיך תפוסים כעת. באפשרותך להצטרף לרשימת ההמתנה ונודיע לך כאשר יתפנה מקום.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleWaitlistSubmit}>
                                    <UserPlus className="me-2 h-4 w-4" />
                                    הצטרף לרשימת המתנה
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    לחילופין, תוכל/י לחזור אחורה ולשנות את העדפות המערכת.
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
                                <FormLabel>בחירת חבילת לימוד</FormLabel>
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
                    <h3 className="text-lg font-medium">סיכום ואישור</h3>
                     <Card>
                        <CardContent className="p-6 space-y-3">
                           {formData.registrationType === 'self' && formData.selfDetails && (
                            <>
                                <DetailItem label="שם הנרשם" value={`${formData.selfDetails.firstName} ${formData.selfDetails.lastName}`} />
                                <DetailItem label="אימייל" value={formData.selfDetails.email} />
                            </>
                          )}
                          {formData.registrationType === 'parent' && formData.studentDetails && formData.parentDetails && (
                            <>
                               <DetailItem label="שם התלמיד/ה" value={`${formData.studentDetails.childFirstName} ${formData.studentDetails.childLastName}`} />
                               <DetailItem label="שם ההורה" value={`${formData.parentDetails.parentFirstName} ${formData.parentDetails.parentLastName}`} />
                               <DetailItem label="אימייל ליצירת קשר" value={formData.parentDetails.parentEmail} />
                            </>
                          )}
                           <DetailItem label="קונסרבטוריון" value={formData.conservatorium} />
                           <DetailItem label="כלי נגינה" value={formData.instrument} />
                           <DetailItem label="מורה" value={mockTeachers.find(t => t.id === formData.teacherId)?.name || 'טרם נבחר'} />
                           <DetailItem label="חבילה" value={selectedPackage?.title} />
                           <DetailItem label="מועד שיעור ראשון" value={formData.firstLessonDate && formData.firstLessonTime ? `${format(formData.firstLessonDate, 'dd/MM/yyyy')} בשעה ${formData.firstLessonTime}` : 'יקבע בהמשך'} />
                           {selectedPackage && <DetailItem label="מחיר" value={`${selectedPackage.price} ₪`} />}
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
            יש לך כבר חשבון?{" "}
            <Link href="/login" className="underline text-primary">
              התחבר כאן
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}
