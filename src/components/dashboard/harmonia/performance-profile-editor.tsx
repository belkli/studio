'use client';
import { useAuth } from "@/hooks/use-auth";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { languages, performanceGenres } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, PlusCircle, Save, Trash2, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";

const performanceProfileSchema = z.object({
  isOptedIn: z.boolean().default(false),
  headline: z.string().optional(),
  performanceBio: z.string().optional(),
  performanceGenres: z.array(z.string()).optional(),
  canPerformSolo: z.boolean().default(false),
  canPerformChamber: z.boolean().default(false),
  videoLinks: z.array(z.object({
      title: z.string().min(1, "נדרשת כותרת"),
      url: z.string().url("כתובת לא תקינה"),
  })).optional(),
});

type PerformanceProfileFormData = z.infer<typeof performanceProfileSchema>;

export function PerformanceProfileEditor() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();

    const form = useForm<PerformanceProfileFormData>({
        resolver: zodResolver(performanceProfileSchema),
        defaultValues: {
            isOptedIn: user?.performanceProfile?.isOptedIn || false,
            headline: user?.performanceProfile?.headline || '',
            performanceBio: user?.performanceProfile?.performanceBio || '',
            performanceGenres: user?.performanceProfile?.performanceGenres || [],
            canPerformSolo: user?.performanceProfile?.canPerformSolo || false,
            canPerformChamber: user?.performanceProfile?.canPerformChamber || false,
            videoLinks: user?.performanceProfile?.videoLinks || [],
        },
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'videoLinks'
    });

    if (!user || user.role !== 'teacher') return null;

    const onSubmit = (data: PerformanceProfileFormData) => {
        const updatedUser = { 
            ...user, 
            performanceProfile: {
                ...user.performanceProfile,
                ...data
            } 
        };
        updateUser(updatedUser);
        toast({
            title: "פרופיל ההופעות שלך עודכן!",
        });
        form.reset(data);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                             <FormField
                                control={form.control}
                                name="isOptedIn"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                הצטרפות ל-Musicians for Hire
                                            </FormLabel>
                                            <FormDescription>
                                                אפשר למנהלי אירועים למצוא אותך ולהזמין אותך להופעות דרך הפלטפורמה.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardHeader>
                    </Card>

                    {form.watch('isOptedIn') && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>פרופיל ציבורי</CardTitle>
                                    <CardDescription>פרטים אלו יוצגו למזמיני אירועים פוטנציאליים.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Input value={user.name} disabled className="text-lg font-bold" />
                                    </div>
                                     <FormField control={form.control} name="headline" render={({ field }) => ( <FormItem><FormLabel>כותרת מקצועית</FormLabel><FormControl><Input placeholder="לדוגמה: כנר קונצרטים ומוזיקאי קאמרי" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                     <FormField control={form.control} name="performanceBio" render={({ field }) => ( <FormItem><FormLabel>ביוגרפיה להופעות</FormLabel><FormControl><Textarea rows={5} placeholder="ספר על עצמך כמופיע, על סגנונותיך, ועל הניסיון הבימתי שלך." {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle>יכולות ביצוע</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <FormField name="performanceGenres" render={() => (
                                        <FormItem>
                                            <FormLabel>ז'אנרים להופעה</FormLabel>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                                                {performanceGenres.map((item) => (
                                                    <FormField key={item.id} name="performanceGenres" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-x-reverse rounded-md border p-3 bg-muted/30">
                                                             <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => (checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id)))} /></FormControl>
                                                             <FormLabel className="font-normal">{item.label}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </div>
                                        </FormItem>
                                    )}/>
                                    <div className="flex gap-4">
                                        <FormField control={form.control} name="canPerformSolo" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>יכול/ה להופיע כסולן/ית</FormLabel></FormItem>)} />
                                        <FormField control={form.control} name="canPerformChamber" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>יכול/ה להופיע בהרכב קאמרי</FormLabel></FormItem>)} />
                                    </div>
                                </CardContent>
                             </Card>
                            
                             <Card>
                                <CardHeader>
                                    <CardTitle>מדיה</CardTitle>
                                    <CardDescription>הוסף קישורים לסרטוני YouTube או Vimeo המציגים את ביצועיך.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                                            <FormField control={form.control} name={`videoLinks.${index}.title`} render={({ field }) => ( <FormItem className="flex-1"> <FormLabel>כותרת</FormLabel> <FormControl><Input placeholder="לדוגמה: קונצ'רטו של בטהובן" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                            <FormField control={form.control} name={`videoLinks.${index}.url`} render={({ field }) => ( <FormItem className="flex-1"> <FormLabel>קישור</FormLabel> <InputGroup><InputGroupText><Video className="h-4 w-4"/></InputGroupText><FormControl><Input dir="ltr" placeholder="https://youtube.com/watch?v=..." {...field} className="rounded-s-none"/></FormControl></InputGroup> <FormMessage /> </FormItem> )} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={() => append({ title: '', url: '' })}><PlusCircle className="me-2 h-4 w-4" />הוסף קישור</Button>
                                </CardContent>
                             </Card>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={!form.formState.isDirty}>
                                    <Save className="me-2 h-4 w-4" />
                                    שמור פרופיל הופעות
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
