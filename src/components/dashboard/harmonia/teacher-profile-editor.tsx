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
import { TranslatedFieldInput } from "./translated-field-input";
import { Sparkles } from "lucide-react";
import { translateUserProfile } from "@/app/actions/translate";
import { computeUserSourceHash } from "@/lib/utils/translation-hash";

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
    const [isTranslating, setIsTranslating] = useState(false);

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

    const onSubmit = async (data: ProfileFormData) => {
        let updatedUser = { ...user, ...data };

        // Auto-translate if bio changed
        const currentHash = computeUserSourceHash(updatedUser as any);
        const isStale = currentHash !== user.translationMeta?.sourceHash;

        if (isStale && data.bio) {
            setIsTranslating(true);
            toast({
                title: "מעדכן תרגומים...",
                description: "ה-AI מעדכן את הביוגרפיה שלך בשפות נוספות.",
            });

            const result = await translateUserProfile(
                updatedUser as any,
                ['en', 'ar', 'ru'],
                user.translations,
                user.translationMeta?.overrides
            );

            if (result.success && result.translations && result.meta) {
                updatedUser = {
                    ...updatedUser,
                    translations: result.translations,
                    translationMeta: {
                        ...result.meta,
                        overrides: user.translationMeta?.overrides
                    }
                } as any;
            }
            setIsTranslating(false);
        }

        updateUser(updatedUser as any);

        toast({
            title: "הפרופיל עודכן בהצלחה!",
        });
    };

    const handleTranslationChange = (field: string, locale: string, value: string) => {
        if (!user) return;

        const currentTranslations = user.translations || {};
        const localeData = (currentTranslations as any)[locale] || {};
        const updatedTranslations = {
            ...currentTranslations,
            [locale]: { ...localeData, [field]: value }
        };

        const currentOverrides = user.translationMeta?.overrides || {};
        const localeOverrides = [...(currentOverrides[locale] || [])];
        if (!localeOverrides.includes(field)) {
            localeOverrides.push(field);
        }

        updateUser({
            ...user,
            translations: updatedTranslations,
            translationMeta: {
                ...user.translationMeta,
                overrides: {
                    ...currentOverrides,
                    [locale]: localeOverrides
                },
                translatedBy: 'HUMAN'
            }
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
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>שם מלא</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>אימייל</FormLabel><FormControl><Input type="email" dir="ltr" className="text-left" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="bio" render={({ field }) => (
                            <FormItem>
                                <TranslatedFieldInput
                                    label="ביוגרפיה קצרה"
                                    value={field.value || ''}
                                    translations={{
                                        en: user.translations?.en?.bio,
                                        ar: user.translations?.ar?.bio,
                                        ru: user.translations?.ru?.bio,
                                    }}
                                    fieldKey="bio"
                                    isTextArea
                                    onSourceChange={field.onChange}
                                    onTranslationChange={(loc, val) => handleTranslationChange('bio', loc, val)}
                                    isStale={computeUserSourceHash({ ...user, bio: field.value } as any) !== user.translationMeta?.sourceHash}
                                    isTranslating={isTranslating}
                                    overriddenLocales={Object.entries(user.translationMeta?.overrides || {})
                                        .filter(([_, fields]) => fields.includes('bio'))
                                        .map(([loc]) => loc)}
                                />
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField name="specialties" render={() => (
                            <FormItem>
                                <div className="mb-4"><FormLabel>התמחויות</FormLabel></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {teacherSpecialties.map((item) => (
                                        <FormField key={item.id} name="specialties" render={({ field }) => (
                                            <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0">
                                                <FormControl><Checkbox checked={(field.value || []).includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange((field.value || []).filter((value: string) => value !== item.id))
                                                }} /></FormControl>
                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                            </FormItem>
                                        )} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField name="teachingLanguages" render={() => (
                            <FormItem>
                                <div className="mb-4"><FormLabel>שפות הוראה</FormLabel></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {languages.map((item) => (
                                        <FormField key={item.id} name="teachingLanguages" render={({ field }) => (
                                            <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-x-reverse space-y-0">
                                                <FormControl><Checkbox checked={(field.value || []).includes(item.id)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange((field.value || []).filter((value: string) => value !== item.id))
                                                }} /></FormControl>
                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                            </FormItem>
                                        )} />
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isTranslating}>
                            {isTranslating ? "מעדכן תרגומים..." : "שמור שינויים"}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}
