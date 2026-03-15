
'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, Languages } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from 'next-intl';
import { translateAnnouncement } from "@/app/actions/translate";
import type { AnnouncementContent } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<{
    en?: AnnouncementContent;
    ar?: AnnouncementContent;
    ru?: AnnouncementContent;
  } | undefined>(undefined);

  const announcementSchema = getAnnouncementSchema(t);

  const channelOptions = [
    { id: 'IN_APP', label: t('channels.IN_APP') },
    { id: 'EMAIL', label: t('channels.EMAIL') },
    { id: 'SMS', label: t('channels.SMS') },
  ];

  const form = useForm<AnnouncementFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      title: "",
      body: "",
      targetAudience: "ALL",
      channels: ["IN_APP", "EMAIL"],
    },
  });

  const titleValue = form.watch("title");
  const bodyValue = form.watch("body");
  const canTranslate = titleValue.length >= 5 && bodyValue.length >= 10;

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const result = await translateAnnouncement(titleValue, bodyValue);
      if (result.success && result.translations) {
        setTranslations(result.translations);
        toast({
          title: t('autoTranslateSuccess'),
          description: t('aiDisclaimer'),
        });
      } else {
        toast({
          title: t('autoTranslateError'),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t('autoTranslateError'),
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const onSubmit = (data: AnnouncementFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcementPayload: any = { ...data };
    if (translations) {
      announcementPayload.translations = translations;
      announcementPayload.translatedByAI = true;
    }
    addAnnouncement(announcementPayload);
    toast({
      title: t('successToast'),
      description: t('successDesc', { title: data.title }),
    });
    form.reset();
    setTranslations(undefined);
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

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canTranslate || isTranslating}
                onClick={handleAutoTranslate}
                className="w-fit"
              >
                {isTranslating ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="me-2 h-4 w-4" />
                )}
                {isTranslating ? t('autoTranslating') : t('autoTranslateBtn')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('aiDisclaimer')}</p>
            </div>

            {translations && (
              <div className="rounded-md border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium">{t('translationPreviewTitle')}</p>
                {(Object.entries(translations) as [string, { title: string; body: string }][]).map(([lang, content]) => (
                  <div key={lang} className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{lang}</p>
                    <p className="text-sm font-medium">{content.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{content.body}</p>
                  </div>
                ))}
              </div>
            )}

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
          <CardFooter className="justify-start">
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
