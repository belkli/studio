"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { conservatoriums, instruments, schools } from "@/lib/data"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

const formSchema = z.object({
    firstName: z.string().min(2, "שם פרטי חייב להכיל לפחות 2 תווים."),
    lastName: z.string().min(2, "שם משפחה חייב להכיל לפחות 2 תווים."),
    email: z.string().email("כתובת אימייל לא תקינה."),
    idNumber: z.string().refine(val => /^\d{9}$/.test(val), "מספר ת.ז. חייב להכיל 9 ספרות."),
    password: z.string().min(8, "סיסמה חייבת להכיל לפחות 8 תווים."),
    role: z.enum(["student", "teacher", "admin"], { required_error: "חובה לבחור תפקיד."}),
    instrument: z.string().optional(),
    studyYears: z.array(z.number()).optional(),
    conservatorium: z.string({ required_error: "חובה לבחור קונסרבטוריון."}).min(1, "חובה לבחור קונסרבטוריון."),
    school: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function RegisterForm() {
    const [step, setStep] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            idNumber: "",
            password: "",
            conservatorium: "",
            instrument: "",
            school: "",
            studyYears: [1],
        },
    });

    const role = form.watch("role");

    const processStep = async () => {
        let fields: (keyof FormData)[] = [];
        if (step === 0) fields = ["firstName", "lastName", "email", "idNumber", "password"];
        if (step === 1) fields = ["role", "conservatorium", ...(role === "student" ? ["instrument", "studyYears"] as const : [])];
        if (step === 2 && role === "student") fields = ["school"];

        const isValid = await form.trigger(fields);
        if (!isValid) return;

        if (step < (role === 'student' ? 3 : 2)) {
            setStep(s => s + 1);
        } else {
            onSubmit(form.getValues());
        }
    };
    
    const onSubmit = (data: FormData) => {
        console.log(data);
        setIsSubmitted(true);
        toast({
            title: "ההרשמה נשלחה בהצלחה!",
            description: "ממתין לאישור מנהל – נודיע לך במייל.",
        });
    };

    const totalSteps = role === 'student' ? 4 : 3;
    const progress = ((step + 1) / totalSteps) * 100;

    if (isSubmitted) {
        return (
             <Card className="w-full max-w-lg mx-4 text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
                        <Check className="h-10 w-10 text-accent" />
                    </div>
                    <CardTitle className="text-2xl font-bold mt-4">ההרשמה הושלמה</CardTitle>
                    <CardDescription>
                        הבקשה שלך נשלחה למנהל המערכת לאישור.
                        תקבל הודעת אימייל כאשר חשבונך יאושר.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/')}>חזרה לדף הבית</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-4 shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">הרשמה למערכת</CardTitle>
                <CardDescription>מלא את הפרטים כדי ליצור חשבון חדש.</CardDescription>
                <div className="pt-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">שלב {step + 1} מתוך {totalSteps}</p>
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
                                {step === 0 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField name="firstName" render={({ field }) => ( <FormItem> <FormLabel>שם פרטי</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                            <FormField name="lastName" render={({ field }) => ( <FormItem> <FormLabel>שם משפחה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                        </div>
                                        <FormField name="email" render={({ field }) => ( <FormItem> <FormLabel>אימייל</FormLabel> <FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                        <FormField name="idNumber" render={({ field }) => ( <FormItem> <FormLabel>ת.ז.</FormLabel> <FormControl><Input dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                        <FormField name="password" render={({ field }) => ( <FormItem> <FormLabel>סיסמה</FormLabel> <FormControl><Input type="password" dir="ltr" className="text-left" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                    </div>
                                )}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <FormField name="role" control={form.control} render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>אני...</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                        <FormItem className="flex items-center space-x-3 space-x-reverse">
                                                            <FormControl><RadioGroupItem value="student" /></FormControl>
                                                            <FormLabel className="font-normal">תלמיד/ה</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-x-reverse">
                                                            <FormControl><RadioGroupItem value="teacher" /></FormControl>
                                                            <FormLabel className="font-normal">מורה</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-x-reverse">
                                                            <FormControl><RadioGroupItem value="admin" /></FormControl>
                                                            <FormLabel className="font-normal">מנהל/ת קונסרבטוריון</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField name="conservatorium" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>קונסרבטוריון</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="בחר קונסרבטוריון" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {conservatoriums.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        {role === 'student' && (
                                            <>
                                                <FormField name="instrument" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>כלי נגינה</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="בחר כלי נגינה" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField name="studyYears" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>שנות לימוד בקונסרבטוריון: {field.value?.[0] || 1}</FormLabel>
                                                        <FormControl><Slider dir="rtl" defaultValue={[1]} min={1} max={10} step={1} onValueChange={field.onChange} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </>
                                        )}
                                    </div>
                                )}
                                {step === 2 && role === 'student' && (
                                     <FormField name="school" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>בית ספר</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="חפש בית ספר..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {schools.map(s => <SelectItem key={s.symbol} value={s.name}>{s.name} (סמל: {s.symbol})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                {step === (role === 'student' ? 3 : 2) && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">סיכום ואישור</h3>
                                        <div className="space-y-2 text-sm p-4 border rounded-lg bg-muted/50">
                                            <p><strong>שם:</strong> {form.getValues().firstName} {form.getValues().lastName}</p>
                                            <p><strong>אימייל:</strong> {form.getValues().email}</p>
                                            <p><strong>תפקיד:</strong> {form.getValues().role === 'student' ? 'תלמיד' : form.getValues().role === 'teacher' ? 'מורה' : 'מנהל'}</p>
                                            <p><strong>קונסרבטוריון:</strong> {form.getValues().conservatorium}</p>
                                            {role === 'student' && <>
                                                <p><strong>כלי נגינה:</strong> {form.getValues().instrument}</p>
                                                <p><strong>שנות לימוד:</strong> {form.getValues().studyYears?.[0]}</p>
                                                <p><strong>בית ספר:</strong> {form.getValues().school}</p>
                                            </>}
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
                        {step === (role === 'student' ? 3 : 2) ? "הרשם" : "הבא"}
                        <ArrowLeft className="h-4 w-4 ms-2" />
                    </Button>
                </div>
            </CardFooter>
             <div className="text-center pb-6">
                <p className="text-sm text-muted-foreground">
                יש לך כבר חשבון?{" "}
                <Link href="/login" className="underline text-primary">
                    התחבר כאן
                </Link>
                </p>
            </div>
        </Card>
    );
}
