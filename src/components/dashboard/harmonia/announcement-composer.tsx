
'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Languages, AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from 'next-intl';
import { translateAnnouncement } from "@/app/actions/translate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAnnouncementSchema = (t: any) => z.object({
  title: z.string().min(5, t('errors.titleMin')),
  body: z.string().min(10, t('errors.bodyMin')),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS']),
  channels: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: t('errors.minOneChannel'),
  }),
  messageType: z.enum(['SERVICE', 'MARKETING']).default('SERVICE'),
});

type AnnouncementFormData = z.infer<ReturnType<typeof getAnnouncementSchema>>;

type TranslationStatus = 'idle' | 'loading' | 'done' | 'error';

type LocaleTranslationState = {
  title: string;
  body: string;
  status: TranslationStatus;
  editedByHuman: boolean;
  translatedByAI: boolean;
  aiTitle?: string;
  aiBody?: string;
  error?: string;
};

type TranslationStates = Record<'en' | 'ar' | 'ru', LocaleTranslationState>;

const TARGET_LOCALES: Array<'en' | 'ar' | 'ru'> = ['en', 'ar', 'ru'];

function makeIdleState(): LocaleTranslationState {
  return {
    title: '',
    body: '',
    status: 'idle',
    editedByHuman: false,
    translatedByAI: false,
  };
}

function makeInitialTranslationStates(): TranslationStates {
  return {
    en: makeIdleState(),
    ar: makeIdleState(),
    ru: makeIdleState(),
  };
}

