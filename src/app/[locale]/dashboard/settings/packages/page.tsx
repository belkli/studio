'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Clock, BookOpen, Star } from 'lucide-react';
import type { ConservatoriumInstrument, LessonPackage } from '@/lib/types';

type FormValues = {
  nameHe: string;
  nameEn: string;
  type: 'monthly' | 'semester' | 'annual' | 'single';
  lessonCount: number | null;
  durationMinutes: '30' | '45' | '60';
  priceILS: number;
  isActive: boolean;
  isPremium: boolean;
  instrumentIds: string[];
};

const DEFAULT_FORM: FormValues = {
  nameHe: '',
  nameEn: '',
  type: 'monthly',
  lessonCount: 4,
  durationMinutes: '45',
  priceILS: 500,
  isActive: true,
  isPremium: false,
  instrumentIds: [],
};

const TYPE_COLORS: Record<string, string> = {
  monthly:  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  semester: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  annual:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  single:   'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function PackagesSettingsPage() {
  const t = useTranslations('SettingsPage.packages');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const router = useRouter();
  const {
    user,
    lessonPackages,
    conservatoriumInstruments,
    addLessonPackage,
    updateLessonPackage,
    deleteLessonPackage,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LessonPackage | null>(null);
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canAccess = user?.role === 'conservatorium_admin';
  useEffect(() => {
    if (user && !canAccess) router.push('/403');
  }, [canAccess, router, user]);

  const rows = useMemo(
    () => lessonPackages.filter((item) => item.conservatoriumId === user?.conservatoriumId),
    [lessonPackages, user?.conservatoriumId],
  );

  const instrumentRows = useMemo(
    () => conservatoriumInstruments.filter(
      (item) => item.conservatoriumId === user?.conservatoriumId && item.isActive
    ),
    [conservatoriumInstruments, user?.conservatoriumId],
  );

  const getInstrumentLabel = (item: ConservatoriumInstrument) => {
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    if (locale === 'en') return item.names.en;
    return item.names.he;
  };

  const getPackageName = (item: LessonPackage) => {
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    if (locale === 'en') return item.names.en;
    return item.names.he;
  };

  const getPackageInstruments = (item: LessonPackage) => {
    if (item.conservatoriumInstrumentIds?.length) {
      return instrumentRows
        .filter((r) => item.conservatoriumInstrumentIds!.includes(r.id))
        .map(getInstrumentLabel);
    }
    return item.instruments || [];
  };

  if (user && !canAccess) return null;

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setOpen(true);
  };

  const openEdit = (item: LessonPackage) => {
    const selectedIds = (item.conservatoriumInstrumentIds?.length)
      ? item.conservatoriumInstrumentIds
      : instrumentRows
          .filter((r) => (item.instruments || []).some(
            (legacy) => legacy.trim().toLowerCase() === r.names.he.trim().toLowerCase()
          ))
          .map((r) => r.id);

    setEditing(item);
    setForm({
      nameHe: item.names.he,
      nameEn: item.names.en,
      type: item.type,
      lessonCount: item.lessonCount,
      durationMinutes: String(item.durationMinutes) as '30' | '45' | '60',
      priceILS: item.priceILS,
      isActive: item.isActive,
      isPremium: item.isPremium ?? false,
      instrumentIds: selectedIds,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.nameHe.trim() || !form.nameEn.trim()) return;

    const selectedRows = instrumentRows.filter((r) => form.instrumentIds.includes(r.id));
    const payload: Partial<LessonPackage> = {
      conservatoriumId: user?.conservatoriumId,
      names: { he: form.nameHe, en: form.nameEn },
      type: form.type,
      lessonCount: form.lessonCount,
      durationMinutes: Number(form.durationMinutes) as 30 | 45 | 60,
      priceILS: form.priceILS,
      isActive: form.isActive,
      isPremium: form.isPremium,
      conservatoriumInstrumentIds: form.instrumentIds,
      instrumentCatalogIds: Array.from(new Set(
        selectedRows.map((r) => r.instrumentCatalogId).filter((id): id is string => Boolean(id))
      )),
      instruments: selectedRows.map((r) => r.names.he),
    };

    if (editing) updateLessonPackage(editing.id, payload);
    else addLessonPackage(payload);
    setOpen(false);
  };

  const toggleActive = (id: string, val: boolean) => {
    updateLessonPackage(id, { isActive: val });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back nav + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-1 -ms-2 h-7 text-muted-foreground" asChild>
            <Link href="/dashboard/settings">
              <BackIcon className="h-4 w-4" />
              {t('backToSettings')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* Package cards */}
      <div className="space-y-3">
        {rows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              {t('empty')}
            </CardContent>
          </Card>
        )}
        {rows.map((item) => {
          const instruments = getPackageInstruments(item);
          const pricePerLesson = item.lessonCount ? Math.round(item.priceILS / item.lessonCount) : null;
          return (
            <Card key={item.id} className={item.isActive ? '' : 'opacity-60'}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3 flex-wrap">
                  {/* Left: name + metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getPackageName(item)}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? ''}`}>
                        {t(item.type)}
                      </span>
                      {item.isPremium && (
                        <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {t('premium')}
                        </span>
                      )}
                      {!item.isActive && (
                        <Badge variant="outline" className="text-xs">{t('inactive')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      {item.lessonCount && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {item.lessonCount} {t('lessons')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.durationMinutes} {t('min')}
                      </span>
                      {pricePerLesson && (
                        <span className="text-xs">
                          ₪{item.priceILS} ({t('perLesson')}: ₪{pricePerLesson})
                        </span>
                      )}
                      {!pricePerLesson && (
                        <span>₪{item.priceILS}</span>
                      )}
                    </div>
                    {instruments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {instruments.map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: active toggle + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(v) => toggleActive(item.id, v)}
                      />
                      <span className="hidden sm:inline">{t('isActive')}</span>
                    </label>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('editTitle') : t('addTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('nameHe')}</Label>
                <Input
                  value={form.nameHe}
                  onChange={(e) => setForm((f) => ({ ...f, nameHe: e.target.value }))}
                  placeholder={t('nameHe')}
                  dir="rtl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('nameEn')}</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  placeholder={t('nameEn')}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Type + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('type')}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as FormValues['type'] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                    <SelectItem value="semester">{t('semester')}</SelectItem>
                    <SelectItem value="annual">{t('annual')}</SelectItem>
                    <SelectItem value="single">{t('single')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('durationMinutes')}</Label>
                <Select
                  value={form.durationMinutes}
                  onValueChange={(v) => setForm((f) => ({ ...f, durationMinutes: v as FormValues['durationMinutes'] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {t('min')}</SelectItem>
                    <SelectItem value="45">45 {t('min')}</SelectItem>
                    <SelectItem value="60">60 {t('min')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lesson count + price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('lessonCount')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.lessonCount ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, lessonCount: e.target.value === '' ? null : Number(e.target.value) }))}
                  placeholder={t('lessonCount')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('price')} (₪)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.priceILS}
                  onChange={(e) => setForm((f) => ({ ...f, priceILS: Number(e.target.value) }))}
                  placeholder={t('price')}
                />
              </div>
            </div>

            {/* Per-lesson calculation hint */}
            {form.lessonCount && form.priceILS > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('perLesson')}: ₪{Math.round(form.priceILS / form.lessonCount)} / {t('lesson')}
              </p>
            )}

            <Separator />

            {/* Instruments */}
            {instrumentRows.length > 0 && (
              <div className="space-y-2">
                <Label>{t('instruments')}</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {instrumentRows.map((item) => {
                    const checked = form.instrumentIds.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            setForm((f) => ({
                              ...f,
                              instrumentIds: next
                                ? Array.from(new Set([...f.instrumentIds, item.id]))
                                : f.instrumentIds.filter((id) => id !== item.id),
                            }));
                          }}
                        />
                        <span>{getInstrumentLabel(item)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Premium toggle */}
            <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <Label className="cursor-pointer font-medium">{t('premiumPackage')}</Label>
                </div>
                <Switch
                  checked={form.isPremium}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isPremium: v }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('premiumPackageHint')}</p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">{t('isActive')}</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={!form.nameHe.trim() || !form.nameEn.trim()}
              >
                {t('save')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('deleteConfirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>{t('cancel')}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) deleteLessonPackage(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
