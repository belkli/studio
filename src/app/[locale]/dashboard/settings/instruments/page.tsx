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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ConservatoriumInstrument } from '@/lib/types';

const formSchema = z.object({
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  nameRu: z.string().optional(),
  nameAr: z.string().optional(),
  availableForRegistration: z.boolean(),
  availableForRental: z.boolean(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function InstrumentsSettingsPage() {
  const t = useTranslations('SettingsPage.instruments');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const {
    user,
    conservatoriumInstruments,
    addConservatoriumInstrument,
    updateConservatoriumInstrument,
    deleteConservatoriumInstrument,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ConservatoriumInstrument | null>(null);

  const canAccess = user?.role === 'conservatorium_admin' || user?.role === 'delegated_admin';
  useEffect(() => {
    if (user && !canAccess) router.push('/403');
  }, [canAccess, router, user]);
  if (user && !canAccess) return null;

  const rows = useMemo(
    () => conservatoriumInstruments.filter((item) => item.conservatoriumId === user?.conservatoriumId),
    [conservatoriumInstruments, user?.conservatoriumId],
  );

  const form = useForm<FormValues>({
    defaultValues: {
      nameHe: '',
      nameEn: '',
      nameRu: '',
      nameAr: '',
      availableForRegistration: true,
      availableForRental: true,
      isActive: true,
    },
  });

  const onCreate = () => {
    setEditing(null);
    form.reset({ nameHe: '', nameEn: '', nameRu: '', nameAr: '', availableForRegistration: true, availableForRental: true, isActive: true });
    setOpen(true);
  };

  const onEdit = (item: ConservatoriumInstrument) => {
    setEditing(item);
    form.reset({
      nameHe: item.names.he,
      nameEn: item.names.en,
      nameRu: item.names.ru || '',
      nameAr: item.names.ar || '',
      availableForRegistration: item.availableForRegistration,
      availableForRental: item.availableForRental,
      isActive: item.isActive,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit((rawValues) => {
    const parsed = formSchema.safeParse(rawValues);
    if (!parsed.success) return;
    const values = parsed.data;
    const payload: Partial<ConservatoriumInstrument> = {
      conservatoriumId: user?.conservatoriumId,
      names: { he: values.nameHe, en: values.nameEn, ru: values.nameRu, ar: values.nameAr },
      availableForRegistration: values.availableForRegistration,
      availableForRental: values.availableForRental,
      isActive: values.isActive,
    };
    if (editing) updateConservatoriumInstrument(editing.id, payload);
    else addConservatoriumInstrument(payload);
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
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
              <div className="text-start">{item.names.he}</div>
              <div className="text-start">{item.teacherCount}</div>
              <div className="text-start">{item.isActive ? t('active') : t('inactive')}</div>
              <div className="text-start">{item.availableForRegistration ? t('yes') : t('no')}</div>
              <div className="text-start">{item.availableForRental ? t('yes') : t('no')}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>{t('edit')}</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteConservatoriumInstrument(item.id)}>{t('delete')}</Button>
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
            <Input {...form.register('nameRu')} placeholder={t('nameRu')} />
            <Input {...form.register('nameAr')} placeholder={t('nameAr')} />
            <div className="flex items-center justify-between"><span>{t('availableForRegistration')}</span><Switch checked={form.watch('availableForRegistration')} onCheckedChange={(v) => form.setValue('availableForRegistration', v)} /></div>
            <div className="flex items-center justify-between"><span>{t('availableForRental')}</span><Switch checked={form.watch('availableForRental')} onCheckedChange={(v) => form.setValue('availableForRental', v)} /></div>
            <div className="flex items-center justify-between"><span>{t('isActive')}</span><Switch checked={form.watch('isActive')} onCheckedChange={(v) => form.setValue('isActive', v)} /></div>
            <DialogFooter><Button type="submit">{t('save')}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