export function AnnouncementComposer() {
  const t = useTranslations('AnnouncementComposer');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();
  const { user, addAnnouncement } = useAuth();

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStates, setTranslationStates] = useState<TranslationStates>(
    makeInitialTranslationStates()
  );

  // Track source snapshot at the time translations were generated (for stale detection)
  const [sourceSnapshotAtTranslation, setSourceSnapshotAtTranslation] = useState<{
    title: string;
    body: string;
  } | null>(null);

  // For publish-without-translations confirmation dialog
  const [showPublishOnlyHebrewDialog, setShowPublishOnlyHebrewDialog] = useState(false);
  // Stores the pending form data when confirmation is needed
  const pendingFormData = useRef<AnnouncementFormData | null>(null);

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
      messageType: "SERVICE",
    },
  });

  const titleValue = form.watch("title");
  const bodyValue = form.watch("body");
  const canTranslate = titleValue.length >= 5 && bodyValue.length >= 10;

  // Stale detection: any locale with status=done and source has since changed
  const hasAnyTranslation = TARGET_LOCALES.some(
    (l) => translationStates[l].status === 'done'
  );
  const isStale =
    hasAnyTranslation &&
    sourceSnapshotAtTranslation !== null &&
    (sourceSnapshotAtTranslation.title !== titleValue ||
      sourceSnapshotAtTranslation.body !== bodyValue);

  // Determine which accordion items are open by default
  // Source locale (he) is always shown, other locales that are done or loading start open
  const defaultAccordionValues = TARGET_LOCALES.filter(
    (l) => translationStates[l].status !== 'idle'
  );

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    // Mark all as loading
    setTranslationStates((prev) => {
      const next = { ...prev };
      for (const l of TARGET_LOCALES) {
        next[l] = { ...next[l], status: 'loading' };
      }
      return next;
    });

    // Snapshot the source at translation time
    setSourceSnapshotAtTranslation({ title: titleValue, body: bodyValue });

    try {
      const result = await translateAnnouncement(titleValue, bodyValue);
      if (result.success && result.translations) {
        setTranslationStates((prev) => {
          const next = { ...prev };
          for (const l of TARGET_LOCALES) {
            const content = result.translations?.[l];
            if (content) {
              next[l] = {
                title: content.title,
                body: content.body,
                status: 'done',
                editedByHuman: false,
                translatedByAI: true,
                aiTitle: content.title,
                aiBody: content.body,
              };
            } else {
              next[l] = {
                ...prev[l],
                status: 'error',
                error: t('translationFailed'),
              };
            }
          }
          return next;
        });
        toast({
          title: t('autoTranslateSuccess'),
          description: t('aiDisclaimer'),
        });
      } else {
        setTranslationStates((prev) => {
          const next = { ...prev };
          for (const l of TARGET_LOCALES) {
            next[l] = {
              ...prev[l],
              status: 'error',
              error: result.error ?? t('translationFailed'),
            };
          }
          return next;
        });
        toast({
          title: t('autoTranslateError'),
          variant: "destructive",
        });
      }
    } catch {
      setTranslationStates((prev) => {
        const next = { ...prev };
        for (const l of TARGET_LOCALES) {
          next[l] = {
            ...prev[l],
            status: 'error',
            error: t('translationFailed'),
          };
        }
        return next;
      });
      toast({
        title: t('autoTranslateError'),
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRetryLocale = async (lang: 'en' | 'ar' | 'ru') => {
    setTranslationStates((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], status: 'loading', error: undefined },
    }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await translateAnnouncement(titleValue, bodyValue, [lang] as any);
      const content = result.translations?.[lang];
      if (result.success && content) {
        setTranslationStates((prev) => ({
          ...prev,
          [lang]: {
            title: content.title,
            body: content.body,
            status: 'done',
            editedByHuman: false,
            translatedByAI: true,
            aiTitle: content.title,
            aiBody: content.body,
          },
        }));
      } else {
        setTranslationStates((prev) => ({
          ...prev,
          [lang]: {
            ...prev[lang],
            status: 'error',
            error: result.error ?? t('translationFailed'),
          },
        }));
      }
    } catch {
      setTranslationStates((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          status: 'error',
          error: t('translationFailed'),
        },
      }));
    }
  };

  const handleRevertLocale = (lang: 'en' | 'ar' | 'ru') => {
    setTranslationStates((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        title: prev[lang].aiTitle ?? prev[lang].title,
        body: prev[lang].aiBody ?? prev[lang].body,
        editedByHuman: false,
      },
    }));
  };

  const handleLocaleFieldChange = (
    lang: 'en' | 'ar' | 'ru',
    field: 'title' | 'body',
    value: string
  ) => {
    setTranslationStates((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
        editedByHuman: true,
      },
    }));
  };

  const doSubmit = (data: AnnouncementFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcementPayload: any = { ...data };
    // Pass messageType for Amendment 40 compliance
    announcementPayload.messageType = data.messageType ?? 'SERVICE';
    const anyAiTranslation = TARGET_LOCALES.some(
      (l) => translationStates[l].translatedByAI
    );

    if (hasAnyTranslation) {
      const translations: Record<string, { title: string; body: string; translatedByAI: boolean; editedByHuman: boolean }> = {};
      for (const l of TARGET_LOCALES) {
        const st = translationStates[l];
        if (st.status === 'done') {
          translations[l] = {
            title: st.title,
            body: st.body,
            translatedByAI: st.translatedByAI,
            editedByHuman: st.editedByHuman,
          };
        }
      }
      announcementPayload.translations = translations;
    }
    if (anyAiTranslation) {
      announcementPayload.translatedByAI = true;
    }

    addAnnouncement(announcementPayload);
    toast({
      title: t('successToast'),
      description: t('successDesc', { title: data.title }),
    });
    form.reset();
    setTranslationStates(makeInitialTranslationStates());
    setSourceSnapshotAtTranslation(null);
    pendingFormData.current = null;
  };

  const onSubmit = (data: AnnouncementFormData) => {
    // If no translations have been attempted or all failed — ask for confirmation
    const anyDone = TARGET_LOCALES.some((l) => translationStates[l].status === 'done');
    if (!anyDone) {
      pendingFormData.current = data;
      setShowPublishOnlyHebrewDialog(true);
      return;
    }
    doSubmit(data);
  };

  const handleConfirmPublishHebrewOnly = () => {
    setShowPublishOnlyHebrewDialog(false);
    if (pendingFormData.current) {
      doSubmit(pendingFormData.current);
    }
  };

  if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
    return <p>{t('noPermission')}</p>;
  }

  const localeDir = (lang: string) =>
    lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';

  const renderLocaleBadge = (lang: 'en' | 'ar' | 'ru') => {
    const st = translationStates[lang];
    if (st.status === 'loading') {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
    }
    if (st.status === 'error') {
      return (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">!</Badge>
      );
    }
    if (st.status === 'done' && st.editedByHuman) {
      return (
        <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
          {t('editedBadge')}
        </Badge>
      );
    }
    if (st.status === 'done' && !st.editedByHuman) {
      return (
        <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
          {t('aiBadge')}
        </Badge>
      );
    }
    return null;
  };

  const localeName = (lang: 'en' | 'ar' | 'ru') => {
    try {
      return t(`localeNames.${lang}`);
    } catch {
      return lang.toUpperCase();
    }
  };

  return (
    <>
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
                <div className="flex items-center gap-2 flex-wrap">
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
                  {isStale && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canTranslate || isTranslating}
                      onClick={handleAutoTranslate}
                      className="w-fit gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t('retranslateAll')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t('aiDisclaimer')}</p>
              </div>

              {/* Stale source warning */}
              {isStale && (
                <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-300 ms-2">
                    {t('staleWarning')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Translation Accordion */}
              <div className="rounded-md border bg-muted/40">
                <div className="px-4 pt-3 pb-1">
                  <p className="text-sm font-medium">{t('translationPreviewTitle')}</p>
                </div>
                {!hasAnyTranslation && (
                  <p className="text-xs text-muted-foreground px-4 pb-3">{t('translationPreviewEmpty')}</p>
                )}
                {hasAnyTranslation && (
                  <Accordion
                    type="multiple"
                    defaultValue={defaultAccordionValues}
                    className="px-2 pb-2"
                  >
                    {TARGET_LOCALES.map((lang) => {
                      const st = translationStates[lang];
                      if (st.status === 'idle') return null;
                      const langDir = localeDir(lang);
                      return (
                        <AccordionItem key={lang} value={lang}>
                          <AccordionTrigger className="text-sm px-2 hover:no-underline">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{localeName(lang)}</span>
                              {renderLocaleBadge(lang)}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-2">
                            {st.status === 'loading' && (
                              <div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{t('autoTranslating')}</span>
                              </div>
                            )}
                            {st.status === 'error' && (
                              <div className="flex items-center gap-3 py-2">
                                <span className="text-xs text-destructive">{st.error ?? t('translationFailed')}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRetryLocale(lang)}
                                  className="text-xs h-7 gap-1.5"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  {t('retryTranslation')}
                                </Button>
                              </div>
                            )}
                            {st.status === 'done' && (
                              <div className="space-y-3" dir={langDir}>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">{t('translationTitle')}</p>
                                  <Input
                                    value={st.title}
                                    onChange={(e) => handleLocaleFieldChange(lang, 'title', e.target.value)}
                                    className="text-sm h-8"
                                    dir={langDir}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">{t('translationBody')}</p>
                                  <Textarea
                                    value={st.body}
                                    onChange={(e) => handleLocaleFieldChange(lang, 'body', e.target.value)}
                                    rows={4}
                                    className="text-sm resize-none"
                                    dir={langDir}
                                  />
                                </div>
                                {st.editedByHuman && (
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleRevertLocale(lang)}
                                    className="h-auto p-0 text-xs gap-1"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    {t('revertToAI')}
                                  </Button>
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>

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

              {/* Amendment 40: Message type selector */}
              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t('formLabels.messageType')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="SERVICE" id="msg-service" />
                          <Label htmlFor="msg-service" className="cursor-pointer font-normal">
                            {t('messageTypes.SERVICE')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="MARKETING" id="msg-marketing" />
                          <Label htmlFor="msg-marketing" className="cursor-pointer font-normal">
                            {t('messageTypes.MARKETING')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('messageType') === 'MARKETING' && (
                <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300 ms-2">
                    {t('marketingWarning')}
                  </AlertDescription>
                </Alert>
              )}
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

      {/* Confirmation dialog for publishing without translations */}
      <AlertDialog open={showPublishOnlyHebrewDialog} onOpenChange={setShowPublishOnlyHebrewDialog}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('publishHebrewOnly')}</AlertDialogTitle>
            <AlertDialogDescription>{t('publishHebrewOnlyConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{/* cancel */}&#x2715;</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublishHebrewOnly}>
              <Send className="me-2 h-4 w-4" />
              {t('submitBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
