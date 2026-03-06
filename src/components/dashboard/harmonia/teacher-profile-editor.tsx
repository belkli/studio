'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { languages, teacherSpecialties } from '@/lib/taxonomies';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const getProfileSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(2, t('validation.nameMin')),
    email: z.string().email(t('validation.emailInvalid')),
    bioHe: z.string().max(2000, t('validation.bioMax')).optional(),
    bioEn: z.string().max(2000, t('validation.bioMax')).optional(),
    videoUrl: z.string().optional(),
    availableForNewStudents: z.boolean().optional(),
    educationText: z.string().optional(),
    performanceCreditsText: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    teachingLanguages: z.array(z.string()).optional(),
  });

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

export function TeacherProfileEditor() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('TeacherProfile');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bioHe: user?.bio || '',
      bioEn: user?.translations?.en?.bio || '',
      videoUrl: user?.videoUrl || '',
      availableForNewStudents: user?.availableForNewStudents ?? true,
      educationText: (user?.education || []).join('\n'),
      performanceCreditsText: (user?.performanceCredits || []).join('\n'),
      specialties: user?.specialties || [],
      teachingLanguages: user?.teachingLanguages || [],
    },
  });

  if (!user) return null;

  const onSubmit = (data: ProfileFormData) => {
    setIsSaving(true);

    const education = (data.educationText || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    const performanceCredits = (data.performanceCreditsText || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    updateUser({
      ...user,
      name: data.name,
      email: data.email,
      bio: data.bioHe || '',
      videoUrl: data.videoUrl || undefined,
      availableForNewStudents: data.availableForNewStudents ?? true,
      education,
      performanceCredits,
      specialties: (data.specialties || []) as any,
      teachingLanguages: (data.teachingLanguages || []) as any,
      translations: {
        ...(user.translations || {}),
        en: {
          ...(user.translations?.en || {}),
          bio: data.bioEn || '',
        },
      },
    });

    toast({ title: t('saved') });
    setIsSaving(false);
  };

  return (
    <Card className="w-full max-w-3xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="items-center text-center">
            <Avatar className="mb-4 h-24 w-24">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t('basicInfo')}</TabsTrigger>
                <TabsTrigger value="bio">{t('bio')}</TabsTrigger>
                <TabsTrigger value="education">{t('education')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('fullName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('email')}</FormLabel>
                        <FormControl>
                          <Input type="email" dir="ltr" className="text-start" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialties"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('specialties')}</FormLabel>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {teacherSpecialties.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="specialties"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 rounded-md border p-2">
                                <FormControl>
                                  <Checkbox
                                    checked={(field.value || []).includes(item.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange((field.value || []).filter((value: string) => value !== item.id))
                                    }
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teachingLanguages"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('teachingLanguages')}</FormLabel>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {languages.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="teachingLanguages"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 rounded-md border p-2">
                                <FormControl>
                                  <Checkbox
                                    checked={(field.value || []).includes(item.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange((field.value || []).filter((value: string) => value !== item.id))
                                    }
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="bio" className="mt-6 space-y-5">
                <FormField
                  control={form.control}
                  name="bioHe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bioHe')}</FormLabel>
                      <FormControl>
                        <Textarea rows={6} dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bioEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bioEn')}</FormLabel>
                      <FormControl>
                        <Textarea rows={6} dir="ltr" className="text-start" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('videoUrl')}</FormLabel>
                      <FormControl>
                        <Input dir="ltr" className="text-start" placeholder="https://youtube.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableForNewStudents"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>{t('availableForNewStudents')}</FormLabel>
                      <FormControl>
                        <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="education" className="mt-6 space-y-5">
                <FormField
                  control={form.control}
                  name="educationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('education')}</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder={t('educationPlaceholder')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="performanceCreditsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('performanceCredits')}</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder={t('performanceCreditsPlaceholder')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? t('saving') : t('saveChanges')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}

