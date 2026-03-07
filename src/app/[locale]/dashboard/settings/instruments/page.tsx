'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Pencil, Trash2, Wand2, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ConservatoriumInstrument } from '@/lib/types';
import { translateInstrumentName } from '@/app/actions/translate';

// ── Global instrument catalog (shared, pre-translated) ───────────────────────
// This serves as the community catalog users can pick from.
// In production this would come from the DB — for now it's the well-known set.
const GLOBAL_CATALOG: Array<{ id: string; names: { he: string; en: string; ru: string; ar: string } }> = [
  { id: 'cat-piano',      names: { he: 'פסנתר',     en: 'Piano',      ru: 'Фортепиано',   ar: 'بيانو'       } },
  { id: 'cat-violin',     names: { he: 'כינור',     en: 'Violin',     ru: 'Скрипка',       ar: 'كمان'        } },
  { id: 'cat-flute',      names: { he: 'חליל',      en: 'Flute',      ru: 'Флейта',        ar: 'ناي'         } },
  { id: 'cat-guitar',     names: { he: 'גיטרה',     en: 'Guitar',     ru: 'Гитара',        ar: 'جيتار'       } },
  { id: 'cat-cello',      names: { he: "צ'לו",      en: 'Cello',      ru: 'Виолончель',    ar: 'تشيلو'       } },
  { id: 'cat-drums',      names: { he: 'תופים',     en: 'Drums',      ru: 'Ударные',       ar: 'طبول'        } },
  { id: 'cat-saxophone',  names: { he: 'סקסופון',   en: 'Saxophone',  ru: 'Саксофон',      ar: 'ساكسوفون'    } },
  { id: 'cat-clarinet',   names: { he: 'קלרינט',    en: 'Clarinet',   ru: 'Кларнет',       ar: 'كلارينيت'    } },
  { id: 'cat-trumpet',    names: { he: 'חצוצרה',    en: 'Trumpet',    ru: 'Труба',         ar: 'بوق'         } },
  { id: 'cat-viola',      names: { he: 'ויולה',     en: 'Viola',      ru: 'Альт',          ar: 'فيولا'       } },
  { id: 'cat-oboe',       names: { he: 'אבוב',      en: 'Oboe',       ru: 'Гобой',         ar: 'أوبوا'       } },
  { id: 'cat-harp',       names: { he: 'כינור נבל', en: 'Harp',       ru: 'Арфа',          ar: 'قيثارة'      } },
  { id: 'cat-accordion',  names: { he: 'אקורדיון',  en: 'Accordion',  ru: 'Аккордеон',     ar: 'أكورديون'    } },
  { id: 'cat-bassoon',    names: { he: 'בסון',      en: 'Bassoon',    ru: 'Фагот',         ar: 'باسون'       } },
  { id: 'cat-trombone',   names: { he: 'טרומבון',   en: 'Trombone',   ru: 'Тромбон',       ar: 'ترومبون'     } },
  { id: 'cat-ukulele',    names: { he: 'אוקולילה',  en: 'Ukulele',    ru: 'Укулеле',       ar: 'يوكيليلي'    } },
  { id: 'cat-vocals',     names: { he: 'שירה',      en: 'Vocals',     ru: 'Вокал',         ar: 'الصوت'       } },
  { id: 'cat-bass-guitar',names: { he: 'גיטרה בס',  en: 'Bass Guitar',ru: 'Бас-гитара',    ar: 'جيتار باس'   } },
  { id: 'cat-keyboard',   names: { he: 'קלידים',    en: 'Keyboard',   ru: 'Клавишные',     ar: 'لوحة مفاتيح' } },
  { id: 'cat-double-bass',names: { he: 'קונטרבס',   en: 'Double Bass',ru: 'Контрабас',     ar: 'كونترباس'    } },
];

type FormState = {
  nameHe: string;
  nameEn: string;
  nameRu: string;
  nameAr: string;
  availableForRegistration: boolean;
  availableForRental: boolean;
  isActive: boolean;
  catalogId?: string;
};

