'use client';

import { useState, useMemo } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, ArrowLeft, ArrowRight, User as UserIcon, Contact, Music, School, ShieldCheck, HeartHandshake, Package as PackageIcon } from "lucide-react";
import { Combobox } from "../ui/combobox";
import { Stepper, Step } from "@/components/ui/stepper";
import { isValidIsraeliID } from "@/lib/utils";
import { conservatoriums, instruments, schools, mockPackages, mockTeachers } from "@/lib/data";
import type { StudentGoal, DayOfWeek, TimeRange } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";

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
  
  // Musical Profile
  instrument: z.string().min(1, "חובה לבחור כלי נגינה."),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Exam Candidate']),
  previousExperience: z.string().optional(),
  goals: z.array(z.string()).optional(),
  lessonDuration: z.coerce.number().optional(),

  // Schedule Preferences
  availableDays: z.array(z.string()).optional(),
  availableTimes: z.array(z.string()).optional(),
  isVirtualOk: z.enum(['yes', 'no', 'only']).optional(),

  // Package
  packageId: z.string().min(1, "חובה לבחור חבילה."),

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
  { id: 'package', title: 'בחירת חבילה', icon: PackageIcon },
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

export function EnrollmentWizard({ isAdminFlow = false }: { isAdminFlow?: boolean }) {
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addUser } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationType: 'parent',
      goals: [],
      availableDays: [],
      availableTimes: [],
    },
  });

  const registrationType = form.watch("registrationType");
  const currentStepId = steps[step].id;

  const processStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    switch (currentStepId) {
        case 'role': fieldsToValidate = ['registrationType', 'conservatorium']; break;
        case 'details': fieldsToValidate = registrationType === 'parent' ? ['parentDetails', 'studentDetails', 'password'] : ['selfDetails', 'password']; break;
        case 'musical': fieldsToValidate = ['instrument', 'level', 'lessonDuration']; break;
        case 'package': fieldsToValidate = ['packageId']; break;
        default: break;
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) return;

    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onSubmit(form.getValues());
    }
  };

  const onSubmit = (data: FormData) => {
    let newUser: Partial<User> = {};
    if (data.registrationType === 'self' && data.selfDetails) {
        newUser = {
            name: `${data.selfDetails.firstName} ${data.selfDetails.lastName}`,
            email: data.selfDetails.email,
            idNumber: data.selfDetails.idNumber,
            phone: data.selfDetails.phone,
            birthDate: data.selfDetails.birthDate,
            role: 'student',
            conservatoriumName: data.conservatorium,
            conservatoriumId: conservatoriums.find(c => c.name === data.conservatorium)?.id,
            grade: data.selfDetails.grade as any,
            schoolName: data.selfDetails.schoolName,
            instruments: [{ instrument: data.instrument, teacherName: '', yearsOfStudy: 0 }],
        };
    } else if (data.registrationType === 'parent' && data.parentDetails && data.studentDetails) {
        // Here you would normally create two users (parent and child) and link them.
        // For this mock, we'll just create the student.
         newUser = {
            name: `${data.studentDetails.childFirstName} ${data.studentDetails.childLastName}`,
            email: data.parentDetails.parentEmail, // Child might not have email
            role: 'student',
            conservatoriumName: data.conservatorium,
            conservatoriumId: conservatoriums.find(c => c.name === data.conservatorium)?.id,
            birthDate: data.studentDetails.childBirthDate,
            grade: data.studentDetails.childGrade as any,
            schoolName: data.studentDetails.childSchoolName,
            instruments: [{ instrument: data.instrument, teacherName: '', yearsOfStudy: 0 }],
            parentId: 'parent-user-id-placeholder' // In real app, create parent and link ID
        };
    }

    addUser(newUser);
    setIsSubmitted(true);
    toast({
      title: "ההרשמה נשלחה בהצלחה!",
      description: "בקשתך נשלחה לאישור מנהל הקונסרבטוריון. תקבל/י הודעה במייל.",
    });
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-2xl mx-4 text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
            <ShieldCheck className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">ההרשמה הושלמה בהצלחה!</CardTitle>
          <CardDescription>
            בקשתך נשלחה למנהל/ת הקונסרבטוריון לאישור.
            <br />
            תקבל/י הודעת אימייל כאשר חשבונך יאושר ותוכל/י להתחבר למערכת.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/')}>חזרה לדף הבית</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-4 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">הרשמה לקונסרבטוריון</CardTitle>
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
                        <FormField name="goals" render={() => (
                             <FormItem>
                                <div className="mb-4">
                                    <FormLabel>מטרות ויעדים</FormLabel>
                                </div>
                                {goalOptions.map((item) => (
                                    <FormField key={item.id} name="goals" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                                }} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField name="lessonDuration" render={({ field }) => ( <FormItem> <FormLabel>אורך שיעור מועדף</FormLabel> <Select dir="rtl" onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}> <FormControl><SelectTrigger><SelectValue placeholder="בחר אורך שיעור" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="30">30 דקות</SelectItem> <SelectItem value="45">45 דקות</SelectItem> <SelectItem value="60">60 דקות</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                    </div>
                )}
                
                {currentStepId === 'package' && (
                    <div className="space-y-4">
                        <FormField name="packageId" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>בחירת חבילת לימוד</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {mockPackages.map(pkg => (
                                            <FormItem key={pkg.id} className="flex-1">
                                                <FormControl>
                                                    <Card className={cn("cursor-pointer hover:bg-muted/50", field.value === pkg.id && "border-primary ring-2 ring-primary")}>
                                                        <CardHeader>
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <CardTitle>{pkg.title}</CardTitle>
                                                                    <CardDescription>{pkg.description}</CardDescription>
                                                                </div>
                                                                <RadioGroupItem value={pkg.id} className="ms-4 mt-1" />
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-2xl font-bold">{pkg.price} ₪</p>
                                                        </CardContent>
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


                {currentStepId === 'summary' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">סיכום ואישור</h3>
                    <div className="space-y-2 text-sm p-4 border rounded-lg bg-muted/50">
                      {form.getValues().registrationType === 'self' && form.getValues().selfDetails && (
                        <p><strong>שם:</strong> {form.getValues().selfDetails!.firstName} {form.getValues().selfDetails!.lastName}</p>
                      )}
                      {form.getValues().registrationType === 'parent' && form.getValues().studentDetails && (
                        <p><strong>שם התלמיד/ה:</strong> {form.getValues().studentDetails!.childFirstName} {form.getValues().studentDetails!.childLastName}</p>
                      )}
                      {form.getValues().registrationType === 'parent' && form.getValues().parentDetails && (
                        <p><strong>שם ההורה:</strong> {form.getValues().parentDetails!.parentFirstName} {form.getValues().parentDetails!.parentLastName}</p>
                      )}
                       <p><strong>קונסרבטוריון:</strong> {form.getValues().conservatorium}</p>
                       <p><strong>כלי נגינה:</strong> {form.getValues().instrument}</p>
                       <p><strong>חבילה:</strong> {mockPackages.find(p => p.id === form.getValues().packageId)?.title}</p>
                    </div>
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
