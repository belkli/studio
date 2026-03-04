'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { LessonPackage } from '@/lib/types';

const formSchema = z.object({
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  type: z.enum(['monthly', 'semester', 'annual', 'single']),
  lessonCount: z.coerce.number().nullable(),
  durationMinutes: z.enum(['30', '45', '60']),
  priceILS: z.coerce.number().min(1),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PackagesSettingsPage() {
  const t = useTranslations('SettingsPage.packages');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const { user, lessonPackages, addLessonPackage, updateLessonPackage, deleteLessonPackage } = useAuth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LessonPackage | null>(null);

  const canAccess = user?.role === 'conservatorium_admin';
  useEffect(() => {
    if (user && !canAccess) router.push('/403');
  }, [canAccess, router, user]);
  if (user && !canAccess) return null;

  const rows = useMemo(
    () => lessonPackages.filter((item) => item.conservatoriumId === user?.conservatoriumId),
    [lessonPackages, user?.conservatoriumId],
  );

  const form = useForm<FormValues>({
    defaultValues: { nameHe: '', nameEn: '', type: 'monthly', lessonCount: 4, durationMinutes: '45', priceILS: 500, isActive: true },
  });

  const onCreate = () => {
    setEditing(null);
    form.reset({ nameHe: '', nameEn: '', type: 'monthly', lessonCount: 4, durationMinutes: '45', priceILS: 500, isActive: true });
    setOpen(true);
  };

  const onEdit = (item: LessonPackage) => {
    setEditing(item);
    form.reset({
      nameHe: item.names.he,
      nameEn: item.names.en,
      type: item.type,
      lessonCount: item.lessonCount,
      durationMinutes: String(item.durationMinutes) as '30' | '45' | '60',
      priceILS: item.priceILS,
      isActive: item.isActive,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit((rawValues) => {
    const parsed = formSchema.safeParse(rawValues);
    if (!parsed.success) return;
    const values = parsed.data;
    const payload: Partial<LessonPackage> = {
      conservatoriumId: user?.conservatoriumId,
      names: { he: values.nameHe, en: values.nameEn },
      type: values.type,
      lessonCount: values.lessonCount,
      durationMinutes: Number(values.durationMinutes) as 30 | 45 | 60,
      priceILS: values.priceILS,
      isActive: values.isActive,
    };

    if (editing) updateLessonPackage(editing.id, payload);
    else addLessonPackage(payload);
    setOpen(false);
  });

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
        <Button onClick={onCreate}>{t('add')}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('listTitle')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-7">
              <div className="text-start">{item.names.he}</div>
              <div className="text-start">{item.type}</div>
              <div className="text-start">{item.lessonCount ?? '-'}</div>
              <div className="text-start">{item.durationMinutes}</div>
              <div className="text-start">?{item.priceILS}</div>
              <div className="text-start">{item.isActive ? t('active') : t('inactive')}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>{t('edit')}</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteLessonPackage(item.id)}>{t('delete')}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('add')}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <Input {...form.register('nameHe')} placeholder={t('nameHe')} />
            <Input {...form.register('nameEn')} placeholder={t('nameEn')} />
            <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as FormValues['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('monthly')}</SelectItem>
                <SelectItem value="semester">{t('semester')}</SelectItem>
                <SelectItem value="annual">{t('annual')}</SelectItem>
                <SelectItem value="single">{t('single')}</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" value={form.watch('lessonCount') ?? ''} onChange={(e) => form.setValue('lessonCount', e.target.value === '' ? null : Number(e.target.value))} placeholder={t('lessonCount')} />
            <Select value={form.watch('durationMinutes')} onValueChange={(v) => form.setValue('durationMinutes', v as FormValues['durationMinutes'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem><SelectItem value="60">60</SelectItem></SelectContent>
            </Select>
            <Input type="number" value={form.watch('priceILS')} onChange={(e) => form.setValue('priceILS', Number(e.target.value))} placeholder={t('price')} />
            <div className="flex items-center justify-between"><span>{t('isActive')}</span><Switch checked={form.watch('isActive')} onCheckedChange={(v) => form.setValue('isActive', v)} /></div>
            <DialogFooter><Button type="submit">{t('save')}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
