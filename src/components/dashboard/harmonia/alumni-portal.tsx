/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';

import type { Masterclass } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { tenantUsers } from '@/lib/tenant-filter';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Music, MapPin, Users, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2),
  graduationYear: z.coerce.number().min(1900),
  primaryInstrument: z.string().min(2),
  currentOccupation: z.string().optional(),
  bioHe: z.string().optional(),
  bioEn: z.string().optional(),
  bioAr: z.string().optional(),
  bioRu: z.string().optional(),
  profilePhotoUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean(),
  availableForMasterClasses: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const masterClassSchema = z.object({
  titleHe: z.string().min(2),
  titleEn: z.string().min(2),
  titleAr: z.string().optional(),
  titleRu: z.string().optional(),
  descriptionHe: z.string().min(2),
  descriptionEn: z.string().min(2),
  descriptionAr: z.string().optional(),
  descriptionRu: z.string().optional(),
  instrument: z.string().min(2),
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationMinutes: z.coerce.number().min(30),
  location: z.string().min(2),
  maxParticipants: z.coerce.number().min(1),
  includedInPackage: z.boolean(),
  priceILS: z.coerce.number().min(0).optional(),
});

type MasterClassValues = z.infer<typeof masterClassSchema>;

export function AlumniPortal() {
  const t = useTranslations('AlumniPage');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();

  const {
    user,
    users,
    alumni,
    masterClasses,
    masterClassAllowances,
    graduateStudent,
    upsertAlumniProfile,
    createMasterClass,
    publishMasterClass,
    registerToMasterClass,
  } = useAuth();

  const role = user?.role;
  const isAdmin = role === 'site_admin' || role === 'conservatorium_admin';

  const [yearFilter, setYearFilter] = useState('all');
  const [instrumentFilter, setInstrumentFilter] = useState('all');
  const [graduateStudentId, setGraduateStudentId] = useState('');
  const [graduateYear, setGraduateYear] = useState(String(new Date().getFullYear()));

  const ownProfile = useMemo(() => {
    if (!user) return null;
    return alumni.find((item) => item.userId === user.id) || null;
  }, [alumni, user]);

  const canCreateMasterClass = isAdmin || role === 'teacher' || Boolean(ownProfile?.availableForMasterClasses);

  const publicAlumni = useMemo(() => {
    return alumni.filter((item) => {
      if (!item.isPublic) return false;
      if (yearFilter !== 'all' && String(item.graduationYear) !== yearFilter) return false;
      if (instrumentFilter !== 'all' && item.primaryInstrument !== instrumentFilter) return false;
      return true;
    });
  }, [instrumentFilter, alumni, yearFilter]);

  const reviewQueue = useMemo(() => {
    if (!user) return [] as Masterclass[];
    return masterClasses.filter((item) => item.conservatoriumId === user.conservatoriumId && item.status === 'draft');
  }, [masterClasses, user]);

  const publishedMasterClasses = useMemo(() => {
    if (!user) return [] as Masterclass[];
    return masterClasses.filter((item) => item.conservatoriumId === user.conservatoriumId && item.status === 'published');
  }, [masterClasses, user]);

  const allowance = useMemo(() => {
    if (!user || role !== 'student') return null;
    return masterClassAllowances.find((item) => item.studentId === user.id && item.conservatoriumId === user.conservatoriumId) || null;
  }, [masterClassAllowances, role, user]);

  const gradCandidates = useMemo(() => {
    if (!user) return [];
    return tenantUsers(users, user, 'student');
  }, [user, users]);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as any,
    values: {
      displayName: ownProfile?.displayName || user?.name || '',
      graduationYear: ownProfile?.graduationYear || new Date().getFullYear(),
      primaryInstrument: ownProfile?.primaryInstrument || user?.instruments?.[0]?.instrument || '',
      currentOccupation: ownProfile?.currentOccupation || '',
      bioHe: ownProfile?.bio?.he || '',
      bioEn: ownProfile?.bio?.en || '',
      bioAr: ownProfile?.bio?.ar || '',
      bioRu: ownProfile?.bio?.ru || '',
      profilePhotoUrl: ownProfile?.profilePhotoUrl || '',
      isPublic: ownProfile?.isPublic || false,
      availableForMasterClasses: ownProfile?.availableForMasterClasses || false,
    },
  });

  const masterClassForm = useForm<MasterClassValues>({
    resolver: zodResolver(masterClassSchema) as any,
    defaultValues: {
      titleHe: '',
      titleEn: '',
      titleAr: '',
      titleRu: '',
      descriptionHe: '',
      descriptionEn: '',
      descriptionAr: '',
      descriptionRu: '',
      instrument: user?.instruments?.[0]?.instrument || '',
      date: '',
      startTime: '18:00',
      durationMinutes: 90,
      location: '',
      maxParticipants: 12,
      includedInPackage: true,
      priceILS: 0,
    },
  });

  const saveProfile = (values: ProfileValues) => {
    if (!user) return;
    upsertAlumniProfile({
      userId: user.id,
      conservatoriumId: user.conservatoriumId,
      displayName: values.displayName,
      graduationYear: values.graduationYear,
      primaryInstrument: values.primaryInstrument,
      currentOccupation: values.currentOccupation,
      bio: {
        he: values.bioHe || undefined,
        en: values.bioEn || undefined,
        ar: values.bioAr || undefined,
        ru: values.bioRu || undefined,
      },
      profilePhotoUrl: values.profilePhotoUrl || undefined,
      isPublic: values.isPublic,
      availableForMasterClasses: values.availableForMasterClasses,
    });
    toast({ title: commonT('success'), description: t('profileSaved') });
  };

  const submitMasterClass = (values: MasterClassValues) => {
    createMasterClass({
      title: {
        he: values.titleHe,
        en: values.titleEn,
        ar: values.titleAr || undefined,
        ru: values.titleRu || undefined,
      },
      description: {
        he: values.descriptionHe,
        en: values.descriptionEn,
        ar: values.descriptionAr || undefined,
        ru: values.descriptionRu || undefined,
      },
      instrument: values.instrument,
      date: values.date,
      startTime: values.startTime,
      durationMinutes: values.durationMinutes,
      location: values.location,
      maxParticipants: values.maxParticipants,
      includedInPackage: values.includedInPackage,
      priceILS: values.includedInPackage ? undefined : values.priceILS,
    });
    toast({ title: commonT('success'), description: t('masterClassCreated') });
    masterClassForm.reset();
  };

  const onGraduate = () => {
    if (!graduateStudentId) return;
    graduateStudent(graduateStudentId, Number(graduateYear));
    toast({ title: commonT('success'), description: t('graduatedCreated') });
  };

  const tabs = [
    { value: 'directory', label: t('directoryTab') },
    { value: 'profile', label: t('profileTab') },
    { value: 'masterClasses', label: t('masterClassesTab') },
    { value: 'review', label: t('reviewTab') },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const localizedTitle = (obj: { he: string; en: string; ru?: string; ar?: string }) =>
    (obj as Record<string, string>)[locale] || obj.en;

  const isRegistered = (mc: Masterclass) =>
    user ? mc.registrations.some((r) => r.studentId === user.id) : false;

  const dir = isRtl ? 'rtl' : 'ltr';

  return (
    <div className='space-y-6' dir={dir}>
      {/* Admin: pending approvals surfaced at the top */}
      {isAdmin && reviewQueue.length > 0 && (
        <Card className='border-amber-200 bg-amber-50/50'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-amber-600' />
              <CardTitle className='text-base'>{t('reviewQueueTitle')}</CardTitle>
            </div>
            <CardDescription>{t('reviewQueueDesc')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {reviewQueue.map((item) => (
              <div key={item.id} className='flex flex-col gap-2 rounded-md border border-amber-200 bg-white p-3 md:flex-row md:items-center md:justify-between'>
                <div className='space-y-1'>
                  <p className='font-medium text-start'>{localizedTitle(item.title)}</p>
                  <p className='text-sm text-muted-foreground'>
                    <span>{item.instructor.displayName}</span>
                    <span aria-hidden='true' className='mx-1'>&middot;</span>
                    <span>{item.instrument}</span>
                  </p>
                </div>
                <Button type='button' size='sm' onClick={() => publishMasterClass(item.id)}>{t('publishButton')}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue='directory' dir={dir} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ── Directory ──────────────────────────────────────────────── */}
        <TabsContent value='directory' className='space-y-4'>
          <Card>
            <CardHeader>
              <h2 className='text-lg font-semibold text-start'>{t('directoryTitle')}</h2>
              <CardDescription>{t('directorySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-2'>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger><SelectValue placeholder={t('filterYear')} /></SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value='all'>{t('allYears')}</SelectItem>
                    {Array.from(new Set(alumni.map((item) => String(item.graduationYear)))).sort().map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                  <SelectTrigger><SelectValue placeholder={t('filterInstrument')} /></SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value='all'>{t('allInstruments')}</SelectItem>
                    {Array.from(new Set(alumni.map((item) => item.primaryInstrument))).sort().map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {publicAlumni.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <GraduationCap className='h-12 w-12 text-muted-foreground/40' />
                  <p className='mt-3 text-sm font-medium text-muted-foreground'>{t('noPublicAlumni')}</p>
                  {isAdmin && (
                    <p className='mt-1 text-xs text-muted-foreground'>{t('graduateDesc')}</p>
                  )}
                </div>
              ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  {publicAlumni.map((item) => {
                    const bio = (item.bio as Record<string, string | undefined>)[locale] || item.bio.en;
                    return (
                      <Card key={item.id} className='overflow-hidden'>
                        <CardContent className='flex gap-3 p-4'>
                          <Avatar className='h-12 w-12 shrink-0'>
                            {item.profilePhotoUrl && <AvatarImage src={item.profilePhotoUrl} alt={item.displayName} />}
                            <AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
                              {getInitials(item.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 flex-1 space-y-1'>
                            <div className='flex items-start justify-between gap-2'>
                              <p className='font-semibold text-start leading-tight'>{item.displayName}</p>
                              <span className='shrink-0 text-xs text-muted-foreground' dir='ltr'>{item.graduationYear}</span>
                            </div>
                            <p className='flex items-center gap-1 text-sm text-muted-foreground'>
                              <Music className='h-3.5 w-3.5 shrink-0' />
                              <span>{item.primaryInstrument}</span>
                            </p>
                            {item.currentOccupation && !bio && (
                              <p className='text-sm text-muted-foreground'>{item.currentOccupation}</p>
                            )}
                            {item.availableForMasterClasses && (
                              <Badge variant='secondary' className='bg-green-100 text-green-800 text-xs'>{t('availableForMasterClasses')}</Badge>
                            )}
                            {bio && (
                              <p className='text-xs text-muted-foreground line-clamp-2'>{bio}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Profile ────────────────────────────────────────────────── */}
        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <h2 className='text-lg font-semibold text-start'>{t('profileTitle')}</h2>
              <CardDescription>{t('profileSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(saveProfile as any)} className='space-y-4' dir={dir}>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='displayName' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('displayName')}</FormLabel>
                        <FormControl><Input dir={dir} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='graduationYear' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('graduationYear')}</FormLabel>
                        <FormControl><Input type='number' dir='ltr' className='text-start' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='primaryInstrument' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('primaryInstrument')}</FormLabel>
                        <FormControl><Input dir={dir} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='currentOccupation' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('currentOccupation')}</FormLabel>
                        <FormControl><Input dir={dir} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Bio fields — each has a fixed dir matching the language */}
                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='bioHe' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bioHe')}</FormLabel>
                        <FormControl><Textarea dir='rtl' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='bioEn' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bioEn')}</FormLabel>
                        <FormControl><Textarea dir='ltr' className='text-start' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='bioAr' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bioAr')}</FormLabel>
                        <FormControl><Textarea dir='rtl' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='bioRu' render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bioRu')}</FormLabel>
                        <FormControl><Textarea dir='ltr' className='text-start' {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={profileForm.control as any} name='profilePhotoUrl' render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profilePhotoUrl')}</FormLabel>
                      <FormControl><Input dir='ltr' className='text-start' {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='isPublic' render={({ field }) => (
                      <FormItem className='flex items-center gap-2 rounded-md border p-3'>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
                        <FormLabel>{t('isPublic')}</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='availableForMasterClasses' render={({ field }) => (
                      <FormItem className='flex items-center gap-2 rounded-md border p-3'>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
                        <FormLabel>{t('availableForMasterClasses')}</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className='flex justify-end'>
                    <Button type='submit'>{commonT('save')}</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Masterclasses ──────────────────────────────────────────── */}
        <TabsContent value='masterClasses' className='space-y-4'>
          {canCreateMasterClass && (
            <Card>
              <CardHeader>
                <h2 className='text-lg font-semibold text-start'>{t('createMasterClass')}</h2>
                <CardDescription>{t('createMasterClassDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...masterClassForm}>
                  <form onSubmit={masterClassForm.handleSubmit(submitMasterClass as any)} className='space-y-4' dir={dir}>
                    {/* Titles */}
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='titleHe' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('titleHe')}</FormLabel>
                          <FormControl><Input dir='rtl' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='titleEn' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('titleEn')}</FormLabel>
                          <FormControl><Input dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='titleAr' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('titleAr')}</FormLabel>
                          <FormControl><Input dir='rtl' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='titleRu' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('titleRu')}</FormLabel>
                          <FormControl><Input dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {/* Descriptions */}
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='descriptionHe' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('descriptionHe')}</FormLabel>
                          <FormControl><Textarea dir='rtl' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='descriptionEn' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('descriptionEn')}</FormLabel>
                          <FormControl><Textarea dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='descriptionAr' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('descriptionAr')}</FormLabel>
                          <FormControl><Textarea dir='rtl' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='descriptionRu' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('descriptionRu')}</FormLabel>
                          <FormControl><Textarea dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {/* Logistics */}
                    <div className='grid gap-3 md:grid-cols-3'>
                      <FormField control={masterClassForm.control as any} name='instrument' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('instrument')}</FormLabel>
                          <FormControl><Input dir={dir} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='date' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('date')}</FormLabel>
                          <FormControl><Input type='date' dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='startTime' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('startTime')}</FormLabel>
                          <FormControl><Input type='time' dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='grid gap-3 md:grid-cols-3'>
                      <FormField control={masterClassForm.control as any} name='durationMinutes' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('duration')}</FormLabel>
                          <FormControl><Input type='number' dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='maxParticipants' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('maxParticipants')}</FormLabel>
                          <FormControl><Input type='number' dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='location' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('location')}</FormLabel>
                          <FormControl><Input dir={dir} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='includedInPackage' render={({ field }) => (
                        <FormItem className='flex items-center gap-2 rounded-md border p-3'>
                          <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} /></FormControl>
                          <FormLabel>{t('includedInPackage')}</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='priceILS' render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('priceILS')}</FormLabel>
                          <FormControl><Input type='number' dir='ltr' className='text-start' {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className='flex justify-end'>
                      <Button type='submit'>{t('submitMasterClass')}</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className='text-lg font-semibold text-start'>{t('publishedMasterClasses')}</h2>
              {role === 'student' && allowance && (
                <CardDescription>{t('allowanceRemaining', { remaining: allowance.remaining })}</CardDescription>
              )}
            </CardHeader>
            <CardContent className='space-y-3'>
              {publishedMasterClasses.length === 0 && <p className='text-sm text-muted-foreground'>{t('noPublishedMasterClasses')}</p>}
              {publishedMasterClasses.map((item) => {
                const alreadyRegistered = isRegistered(item);
                const isFull = item.registrations.length >= item.maxParticipants;
                return (
                  <div key={item.id} className='rounded-md border p-4'>
                    <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                      <div className='space-y-1.5'>
                        <p className='font-medium text-start'>{localizedTitle(item.title)}</p>
                        <p className='text-sm text-muted-foreground'>
                          <span>{item.instructor.displayName}</span>
                        </p>
                        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                          <span className='flex items-center gap-1' dir='ltr'>{item.date} {item.startTime}</span>
                          <span className='flex items-center gap-1'><Music className='h-3.5 w-3.5' />{item.instrument}</span>
                          <span className='flex items-center gap-1'><MapPin className='h-3.5 w-3.5' />{item.location}</span>
                          <span className='flex items-center gap-1'><Users className='h-3.5 w-3.5' />{item.registrations.length}/{item.maxParticipants}</span>
                          {!item.includedInPackage && item.priceILS != null && (
                            <span dir='ltr'>&#8362;{item.priceILS}</span>
                          )}
                        </div>
                      </div>
                      {role === 'student' && user && (
                        <Button
                          type='button'
                          size='sm'
                          disabled={alreadyRegistered || isFull}
                          onClick={async () => {
                            const result = await registerToMasterClass(item.id, user.id);
                            if (!result.success) {
                              toast({ variant: 'destructive', title: t('registrationFailed') });
                              return;
                            }
                            if ((result.chargedILS || 0) > 0) {
                              toast({ title: t('chargedTitle'), description: t('chargedDesc', { amount: result.chargedILS || 0 }) });
                            } else {
                              toast({ title: t('registeredTitle'), description: t('remainingDesc', { remaining: result.remaining ?? 0 }) });
                            }
                          }}
                        >
                          {alreadyRegistered ? t('registeredTitle') : t('registerButton')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Review / Admin ─────────────────────────────────────────── */}
        <TabsContent value='review' className='space-y-4'>
          {isAdmin && (
            <Card>
              <CardHeader>
                <h2 className='text-lg font-semibold text-start'>{t('graduateTitle')}</h2>
                <CardDescription>{t('graduateDesc')}</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3 md:grid-cols-[1fr_180px_auto]'>
                <Select value={graduateStudentId} onValueChange={setGraduateStudentId}>
                  <SelectTrigger><SelectValue placeholder={t('selectStudent')} /></SelectTrigger>
                  <SelectContent dir={dir}>
                    {gradCandidates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className='space-y-1'>
                  <Label htmlFor='grad-year'>{t('graduationYear')}</Label>
                  <Input id='grad-year' type='number' dir='ltr' className='text-start' value={graduateYear} onChange={(e) => setGraduateYear(e.target.value)} />
                </div>
                <div className='flex items-end'>
                  <Button type='button' onClick={onGraduate}>{t('markGraduated')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className='text-lg font-semibold text-start'>{t('reviewQueueTitle')}</h2>
              <CardDescription>{t('reviewQueueDesc')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {reviewQueue.length === 0 && <p className='text-sm text-muted-foreground'>{t('noReviewItems')}</p>}
              {reviewQueue.map((item) => (
                <div key={item.id} className='flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <p className='font-medium text-start'>{localizedTitle(item.title)}</p>
                    <p className='text-sm text-muted-foreground'>
                      <span>{item.instructor.displayName}</span>
                      <span aria-hidden='true' className='mx-1'>&middot;</span>
                      <span>{item.instrument}</span>
                    </p>
                  </div>
                  {isAdmin && (
                    <Button type='button' size='sm' onClick={() => publishMasterClass(item.id)}>{t('publishButton')}</Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
