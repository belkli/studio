'use client';
import { useAuth } from "@/hooks/use-auth";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { performanceGenres } from "@/lib/taxonomies";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Save, Trash2, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";
import { useTranslations } from 'next-intl';

const createPerformanceProfileSchema = (t: any) => z.object({
    isOptedIn: z.boolean().default(false),
    headline: z.string().optional(),
    performanceBio: z.string().optional(),
    performanceGenres: z.array(z.string()).optional(),
    canPerformSolo: z.boolean().default(false),
    canPerformChamber: z.boolean().default(false),
    videoLinks: z.array(z.object({
        title: z.string().min(1, t('validationTitleRequired')),
        url: z.string().url(t('validationInvalidUrl')),
    })).optional(),
});

export function PerformanceProfileEditor() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('PerformanceProfileEditor');

    const performanceProfileSchema = createPerformanceProfileSchema(t);
    type PerformanceProfileFormData = z.infer<typeof performanceProfileSchema>;

    const form = useForm<PerformanceProfileFormData>({
        resolver: zodResolver(performanceProfileSchema) as any,
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
        name: 'videoLinks' as never
    });

    if (!user || user.role !== 'teacher') return null;

    const onSubmit = (data: PerformanceProfileFormData) => {
        const updatedUser = {
            ...user,
            performanceProfile: {
                ...user.performanceProfile,
                ...(data as any),
            }
        };
        updateUser(updatedUser as any);
        toast({
            title: t('profileUpdated'),
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
                                                {t('optInTitle')}
                                            </FormLabel>
                                            <FormDescription>
                                                {t('optInDesc')}
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

                    {/* eslint-disable-next-line react-hooks/incompatible-library */}
                    {form.watch('isOptedIn') && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('publicProfileTitle')}</CardTitle>
                                    <CardDescription>{t('publicProfileDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Input value={user.name} disabled className="text-lg font-bold" />
                                    </div>
                                    <FormField control={form.control} name="headline" render={({ field }) => (<FormItem><FormLabel>{t('headlineLabel')}</FormLabel><FormControl><Input placeholder={t('headlinePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="performanceBio" render={({ field }) => (<FormItem><FormLabel>{t('bioLabel')}</FormLabel><FormControl><Textarea rows={5} placeholder={t('bioPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('capabilitiesTitle')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField name="performanceGenres" render={() => (
                                        <FormItem>
                                            <FormLabel>{t('genresLabel')}</FormLabel>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                                                {performanceGenres.map((item) => (
                                                    <FormField key={item.id} name="performanceGenres" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-x-reverse rounded-md border p-3 bg-muted/30">
                                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => (checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value: string) => value !== item.id)))} /></FormControl>
                                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </div>
                                        </FormItem>
                                    )} />
                                    <div className="flex gap-4">
                                        <FormField control={form.control} name="canPerformSolo" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t('soloToggle')}</FormLabel></FormItem>)} />
                                        <FormField control={form.control} name="canPerformChamber" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t('chamberToggle')}</FormLabel></FormItem>)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('mediaTitle')}</CardTitle>
                                    <CardDescription>{t('mediaDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                                            <FormField control={form.control} name={`videoLinks.${index}.title` as never} render={({ field }) => (<FormItem className="flex-1"> <FormLabel>{t('videoTitleLabel')}</FormLabel> <FormControl><Input placeholder={t('videoTitlePlaceholder')} {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                                            <FormField control={form.control} name={`videoLinks.${index}.url` as never} render={({ field }) => (<FormItem className="flex-1"> <FormLabel>{t('videoUrlLabel')}</FormLabel> <InputGroup><InputGroupText><Video className="h-4 w-4" /></InputGroupText><FormControl><Input dir="ltr" placeholder="https://youtube.com/watch?v=..." {...field} className="rounded-s-none" /></FormControl></InputGroup> <FormMessage /> </FormItem>)} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={() => append({ title: '', url: '' } as never)}><PlusCircle className="me-2 h-4 w-4" />{t('addLinkBtn')}</Button>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={!form.formState.isDirty}>
                                    <Save className="me-2 h-4 w-4" />
                                    {t('saveBtn')}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </form>
        </FormProvider>
    );
}
