'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';

import type { Alumnus, Masterclass } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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

const profileSchema = z.object({
  displayName: z.string().min(2),
  graduationYear: z.coerce.number().min(1900),
  primaryInstrument: z.string().min(2),
  currentOccupation: z.string().optional(),
  bioHe: z.string().optional(),
  bioEn: z.string().optional(),
  profilePhotoUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean(),
  availableForMasterClasses: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const masterClassSchema = z.object({
  titleHe: z.string().min(2),
  titleEn: z.string().min(2),
  descriptionHe: z.string().min(2),
  descriptionEn: z.string().min(2),
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
    return users.filter((item) => item.role === 'student' && item.conservatoriumId === user.conservatoriumId);
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
      descriptionHe: '',
      descriptionEn: '',
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
      bio: { he: values.bioHe, en: values.bioEn },
      profilePhotoUrl: values.profilePhotoUrl || undefined,
      isPublic: values.isPublic,
      availableForMasterClasses: values.availableForMasterClasses,
    });

    toast({ title: commonT('success'), description: t('profileSaved') });
  };

  const submitMasterClass = (values: MasterClassValues) => {
    createMasterClass({
      title: { he: values.titleHe, en: values.titleEn },
      description: { he: values.descriptionHe, en: values.descriptionEn },
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

  const orderedTabs = isRtl ? [...tabs].reverse() : tabs;

  return (
    <div className='space-y-6' dir={isRtl ? 'rtl' : 'ltr'}>
      <Tabs defaultValue='directory' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          {orderedTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='directory' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('directoryTitle')}</CardTitle>
              <CardDescription>{t('directorySubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 md:grid-cols-2'>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger><SelectValue placeholder={t('filterYear')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('allYears')}</SelectItem>
                    {Array.from(new Set(alumni.map((item) => String(item.graduationYear)))).sort().map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                  <SelectTrigger><SelectValue placeholder={t('filterInstrument')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('allInstruments')}</SelectItem>
                    {Array.from(new Set(alumni.map((item) => item.primaryInstrument))).sort().map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                {publicAlumni.length === 0 && <p className='text-sm text-muted-foreground'>{t('noPublicAlumni')}</p>}
                {publicAlumni.map((item) => (
                  <Card key={item.id}>
                    <CardContent className='space-y-2 p-4'>
                      <p className='font-semibold'>{item.displayName}</p>
                      <p className='text-sm text-muted-foreground'>
                        <span dir='ltr'>{item.graduationYear}</span>
                        <span aria-hidden='true' className='mx-1'>?</span>
                        <span dir='ltr'>{item.primaryInstrument}</span>
                      </p>
                      {item.currentOccupation && <Badge variant='secondary'>{item.currentOccupation}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('profileTitle')}</CardTitle>
              <CardDescription>{t('profileSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(saveProfile as any)} className='space-y-4'>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='displayName' render={({ field }) => (
                      <FormItem><FormLabel>{t('displayName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='graduationYear' render={({ field }) => (
                      <FormItem><FormLabel>{t('graduationYear')}</FormLabel><FormControl><Input type='number' {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className='grid gap-3 md:grid-cols-2'>
                    <FormField control={profileForm.control as any} name='primaryInstrument' render={({ field }) => (
                      <FormItem><FormLabel>{t('primaryInstrument')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={profileForm.control as any} name='currentOccupation' render={({ field }) => (
                      <FormItem><FormLabel>{t('currentOccupation')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={profileForm.control as any} name='bioHe' render={({ field }) => (
                    <FormItem><FormLabel>{t('bioHe')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={profileForm.control as any} name='bioEn' render={({ field }) => (
                    <FormItem><FormLabel>{t('bioEn')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={profileForm.control as any} name='profilePhotoUrl' render={({ field }) => (
                    <FormItem><FormLabel>{t('profilePhotoUrl')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

                  <Button type='submit'>{commonT('save')}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='masterClasses' className='space-y-4'>
          {canCreateMasterClass && (
            <Card>
              <CardHeader>
                <CardTitle>{t('createMasterClass')}</CardTitle>
                <CardDescription>{t('createMasterClassDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...masterClassForm}>
                  <form onSubmit={masterClassForm.handleSubmit(submitMasterClass as any)} className='space-y-4'>
                    <div className='grid gap-3 md:grid-cols-2'>
                      <FormField control={masterClassForm.control as any} name='titleHe' render={({ field }) => (
                        <FormItem><FormLabel>{t('titleHe')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='titleEn' render={({ field }) => (
                        <FormItem><FormLabel>{t('titleEn')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={masterClassForm.control as any} name='descriptionHe' render={({ field }) => (
                      <FormItem><FormLabel>{t('descriptionHe')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={masterClassForm.control as any} name='descriptionEn' render={({ field }) => (
                      <FormItem><FormLabel>{t('descriptionEn')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className='grid gap-3 md:grid-cols-3'>
                      <FormField control={masterClassForm.control as any} name='instrument' render={({ field }) => (
                        <FormItem><FormLabel>{t('instrument')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='date' render={({ field }) => (
                        <FormItem><FormLabel>{t('date')}</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='startTime' render={({ field }) => (
                        <FormItem><FormLabel>{t('startTime')}</FormLabel><FormControl><Input type='time' {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className='grid gap-3 md:grid-cols-3'>
                      <FormField control={masterClassForm.control as any} name='durationMinutes' render={({ field }) => (
                        <FormItem><FormLabel>{t('duration')}</FormLabel><FormControl><Input type='number' {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='maxParticipants' render={({ field }) => (
                        <FormItem><FormLabel>{t('maxParticipants')}</FormLabel><FormControl><Input type='number' {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={masterClassForm.control as any} name='location' render={({ field }) => (
                        <FormItem><FormLabel>{t('location')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                        <FormItem><FormLabel>{t('priceILS')}</FormLabel><FormControl><Input type='number' {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type='submit'>{t('submitMasterClass')}</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('publishedMasterClasses')}</CardTitle>
              {role === 'student' && allowance && (
                <CardDescription>{t('allowanceRemaining', { remaining: allowance.remaining })}</CardDescription>
              )}
            </CardHeader>
            <CardContent className='space-y-3'>
              {publishedMasterClasses.length === 0 && <p className='text-sm text-muted-foreground'>{t('noPublishedMasterClasses')}</p>}
              {publishedMasterClasses.map((item) => (
                <div key={item.id} className='rounded-md border p-3'>
                  <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>{item.title.en}</p>
                      <p className='text-sm text-muted-foreground'>
                        <span>{item.instructor.displayName}</span>
                        <span aria-hidden='true' className='mx-1'>?</span>
                        <span dir='ltr'>{item.date} {item.startTime}</span>
                      </p>
                    </div>
                    {role === 'student' && user && (
                      <Button
                        type='button'
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
                        {t('registerButton')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='review' className='space-y-4'>
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>{t('graduateTitle')}</CardTitle>
                <CardDescription>{t('graduateDesc')}</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3 md:grid-cols-[1fr_180px_auto]'>
                <Select value={graduateStudentId} onValueChange={setGraduateStudentId}>
                  <SelectTrigger><SelectValue placeholder={t('selectStudent')} /></SelectTrigger>
                  <SelectContent>
                    {gradCandidates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className='space-y-1'>
                  <Label htmlFor='grad-year'>{t('graduationYear')}</Label>
                  <Input id='grad-year' type='number' value={graduateYear} onChange={(e) => setGraduateYear(e.target.value)} />
                </div>
                <div className='flex items-end'>
                  <Button type='button' onClick={onGraduate}>{t('markGraduated')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('reviewQueueTitle')}</CardTitle>
              <CardDescription>{t('reviewQueueDesc')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {reviewQueue.length === 0 && <p className='text-sm text-muted-foreground'>{t('noReviewItems')}</p>}
              {reviewQueue.map((item) => (
                <div key={item.id} className='flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <p className='font-medium'>{item.title.en}</p>
                    <p className='text-sm text-muted-foreground'>
                    <span>{item.instructor.displayName}</span>
                    <span aria-hidden='true' className='mx-1'>?</span>
                    <span dir='ltr'>{item.instrument}</span>
                  </p>
                  </div>
                  {isAdmin && (
                    <Button type='button' onClick={() => publishMasterClass(item.id)}>{t('publishButton')}</Button>
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

