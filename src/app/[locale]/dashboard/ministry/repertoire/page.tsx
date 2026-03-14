'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Plus, Pencil, Trash2, Search, Loader2, Wand2, BookOpen, ChevronLeft, ChevronRight, Library,
} from 'lucide-react';
import type { Composition } from '@/lib/types';
import { translateCompositionData } from '@/app/actions/translate';
import { Link } from '@/i18n/routing';

type FormState = {
    titleHe: string;
    titleEn: string;
    titleRu: string;
    titleAr: string;
    composerHe: string;
    composerEn: string;
    composerRu: string;
    composerAr: string;
    genre: string;
    instrument: string;
    duration: string;
    approved: boolean;
};

const DEFAULT_FORM: FormState = {
    titleHe: '', titleEn: '', titleRu: '', titleAr: '',
    composerHe: '', composerEn: '', composerRu: '', composerAr: '',
    genre: '', instrument: '', duration: '00:00', approved: true,
};

const PAGE_SIZE = 30;

export default function MinistryRepertoirePage() {
    const t = useTranslations('MinistryRepertoire');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';
    const { user, compositions, addComposition, updateComposition, deleteComposition } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Composition | null>(null);
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [isPending, startTransition] = useTransition();
    const [confirmDelete, setConfirmDelete] = useState<Composition | null>(null);

    const localeKey = locale as 'he' | 'en' | 'ar' | 'ru';
    const BackIcon = isRtl ? ChevronRight : ChevronLeft;

    const canAccess = user?.role === 'ministry_director' || user?.role === 'site_admin';

    const filteredCompositions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return compositions;
        return compositions.filter(c => {
            const title = c.titles?.[localeKey] || c.title;
            const composer = c.composerNames?.[localeKey] || c.composer;
            return (
                title.toLowerCase().includes(q) ||
                composer.toLowerCase().includes(q) ||
                (c.genre?.toLowerCase().includes(q) ?? false) ||
                (c.instrument?.toLowerCase().includes(q) ?? false)
            );
        });
    }, [compositions, searchQuery, localeKey]);

    const visibleCompositions = filteredCompositions.slice(0, visibleCount);
    const hasMore = visibleCount < filteredCompositions.length;

    const getDisplayTitle = (c: Composition) => c.titles?.[localeKey] || c.title;
    const getDisplayComposer = (c: Composition) => c.composerNames?.[localeKey] || c.composer;

    const openCreate = () => {
        setEditing(null);
        setForm(DEFAULT_FORM);
        setOpen(true);
    };

    const openEdit = (c: Composition) => {
        setEditing(c);
        setForm({
            titleHe: c.titles?.he || c.title,
            titleEn: c.titles?.en || '',
            titleRu: c.titles?.ru || '',
            titleAr: c.titles?.ar || '',
            composerHe: c.composerNames?.he || c.composer,
            composerEn: c.composerNames?.en || '',
            composerRu: c.composerNames?.ru || '',
            composerAr: c.composerNames?.ar || '',
            genre: c.genre || '',
            instrument: c.instrument || '',
            duration: c.duration || '00:00',
            approved: c.approved ?? true,
        });
        setOpen(true);
    };

    const handleAutoTranslate = () => {
        if (!form.titleHe.trim() && !form.composerHe.trim()) return;
        startTransition(async () => {
            const result = await translateCompositionData(form.titleHe, form.composerHe);
            if (result.success && result.translations) {
                const { title: tT, composer: cT } = result.translations;
                setForm(prev => ({
                    ...prev,
                    titleEn: tT.en || prev.titleEn,
                    titleAr: tT.ar || prev.titleAr,
                    titleRu: tT.ru || prev.titleRu,
                    composerEn: cT.en || prev.composerEn,
                    composerAr: cT.ar || prev.composerAr,
                    composerRu: cT.ru || prev.composerRu,
                }));
                toast({ description: t('translationApplied') });
            } else {
                toast({ variant: 'destructive', description: t('translationFailed') });
            }
        });
    };

    const handleSave = () => {
        if (!form.titleHe.trim() || !form.composerHe.trim()) return;
        const payload: Partial<Composition> = {
            titles: {
                he: form.titleHe,
                en: form.titleEn || form.titleHe,
                ru: form.titleRu || undefined,
                ar: form.titleAr || undefined,
            },
            composerNames: {
                he: form.composerHe,
                en: form.composerEn || form.composerHe,
                ru: form.composerRu || undefined,
                ar: form.composerAr || undefined,
            },
            genre: form.genre,
            instrument: form.instrument || undefined,
            duration: form.duration,
            approved: form.approved,
        };
        if (editing?.id) {
            updateComposition(editing.id, payload);
            toast({ title: t('updatedTitle'), description: t('updatedDesc', { title: form.titleHe }) });
        } else {
            addComposition(payload);
            toast({ title: t('addedTitle'), description: t('addedDesc', { title: form.titleHe }) });
        }
        setOpen(false);
    };

    const handleDelete = (c: Composition) => {
        if (!c.id) return;
        setConfirmDelete(c);
    };

    const handleDeleteConfirmed = () => {
        if (!confirmDelete?.id) return;
        deleteComposition(confirmDelete.id);
        toast({ description: t('deletedDesc', { title: getDisplayTitle(confirmDelete) }) });
        setConfirmDelete(null);
    };

    if (!canAccess) {
        return (
            <div className="text-center p-8" dir={dir}>
                <h1 className="text-2xl font-bold text-destructive">{t('noPermission')}</h1>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={dir}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="gap-1 -ms-2 h-7 text-muted-foreground" asChild>
                        <Link href="/dashboard/ministry">
                            <BackIcon className="h-4 w-4" />
                            {t('backToMinistry')}
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Library className="h-6 w-6 text-primary" />
                        {t('title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">{t('description', { count: String(compositions.length) })}</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('add')}
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    className="ps-9"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                />
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{t('showingCount', { shown: String(Math.min(visibleCount, filteredCompositions.length)), total: String(filteredCompositions.length) })}</span>
            </div>

            {/* List */}
            <div className="space-y-2">
                {visibleCompositions.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground text-sm">
                            {searchQuery ? t('noResults') : t('empty')}
                        </CardContent>
                    </Card>
                )}
                {visibleCompositions.map((c) => (
                    <Card key={c.id} className={c.approved === false ? 'opacity-60 border-dashed' : ''}>
                        <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{getDisplayTitle(c)}</span>
                                        {c.approved === false && (
                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{t('unapproved')}</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
                                        <span>{getDisplayComposer(c)}</span>
                                        {c.genre && <><span aria-hidden>·</span><span>{c.genre}</span></>}
                                        {c.instrument && <><span aria-hidden>·</span><span>{c.instrument}</span></>}
                                        {locale !== 'he' && (c.titles?.he || c.title) !== getDisplayTitle(c) && (
                                            <><span aria-hidden>·</span><span dir="rtl" className="text-xs opacity-60">{c.titles?.he || c.title}</span></>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(c)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center py-4">
                    <Button variant="outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                        {t('loadMore', { count: String(Math.min(PAGE_SIZE, filteredCompositions.length - visibleCount)) })}
                    </Button>
                </div>
            )}

            {/* Add / Edit dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent dir={dir} className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            {editing ? t('editTitle') : t('addTitle')}
                        </DialogTitle>
                        <DialogDescription>{t('dialogDesc')}</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pe-4">
                        <div className="space-y-5 py-2">
                            {/* Hebrew fields + auto-translate */}
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>{t('titleHe')} *</Label>
                                    <Input
                                        dir="rtl"
                                        value={form.titleHe}
                                        onChange={(e) => setForm(f => ({ ...f, titleHe: e.target.value }))}
                                        placeholder={t('titleHe')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('composerHe')} *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            dir="rtl"
                                            value={form.composerHe}
                                            onChange={(e) => setForm(f => ({ ...f, composerHe: e.target.value }))}
                                            placeholder={t('composerHe')}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            title={t('autoTranslate')}
                                            disabled={(!form.titleHe.trim() && !form.composerHe.trim()) || isPending}
                                            onClick={handleAutoTranslate}
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* EN translations */}
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('titleEn')}</Label>
                                    <Input dir="ltr" value={form.titleEn} onChange={(e) => setForm(f => ({ ...f, titleEn: e.target.value }))} placeholder="English title" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('composerEn')}</Label>
                                    <Input dir="ltr" value={form.composerEn} onChange={(e) => setForm(f => ({ ...f, composerEn: e.target.value }))} placeholder="Composer in English" />
                                </div>
                            </div>

                            {/* AR translations */}
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('titleAr')}</Label>
                                    <Input dir="rtl" value={form.titleAr} onChange={(e) => setForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="العنوان بالعربية" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('composerAr')}</Label>
                                    <Input dir="rtl" value={form.composerAr} onChange={(e) => setForm(f => ({ ...f, composerAr: e.target.value }))} placeholder="المؤلف بالعربية" />
                                </div>
                            </div>

                            {/* RU translations */}
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('titleRu')}</Label>
                                    <Input dir="ltr" value={form.titleRu} onChange={(e) => setForm(f => ({ ...f, titleRu: e.target.value }))} placeholder="Название на русском" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('composerRu')}</Label>
                                    <Input dir="ltr" value={form.composerRu} onChange={(e) => setForm(f => ({ ...f, composerRu: e.target.value }))} placeholder="Композитор на русском" />
                                </div>
                            </div>

                            <Separator />

                            {/* Metadata */}
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('genre')}</Label>
                                    <Input dir={dir} value={form.genre} onChange={(e) => setForm(f => ({ ...f, genre: e.target.value }))} placeholder={t('genrePlaceholder')} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('instrument')}</Label>
                                    <Input dir={dir} value={form.instrument} onChange={(e) => setForm(f => ({ ...f, instrument: e.target.value }))} placeholder={t('instrumentPlaceholder')} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">{t('duration')}</Label>
                                    <Input dir="ltr" className="text-start" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="MM:SS" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md border p-3">
                                <Label className="cursor-pointer">{t('approved')}</Label>
                                <Switch
                                    checked={form.approved}
                                    onCheckedChange={(v) => setForm(f => ({ ...f, approved: v }))}
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>{t('cancel')}</Button>
                        <Button onClick={handleSave} disabled={!form.titleHe.trim() || !form.composerHe.trim()}>
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
                <DialogContent dir={dir} className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
                        <DialogDescription>{t('deleteConfirmDesc', { title: confirmDelete ? getDisplayTitle(confirmDelete) : '' })}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDelete(null)}>{t('cancel')}</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirmed}>{t('delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
