'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import type { EventProduction } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { generateAiEventPoster } from '@/app/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const schema = z.object({
  title: z.object({ he: z.string().min(1), en: z.string().min(1) }),
  description: z.object({ he: z.string().optional(), en: z.string().optional() }),
  eventDate: z.string().min(1),
  startTime: z.string().min(1),
  tagsText: z.string().optional(),
  visibilityStatus: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
  venue: z.object({
    name: z.object({ he: z.string().min(1), en: z.string().min(1) }),
    address: z.string().optional(),
    googleMapsUrl: z.string().url().optional().or(z.literal('')),
    capacity: z.coerce.number().min(0),
    isOnline: z.boolean().default(false),
    streamUrl: z.string().url().optional().or(z.literal('')),
  }),
  isFree: z.boolean().default(true),
  ticketPrices: z.array(
    z.object({
      id: z.string().min(1),
      name: z.object({ he: z.string().min(1), en: z.string().min(1) }),
      priceILS: z.coerce.number().min(0),
      availableCount: z.coerce.number().min(0),
      description: z.string().optional(),
    })
  ),
  posterUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function EventEditForm({ event }: { event: EventProduction }) {
  const { updateEvent } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('Events');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: event.title || { he: event.name, en: event.name },
      description: event.description || { he: '', en: '' },
      eventDate: event.eventDate,
      startTime: event.startTime,
      tagsText: (event.tags || []).join(', '),
      visibilityStatus: event.visibilityStatus || 'draft',
      venue: {
        name: event.venueDetails?.name || { he: event.venue, en: event.venue },
        address: event.venueDetails?.address || '',
        googleMapsUrl: event.venueDetails?.googleMapsUrl || '',
        capacity: event.venueDetails?.capacity || event.totalSeats || 0,
        isOnline: event.venueDetails?.isOnline || false,
        streamUrl: event.venueDetails?.streamUrl || '',
      },
      isFree: event.isFree ?? ((event.ticketPrice || 0) <= 0),
      ticketPrices: event.ticketPrices || [],
      posterUrl: event.posterUrl || '',
    },
  });

  const ticketPrices = useFieldArray<FormData, 'ticketPrices'>({ control: form.control, name: 'ticketPrices' });

  const onSubmit = (data: FormData) => {
    const tags = (data.tagsText || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    const nextEvent: EventProduction = {
      ...event,
      name: data.title.he,
      title: { ...event.title, he: data.title.he, en: data.title.en },
      description: { ...event.description, he: data.description.he || '', en: data.description.en || '' },
      eventDate: data.eventDate,
      startTime: data.startTime,
      venue: data.venue.name.he,
      venueDetails: {
        name: { ...data.venue.name },
        address: data.venue.address || '',
        googleMapsUrl: data.venue.googleMapsUrl || undefined,
        capacity: data.venue.capacity,
        isOnline: data.venue.isOnline,
        streamUrl: data.venue.streamUrl || undefined,
      },
      totalSeats: data.venue.capacity,
      isFree: data.isFree,
      ticketPrices: data.isFree ? [] : data.ticketPrices,
      ticketPrice: data.isFree ? 0 : (data.ticketPrices[0]?.priceILS || 0),
      tags,
      posterUrl: data.posterUrl || undefined,
      visibilityStatus: data.visibilityStatus,
      status: data.visibilityStatus === 'completed' ? 'COMPLETED' : data.visibilityStatus === 'cancelled' ? 'CLOSED' : data.visibilityStatus === 'published' ? 'OPEN_REGISTRATION' : 'PLANNING',
      publishedAt: data.visibilityStatus === 'published' ? (event.publishedAt || new Date().toISOString()) : event.publishedAt,
      isPublic: data.visibilityStatus === 'published',
    };

    updateEvent(nextEvent);
    toast({ title: t('eventSaved') });
    router.push(`/${locale}/dashboard/events/${event.id}`);
  };

  const handleGeneratePoster = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAiEventPoster({
        id: event.id,
        title: {
          he: form.getValues('title.he'),
          en: form.getValues('title.en'),
          ru: event.title?.ru,
          ar: event.title?.ar,
        },
        eventDate: form.getValues('eventDate'),
        startTime: form.getValues('startTime'),
        venueName: form.getValues('venue.name.en'),
      });
      form.setValue('posterUrl', result.posterUrl, { shouldDirty: true });
      toast({ title: t('posterGenerated') });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('editEventDetails')}</CardTitle>
        <CardDescription>{t('editEventDetailsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" dir={isRtl ? 'rtl' : 'ltr'}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('tabBasic')}</TabsTrigger>
                <TabsTrigger value="venue">{t('tabVenue')}</TabsTrigger>
                <TabsTrigger value="tickets">{t('tabTickets')}</TabsTrigger>
                <TabsTrigger value="poster">{t('tabPoster')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField control={form.control} name="title.he" render={({ field }) => (
                  <FormItem><FormLabel>{t('titleHe')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="title.en" render={({ field }) => (
                  <FormItem><FormLabel>{t('titleEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description.he" render={({ field }) => (
                  <FormItem><FormLabel>{t('descriptionHe')}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="eventDate" render={({ field }) => (
                    <FormItem><FormLabel>{t('eventDate')}</FormLabel><FormControl><Input type="date" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>{t('eventTime')}</FormLabel><FormControl><Input type="time" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="tagsText" render={({ field }) => (
                  <FormItem><FormLabel>{t('tags')}</FormLabel><FormControl><Input placeholder={t('tagsPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="visibilityStatus" render={({ field }) => (
                  <FormItem><FormLabel>{t('status')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">{t('statusDraft')}</SelectItem><SelectItem value="published">{t('statusPublished')}</SelectItem><SelectItem value="cancelled">{t('statusCancelled')}</SelectItem><SelectItem value="completed">{t('statusCompleted')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="venue" className="space-y-4">
                <FormField control={form.control} name="venue.name.he" render={({ field }) => (
                  <FormItem><FormLabel>{t('venueName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="venue.address" render={({ field }) => (
                  <FormItem><FormLabel>{t('venueAddress')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="venue.googleMapsUrl" render={({ field }) => (
                  <FormItem><FormLabel>{t('googleMapsUrl')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="venue.capacity" render={({ field }) => (
                  <FormItem><FormLabel>{t('capacity')}</FormLabel><FormControl><Input type="number" dir="ltr" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="venue.isOnline" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3"><FormLabel>{t('isOnline')}</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                {form.watch('venue.isOnline') && (
                  <FormField control={form.control} name="venue.streamUrl" render={({ field }) => (
                    <FormItem><FormLabel>{t('streamUrl')}</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-md border p-3"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>{t('isFreeEvent')}</FormLabel></FormItem>
                )} />
                {!form.watch('isFree') && (
                  <div className="space-y-3">
                    {ticketPrices.fields.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_120px_auto] gap-2 items-end border rounded-md p-3">
                        <FormField control={form.control} name={`ticketPrices.${index}.name.he`} render={({ field }) => (
                          <FormItem><FormLabel>{t('tierName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`ticketPrices.${index}.description`} render={({ field }) => (
                          <FormItem><FormLabel>{t('tierDesc')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`ticketPrices.${index}.priceILS`} render={({ field }) => (
                          <FormItem><FormLabel>{t('tierPrice')}</FormLabel><FormControl><Input type="number" dir="ltr" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name={`ticketPrices.${index}.availableCount`} render={({ field }) => (
                          <FormItem><FormLabel>{t('tierAvailable')}</FormLabel><FormControl><Input type="number" dir="ltr" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => ticketPrices.remove(index)} aria-label={t('removeTier')}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => ticketPrices.append({ id: `tier-${Date.now()}`, name: { he: '', en: '' }, priceILS: 0, availableCount: 0, description: '' })}>
                      <Plus className="me-2 h-4 w-4" />
                      {t('addTier')}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="poster" className="space-y-4">
                {form.watch('posterUrl') && (
                  <Image src={form.watch('posterUrl') || ''} alt="Poster" width={400} height={256} className="rounded-lg max-h-64 object-contain" />
                )}
                <Button type="button" onClick={handleGeneratePoster} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
                  {t('generatePoster')}
                </Button>
                <p className="text-sm text-muted-foreground">{t('posterHint')}</p>
                <FormField control={form.control} name="posterUrl" render={({ field }) => (
                  <FormItem><FormLabel>{t('uploadPoster')}</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button type="submit">{t('saveEvent')}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