const DEFAULT_FORM: FormState = {
  nameHe: '',
  nameEn: '',
  nameRu: '',
  nameAr: '',
  availableForRegistration: true,
  availableForRental: true,
  isActive: true,
};

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
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [step, setStep] = useState<'catalog' | 'edit'>('catalog');
  const [isPending, startTransition] = useTransition();

  const canAccess = user?.role === 'conservatorium_admin' || user?.role === 'delegated_admin';
  useEffect(() => {
    if (user && !canAccess) router.push('/403');
  }, [canAccess, router, user]);

  const rows = useMemo(
    () => conservatoriumInstruments.filter((item) => item.conservatoriumId === user?.conservatoriumId),
    [conservatoriumInstruments, user?.conservatoriumId],
  );

  // Filter global catalog excluding already-added instruments (by matching Hebrew names)
  const existingHeNames = useMemo(() => new Set(rows.map((r) => r.names.he)), [rows]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return GLOBAL_CATALOG.filter((c) => {
      if (existingHeNames.has(c.names.he)) return false;
      if (!q) return true;
      return (
        c.names.he.includes(q) ||
        c.names.en.toLowerCase().includes(q) ||
        c.names.ru.toLowerCase().includes(q) ||
        c.names.ar.includes(q)
      );
    });
  }, [catalogSearch, existingHeNames]);

  if (user && !canAccess) return null;

  const getDisplayName = (item: ConservatoriumInstrument) => {
    if (locale === 'ar') return item.names.ar || item.names.en;
    if (locale === 'ru') return item.names.ru || item.names.en;
    if (locale === 'en') return item.names.en;
    return item.names.he;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setCatalogSearch('');
    setStep('catalog');
    setOpen(true);
  };

  const openEdit = (item: ConservatoriumInstrument) => {
    setEditing(item);
    setForm({
      nameHe: item.names.he,
      nameEn: item.names.en,
      nameRu: item.names.ru || '',
      nameAr: item.names.ar || '',
      availableForRegistration: item.availableForRegistration,
      availableForRental: item.availableForRental,
      isActive: item.isActive,
    });
    setStep('edit');
    setOpen(true);
  };

  const selectFromCatalog = (entry: typeof GLOBAL_CATALOG[0]) => {
    setForm({
      ...DEFAULT_FORM,
      nameHe: entry.names.he,
      nameEn: entry.names.en,
      nameRu: entry.names.ru,
      nameAr: entry.names.ar,
      catalogId: entry.id,
    });
    setStep('edit');
  };

  const skipCatalog = () => {
    setForm({ ...DEFAULT_FORM });
    setStep('edit');
  };

  const handleAutoTranslate = () => {
    if (!form.nameHe.trim()) return;
    startTransition(async () => {
      const result = await translateInstrumentName(form.nameHe);
      if (result.success && result.translations) {
        setForm((prev) => ({
          ...prev,
          nameEn: result.translations!.en || prev.nameEn,
          nameAr: result.translations!.ar || prev.nameAr,
          nameRu: result.translations!.ru || prev.nameRu,
        }));
      }
    });
  };

  const handleSave = () => {
    if (!form.nameHe.trim() || !form.nameEn.trim()) return;
    const payload: Partial<ConservatoriumInstrument> = {
      conservatoriumId: user?.conservatoriumId,
      names: { he: form.nameHe, en: form.nameEn, ru: form.nameRu || undefined, ar: form.nameAr || undefined },
      availableForRegistration: form.availableForRegistration,
      availableForRental: form.availableForRental,
      isActive: form.isActive,
      ...(form.catalogId ? { instrumentCatalogId: form.catalogId } : {}),
    };
    if (editing) updateConservatoriumInstrument(editing.id, payload);
    else addConservatoriumInstrument(payload);
    setOpen(false);
  };

  const toggleField = (id: string, field: 'isActive' | 'availableForRegistration' | 'availableForRental', val: boolean) => {
    updateConservatoriumInstrument(id, { [field]: val });
  };

  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-1 -ms-2 h-7 text-muted-foreground" asChild>
            <Link href="/dashboard/settings">
              <BackIcon className="h-4 w-4" />
              {t('backToSettings')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('listTitle')}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* Instrument cards */}
      <div className="space-y-2">
        {rows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              {t('empty')}
            </CardContent>
          </Card>
        )}
        {rows.map((item) => (
          <Card key={item.id} className={item.isActive ? '' : 'opacity-60'}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Name + teacher count */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{getDisplayName(item)}</span>
                  {item.names.he !== getDisplayName(item) && (
                    <span className="text-muted-foreground text-sm ms-2">({item.names.he})</span>
                  )}
                  {(item.teacherCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ms-3">
                      <Users className="h-3 w-3" />
                      {item.teacherCount}
                    </span>
                  )}
                </div>

                {/* Toggle switches inline */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={(v) => toggleField(item.id, 'isActive', v)}
                    />
                    <span className="hidden sm:inline">{t('isActive')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
                    <Switch
                      checked={item.availableForRegistration}
                      onCheckedChange={(v) => toggleField(item.id, 'availableForRegistration', v)}
                    />
                    <span className="hidden sm:inline text-xs">{t('registration')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
                    <Switch
                      checked={item.availableForRental}
                      onCheckedChange={(v) => toggleField(item.id, 'availableForRental', v)}
                    />
                    <span className="hidden sm:inline text-xs">{t('rental')}</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteConservatoriumInstrument(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('editTitle') : t('addTitle')}</DialogTitle>
            {!editing && step === 'catalog' && (
              <DialogDescription>{t('catalogPickerDesc')}</DialogDescription>
            )}
          </DialogHeader>

          {/* Step 1: catalog picker (add mode only) */}
          {!editing && step === 'catalog' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="ps-9"
                  placeholder={t('searchCatalog')}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-64 rounded-md border">
                <div className="p-2 space-y-1">
                  {filteredCatalog.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => selectFromCatalog(entry)}
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-start"
                    >
                      <span className="font-medium">{entry.names.he}</span>
                      <span className="text-muted-foreground text-xs">{entry.names.en}</span>
                    </button>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {t('noResults')}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center pt-1">
                <p className="text-xs text-muted-foreground">{t('notInListHint')}</p>
                <Button variant="outline" size="sm" onClick={skipCatalog}>
                  {t('customInstrument')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: name fields + settings */}
          {(editing || step === 'edit') && (
            <div className="space-y-4">
              {/* Hebrew name + AI translate button */}
              <div className="space-y-1.5">
                <Label>{t('nameHe')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.nameHe}
                    onChange={(e) => setForm((f) => ({ ...f, nameHe: e.target.value }))}
                    placeholder={t('nameHe')}
                    dir="rtl"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title={t('autoTranslate')}
                    disabled={!form.nameHe.trim() || isPending}
                    onClick={handleAutoTranslate}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* EN / AR / RU names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('nameEn')}</Label>
                  <Input
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="English"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('nameAr')}</Label>
                  <Input
                    value={form.nameAr}
                    onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                    placeholder="العربية"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('nameRu')}</Label>
                  <Input
                    value={form.nameRu}
                    onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
                    placeholder="Русский"
                    dir="ltr"
                  />
                </div>
              </div>

              <Separator />

              {/* Toggles */}
              <div className="space-y-3">
                {(
                  [
                    { key: 'isActive', label: t('isActive') },
                    { key: 'availableForRegistration', label: t('availableForRegistration') },
                    { key: 'availableForRental', label: t('availableForRental') },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch
                      checked={form[key]}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2 pt-2">
                {!editing && (
                  <Button variant="ghost" onClick={() => setStep('catalog')}>
                    ← {t('backToCatalog')}
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!form.nameHe.trim() || !form.nameEn.trim()}
                >
                  {t('save')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
