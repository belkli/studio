'use client';

import { useAuth } from "@/hooks/use-auth";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { languages, teacherSpecialties } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";

const profileSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים."),
  email: z.string().email("כתובת אימייל לא תקינה."),
  bio: z.string().max(500, "ביוגרפיה יכולה להכיל עד 500 תווים.").optional(),
  specialties: z.array(z.string()).optional(),
  teachingLanguages: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function TeacherProfileEditor() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            bio: user?.bio || '',
            specialties: user?.specialties || [],
            teachingLanguages: user?.teachingLanguages || [],
        },
    });

    if (!user) return null;

    const onSubmit = (data: ProfileFormData) => {
        const updatedUser = { ...user, ...data };
        updateUser(updatedUser);
        toast({
            title: "הפרופיל עודכן בהצלחה!",
        });
    };

    return (
        <Card className="w-full max-w-2xl">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>ערוך את פרטי הפרופיל שלך.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>שם מלא</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>אימייל</FormLabel><FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>ביוגרפיה קצרה</FormLabel><FormControl><Textarea rows={5} placeholder="ספר/י על עצמך, על הניסיון והגישה הפדגוגית שלך..." {...field} /></FormControl><FormMessage /></FormItem> )} />

                        <FormField name="specialties" render={() => (
                             <FormItem>
                                <div className="mb-4"><FormLabel>התמחויות</FormLabel></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {teacherSpecialties.map((item) => (
                                    <FormField key={item.id} name="specialties" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0">
                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                            }} /></FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>

                         <FormField name="teachingLanguages" render={() => (
                             <FormItem>
                                <div className="mb-4"><FormLabel>שפות הוראה</FormLabel></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {languages.map((item) => (
                                    <FormField key={item.id} name="teachingLanguages" render={({ field }) => (
                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0">
                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                            }} /></FormControl>
                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">שמור שינויים</Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}

