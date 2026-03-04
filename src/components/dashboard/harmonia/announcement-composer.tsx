
'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from 'next-intl';

const getAnnouncementSchema = (t: any) => z.object({
  title: z.string().min(5, t('errors.titleMin')),
  body: z.string().min(10, t('errors.bodyMin')),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS']),
  channels: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: t('errors.minOneChannel'),
  }),
});

type AnnouncementFormData = z.infer<ReturnType<typeof getAnnouncementSchema>>;

export function AnnouncementComposer() {
  const t = useTranslations('AnnouncementComposer');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();
  const { user, addAnnouncement } = useAuth();

  const announcementSchema = getAnnouncementSchema(t);

  const channelOptions = [
    { id: 'IN_APP', label: t('channels.IN_APP') },
    { id: 'EMAIL', label: t('channels.EMAIL') },
    { id: 'SMS', label: t('channels.SMS') },
  ];

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      title: "",
      body: "",
      targetAudience: "ALL",
      channels: ["IN_APP", "EMAIL"],
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    addAnnouncement(data as any);
    toast({
      title: t('successToast'),
      description: t('successDesc', { title: data.title }),
    });
    form.reset();
  };

  if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
    return <p>{t('noPermission')}</p>;
  }

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="text-start">
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-start">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formLabels.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('placeholders.title')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formLabels.body')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('placeholders.body')} rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('formLabels.targetAudience')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholders.targetAudience')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">{t('audiences.ALL')}</SelectItem>
                        <SelectItem value="STUDENTS">{t('audiences.STUDENTS')}</SelectItem>
                        <SelectItem value="PARENTS">{t('audiences.PARENTS')}</SelectItem>
                        <SelectItem value="TEACHERS">{t('audiences.TEACHERS')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channels"
                render={() => (
                  <FormItem>
                    <FormLabel>{t('formLabels.channels')}</FormLabel>
                    <div className="space-y-3 pt-2">
                      {channelOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="channels"
                          render={({ field }) => {
                            return (
                              <FormItem key={item.id} className="flex items-center gap-2.5 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    id={item.id}
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(field.value?.filter((value) => value !== item.id));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel htmlFor={item.id} className="cursor-pointer leading-none font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className={`${isRtl ? 'justify-end' : 'justify-start'}`}>
            <Button type="submit">
              <Send className="me-2 h-4 w-4" />
              {t('submitBtn')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}

