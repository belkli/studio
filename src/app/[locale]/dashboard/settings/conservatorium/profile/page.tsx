'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Building2, Contact, MapPin, Users, Share2, Save, Image as ImageIcon, Sparkles, Plus, Trash2, ExternalLink } from 'lucide-react';
import { SocialMediaLinks, Conservatorium, ConservatoriumStaffMember, ConservatoriumPolicyContact, OpeningHours } from '@/lib/types';
import { translateConservatoriumProfile } from '@/app/actions/translate';
import { TranslatedFieldInput } from '@/components/dashboard/harmonia/translated-field-input';
import { computeConservatoriumSourceHash } from '@/lib/utils/translation-hash';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function createDefaultOpeningHours(): OpeningHours {
    return DAYS_OF_WEEK.reduce((acc, day) => {
        acc[day] = { isOpen: false, openTime: '08:00', closeTime: '20:00' };
        return acc;
    }, {} as OpeningHours);
}

function formatOpeningHours(hours: OpeningHours, t: (k: string) => string): string {
    return DAYS_OF_WEEK
        .filter((day) => hours[day]?.isOpen)
        .map((day) => t('profileEditor.contact.days.' + day) + ': ' + hours[day].openTime + '-' + hours[day].closeTime)
        .join(', ');
}

export default function ConservatoriumProfileEditor() {
    const t = useTranslations('SettingsPage.conservatorium');
    const tUi = useTranslations('SettingsPage.conservatorium.profileEditor.ui');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { user, users, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [formData, setFormData] = useState<Partial<Conservatorium>>({});
    const [hoursByDay, setHoursByDay] = useState<OpeningHours>(createDefaultOpeningHours());
    const [addressSuggestions, setAddressSuggestions] = useState<Array<{ description: string; placeId: string }>>([]);

    const currentCons = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const derivedInstruments = useMemo(() => {
        const values = new Set<string>();
        users
            .filter((entry) => entry.role === 'teacher' && entry.conservatoriumId === user?.conservatoriumId)
            .forEach((entry) => entry.instruments?.forEach((item) => values.add(item.instrument)));
        return Array.from(values).sort((a, b) => a.localeCompare(b));
    }, [user?.conservatoriumId, users]);

    useEffect(() => {
        if (currentCons) {
            setFormData(currentCons);
            setHoursByDay(currentCons.openingHoursByDay || createDefaultOpeningHours());
        }
    }, [currentCons]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            openingHoursByDay: hoursByDay,
            openingHours: formatOpeningHours(hoursByDay, (key) => t(key))
        }));
    }, [hoursByDay, t]);

    if (!user || !currentCons || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return null;
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        let finalData = { ...formData } as Conservatorium;

        // SDD-i18n-PROFILES: Auto-translate policy
        const currentHash = computeConservatoriumSourceHash(finalData);
        const isStale = currentHash !== finalData.translationMeta?.sourceHash;

        if (isStale) {
            setIsTranslating(true);
            toast({
                title: tUi('toasts.contentChangedTitle'),
                description: tUi('toasts.contentChangedDesc'),
            });

            const result = await translateConservatoriumProfile(
                finalData,
                ['en', 'ar', 'ru'],
                finalData.translations,
                finalData.translationMeta?.overrides
            );

            if (result.success && result.translations && result.meta) {
                finalData = {
                    ...finalData,
                    translations: result.translations,
                    translationMeta: {
                        ...result.meta,
                        overrides: finalData.translationMeta?.overrides
                    }
                };
            }
            setIsTranslating(false);
        }

        try {
            await updateConservatorium(finalData);
            toast({
                title: tUi('toasts.profileSavedTitle'),
                description: tUi('toasts.profileSavedDesc'),
            });
        } catch {
            toast({
                variant: 'destructive',
                title: tUi('toasts.errorSavingTitle'),
                description: tUi('toasts.errorSavingDesc'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoTranslateManual = async () => {
        setIsTranslating(true);
        const result = await translateConservatoriumProfile(
            formData,
            ['en', 'ar', 'ru'],
            formData.translations,
            formData.translationMeta?.overrides
        );

        if (result.success && result.translations && result.meta) {
            setFormData(prev => ({
                ...prev,
                translations: result.translations,
                translationMeta: {
                    ...result.meta,
                    overrides: prev.translationMeta?.overrides
                }
            }));
            toast({ title: tUi('toasts.translationsUpdatedTitle') });
        }
        setIsTranslating(false);
    };

    const handleTranslationChange = (field: string, locale: string, value: string) => {
        setFormData(prev => {
            const currentTranslations = prev.translations || {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const localeData = (currentTranslations as any)[locale] || {};

            // Deep update for nested fields like manager.role
            const newLocaleData = { ...localeData };
            if (field.includes('.')) {
                const parts = field.split('.');
                if (parts.length === 2) {
                    newLocaleData[parts[0]] = { ...newLocaleData[parts[0]], [parts[1]]: value };
                } else if (parts.length === 3 && parts[0] === 'leadingTeam') {
                    const idx = parseInt(parts[1], 10);
                    const key = parts[2];
                    const arr = [...(newLocaleData.leadingTeam || [])];
                    if (!arr[idx]) arr[idx] = {};
                    arr[idx] = { ...arr[idx], [key]: value };
                    newLocaleData.leadingTeam = arr;
                }

            } else {
                newLocaleData[field] = value;
            }

            const updatedTranslations = {
                ...currentTranslations,
                [locale]: newLocaleData
            };

            // Track meta override
            const currentOverrides = prev.translationMeta?.overrides || {};
            const localeOverrides = [...(currentOverrides[locale] || [])];
            if (!localeOverrides.includes(field)) {
                localeOverrides.push(field);
            }

            return {
                ...prev,
                translations: updatedTranslations,
                translationMeta: {
                    ...prev.translationMeta,
                    overrides: {
                        ...currentOverrides,
                        [locale]: localeOverrides
                    },
                    translatedBy: 'HUMAN'
                }
            } as Partial<Conservatorium>;
        });
    };

    const updateSocial = (key: keyof SocialMediaLinks, value: string) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: {
                ...prev.socialMedia,
                [key]: value
            }
        }));
    };

    const updatePolicyContact = (
        section: 'privacyContact' | 'accessibilityContact',
        key: keyof ConservatoriumPolicyContact,
        value: string
    ) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [key]: value
            }
        }));
    };

    const updateManager = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            manager: {
                ...(prev.manager || { name: '' }),
                [key]: value
            } as ConservatoriumStaffMember
        }));
    };

    const updatePedagogical = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            pedagogicalCoordinator: {
                ...(prev.pedagogicalCoordinator || { name: '' }),
                [key]: value
            } as ConservatoriumStaffMember
        }));
    };

    const updateLeadingTeamMember = (index: number, key: string, value: string) => {
        setFormData(prev => {
            const team = [...(prev.leadingTeam || [])];
            team[index] = { ...team[index], [key]: value };
            return { ...prev, leadingTeam: team };
        });
    };

    const addLeadingTeamMember = () => {
        setFormData(prev => ({
            ...prev,
            leadingTeam: [...(prev.leadingTeam || []), { name: '', role: '', bio: '', photoUrl: '' }]
        }));
    };

    const removeLeadingTeamMember = (index: number) => {
        setFormData(prev => {
            const team = [...(prev.leadingTeam || [])];
            team.splice(index, 1);

            // Clean up translations for this indices
            const updatedTranslations = { ...prev.translations };
            ['en', 'ar', 'ru'].forEach(loc => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((updatedTranslations as any)[loc]?.leadingTeam) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const locTeam = [...(updatedTranslations as any)[loc].leadingTeam];
                    locTeam.splice(index, 1);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (updatedTranslations as any)[loc] = { ...(updatedTranslations as any)[loc], leadingTeam: locTeam };
                }
            });

            return { ...prev, leadingTeam: team, translations: updatedTranslations };
        });
    };
    const setDayOpen = (day: string, isOpen: boolean) => {
        setHoursByDay((prev) => ({
            ...prev,
            [day]: {
                ...(prev[day] || { openTime: '08:00', closeTime: '20:00' }),
                isOpen
            }
        }));
    };

    const setDayTime = (day: string, key: 'openTime' | 'closeTime', value: string) => {
        setHoursByDay((prev) => ({
            ...prev,
            [day]: {
                ...(prev[day] || { isOpen: true, openTime: '08:00', closeTime: '20:00' }),
                [key]: value
            }
        }));
    };

    const updateLocationField = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            location: {
                city: prev.location?.city || '',
                ...prev.location,
                [key]: value
            }
        }));
    };

    const handleAddressSuggest = (value: string) => {
        updateLocationField('address', value);
        if (value.trim().length < 3) {
            setAddressSuggestions([]);
            return;
        }

        const suggestions = [
            value,
            (value + ', ' + (formData.location?.city || '')).trim(),
            (value + ', ' + (formData.location?.cityEn || '')).trim()
        ]
            .filter((entry) => entry.length > 0)
            .slice(0, 3)
            .map((entry, index) => ({ description: entry, placeId: 'local-' + index }));

        setAddressSuggestions(suggestions);
    };

    const selectAddress = (description: string) => {
        updateLocationField('address', description);
        updateLocationField('googleMapsUrl', 'https://maps.google.com/?q=' + encodeURIComponent(description));
        setAddressSuggestions([]);
    };

    return (
        <div className="space-y-6 pb-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-start">{tUi('pageTitle')}</h1>
                    <p className="text-muted-foreground text-start">{tUi('pageDesc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-primary/30 hover:bg-primary/5 text-primary"
                        onClick={handleAutoTranslateManual}
                        disabled={isTranslating}
                    >
                        {isTranslating ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {tUi('forceRetranslate')}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
                    <TabsList className="flex h-auto mb-6 bg-muted/50 p-1 overflow-x-auto">
                        <TabsTrigger value="basic" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {tUi('tabs.basic')}</TabsTrigger>
                        <TabsTrigger value="contact" className="flex items-center gap-2"><Contact className="w-4 h-4" /> {tUi('tabs.contact')}</TabsTrigger>
                        <TabsTrigger value="location" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {tUi('tabs.location')}</TabsTrigger>
                        <TabsTrigger value="team" className="flex items-center gap-2"><Users className="w-4 h-4" /> {tUi('tabs.team')}</TabsTrigger>
                        <TabsTrigger value="social" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> {tUi('tabs.social')}</TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> {tUi('tabs.media')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>{tUi('basic.title')}</CardTitle>
                                    <CardDescription>{tUi('basic.desc')}</CardDescription>
                                </div>
                                {computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 h-6">
                                        <Sparkles className="w-3 h-3" />
                                        {tUi('basic.pendingSync')}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <TranslatedFieldInput
                                    label={tUi('basic.name')}
                                    value={formData.name || ''}
                                    translations={{
                                        en: formData.translations?.en?.name || formData.nameEn,
                                        ar: formData.translations?.ar?.name,
                                        ru: formData.translations?.ru?.name,
                                    }}
                                    fieldKey="name"
                                    onSourceChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                                    onTranslationChange={(loc, val) => handleTranslationChange('name', loc, val)}
                                    isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                    isTranslating={isTranslating}
                                    overriddenLocales={Object.entries(formData.translationMeta?.overrides || {})
                                        .filter(([_, fields]) => fields.includes('name'))
                                        .map(([loc]) => loc)}
                                />

                                <TranslatedFieldInput
                                    label={tUi('basic.about')}
                                    value={formData.about || ''}
                                    translations={{
                                        en: formData.translations?.en?.about,
                                        ar: formData.translations?.ar?.about,
                                        ru: formData.translations?.ru?.about,
                                    }}
                                    fieldKey="about"
                                    isTextArea
                                    onSourceChange={(val) => setFormData(prev => ({ ...prev, about: val }))}
                                    onTranslationChange={(loc, val) => handleTranslationChange('about', loc, val)}
                                    isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                    isTranslating={isTranslating}
                                    overriddenLocales={Object.entries(formData.translationMeta?.overrides || {})
                                        .filter(([_, fields]) => fields.includes('about'))
                                        .map(([loc]) => loc)}
                                />

                                <div className="space-y-2 max-w-sm">
                                    <Label>{tUi('basic.foundedYear')}</Label>
                                    <Input
                                        type="number"
                                        value={formData.foundedYear || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, foundedYear: parseInt(e.target.value) }))}
                                        placeholder={tUi('basic.foundedYearPlaceholder')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.contact.title')}</CardTitle>
                                <CardDescription>{t('profileEditor.contact.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.contact.mainPhone')}</Label>
                                    <Input
                                        type="tel"
                                        value={formData.tel || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                                        placeholder="e.g 03-1234567"
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.contact.whatsapp')}</Label>
                                    <Input
                                        type="tel"
                                        value={formData.socialMedia?.whatsapp || ''}
                                        onChange={e => updateSocial('whatsapp', e.target.value)}
                                        placeholder="e.g 054-1234567"
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.contact.primaryEmail')}</Label>
                                    <Input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="e.g office@conservatory.co.il"
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.contact.secondaryEmail')}</Label>
                                    <Input
                                        type="email"
                                        value={formData.secondaryEmail || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, secondaryEmail: e.target.value }))}
                                        placeholder="Optional"
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.contact.website')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.officialSite || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, officialSite: e.target.value }))}
                                        placeholder="https://www..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>{t('profileEditor.contact.openingHours')}</Label>
                                    <div className="space-y-2 rounded-lg border border-border/60 p-4">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <div key={day} className="flex flex-wrap items-center gap-3">
                                                <span className="w-28 text-sm text-start">{t('profileEditor.contact.days.' + day)}</span>
                                                <Switch checked={hoursByDay[day]?.isOpen ?? false} onCheckedChange={(checked: boolean) => setDayOpen(day, checked)} />
                                                {hoursByDay[day]?.isOpen ? (
                                                    <>
                                                        <Input
                                                            type="time"
                                                            value={hoursByDay[day]?.openTime || '08:00'}
                                                            onChange={(event) => setDayTime(day, 'openTime', event.target.value)}
                                                            className="w-36"
                                                        />
                                                        <span>-</span>
                                                        <Input
                                                            type="time"
                                                            value={hoursByDay[day]?.closeTime || '20:00'}
                                                            onChange={(event) => setDayTime(day, 'closeTime', event.target.value)}
                                                            className="w-36"
                                                        />
                                                    </>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                        <h3 className="font-semibold text-sm">{t('profileEditor.contact.privacyContactTitle')}</h3>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactName')}</Label>
                                            <Input
                                                value={formData.privacyContact?.name || ''}
                                                onChange={e => updatePolicyContact('privacyContact', 'name', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactNamePlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactEmail')}</Label>
                                            <Input
                                                type="email"
                                                dir="ltr"
                                                className="text-start"
                                                value={formData.privacyContact?.email || ''}
                                                onChange={e => updatePolicyContact('privacyContact', 'email', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactEmailPlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactPhone')}</Label>
                                            <Input
                                                type="tel"
                                                dir="ltr"
                                                className="text-start"
                                                value={formData.privacyContact?.phone || ''}
                                                onChange={e => updatePolicyContact('privacyContact', 'phone', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactPhonePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                        <h3 className="font-semibold text-sm">{t('profileEditor.contact.accessibilityContactTitle')}</h3>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactName')}</Label>
                                            <Input
                                                value={formData.accessibilityContact?.name || ''}
                                                onChange={e => updatePolicyContact('accessibilityContact', 'name', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactNamePlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactEmail')}</Label>
                                            <Input
                                                type="email"
                                                dir="ltr"
                                                className="text-start"
                                                value={formData.accessibilityContact?.email || ''}
                                                onChange={e => updatePolicyContact('accessibilityContact', 'email', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactEmailPlaceholder')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.contact.contactPhone')}</Label>
                                            <Input
                                                type="tel"
                                                dir="ltr"
                                                className="text-start"
                                                value={formData.accessibilityContact?.phone || ''}
                                                onChange={e => updatePolicyContact('accessibilityContact', 'phone', e.target.value)}
                                                placeholder={t('profileEditor.contact.contactPhonePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {t('profileEditor.contact.fallbackHint')}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="location" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.location.title')}</CardTitle>
                                <CardDescription>{t('profileEditor.location.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('profileEditor.location.cityHebrew')}</Label>
                                        <Input
                                            value={formData.location?.city || ''}
                                            onChange={e => updateLocationField('city', e.target.value)}
                                            placeholder="e.g Petah Tikva"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('profileEditor.location.cityEnglish')}</Label>
                                        <Input
                                            value={formData.location?.cityEn || ''}
                                            onChange={e => updateLocationField('cityEn', e.target.value)}
                                            placeholder="e.g Petah Tikva"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.location.fullAddress')}</Label>
                                    <Input
                                        value={formData.location?.address || ''}
                                        onChange={e => handleAddressSuggest(e.target.value)}
                                        placeholder="e.g 15 Maccabi St, Petah Tikva"
                                    />
                                    {addressSuggestions.length > 0 ? (
                                        <div className="rounded-md border border-border/60 bg-background">
                                            {addressSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.placeId}
                                                    type="button"
                                                    className="block w-full px-3 py-2 text-start text-sm hover:bg-muted"
                                                    onClick={() => selectAddress(suggestion.description)}
                                                >
                                                    {suggestion.description}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('profileEditor.location.postalCode')}</Label>
                                        <Input
                                            value={formData.location?.postalCode || ''}
                                            onChange={e => updateLocationField('postalCode', e.target.value)}
                                            placeholder="e.g 4951123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('profileEditor.location.mapsLink')}</Label>
                                        <Input
                                            value={formData.location?.googleMapsUrl || ''}
                                            onChange={e => updateLocationField('googleMapsUrl', e.target.value)}
                                            placeholder="https://maps.google.com/..."
                                            dir="ltr"
                                            className="text-start"
                                        />
                                    </div>
                                </div>
                                {formData.location?.googleMapsUrl ? (
                                    <a
                                        href={formData.location.googleMapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        {t('profileEditor.location.openInMaps')}
                                    </a>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.location.instrumentsTitle')}</CardTitle>
                                <CardDescription>{t('profileEditor.location.instrumentsAutoHint')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {derivedInstruments.length > 0 ? (
                                        derivedInstruments.map((instrument) => (
                                            <Badge key={instrument} variant="secondary">{instrument}</Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{t('profileEditor.location.instrumentsEmpty')}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.team.title')}</CardTitle>
                                <CardDescription>{t('profileEditor.team.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-6 border rounded-xl p-6 bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">{t('profileEditor.team.manager')}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.team.photoUrl')}</Label>
                                            <Input
                                                value={formData.manager?.photoUrl || ''}
                                                onChange={e => updateManager('photoUrl', e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.team.nameHebrew')}</Label>
                                            <Input
                                                value={formData.manager?.name || ''}
                                                onChange={e => updateManager('name', e.target.value)}
                                                placeholder={t('profileEditor.team.managerNamePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <TranslatedFieldInput
                                        label={t('profileEditor.team.titleRole')}
                                        value={formData.manager?.role || ''}
                                        translations={{
                                            en: formData.translations?.en?.manager?.role,
                                            ar: formData.translations?.ar?.manager?.role,
                                            ru: formData.translations?.ru?.manager?.role,
                                        }}
                                        fieldKey="manager.role"
                                        onSourceChange={(val) => updateManager('role', val)}
                                        onTranslationChange={(loc, val) => handleTranslationChange('manager.role', loc, val)}
                                        isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                        isTranslating={isTranslating}
                                    />

                                    <TranslatedFieldInput
                                        label={t('profileEditor.team.shortBio')}
                                        value={formData.manager?.bio || ''}
                                        translations={{
                                            en: formData.translations?.en?.manager?.bio,
                                            ar: formData.translations?.ar?.manager?.bio,
                                            ru: formData.translations?.ru?.manager?.bio,
                                        }}
                                        fieldKey="manager.bio"
                                        isTextArea
                                        onSourceChange={(val) => updateManager('bio', val)}
                                        onTranslationChange={(loc, val) => handleTranslationChange('manager.bio', loc, val)}
                                        isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                        isTranslating={isTranslating}
                                    />
                                </div>

                                <div className="space-y-6 border rounded-xl p-6 bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">{t('profileEditor.team.pedagogicalCoordinator')}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('profileEditor.team.nameHebrew')}</Label>
                                            <Input
                                                value={formData.pedagogicalCoordinator?.name || ''}
                                                onChange={e => updatePedagogical('name', e.target.value)}
                                                placeholder={t('profileEditor.team.coordinatorNamePlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <TranslatedFieldInput
                                        label={t('profileEditor.team.titleRole')}
                                        value={formData.pedagogicalCoordinator?.role || ''}
                                        translations={{
                                            en: formData.translations?.en?.pedagogicalCoordinator?.role,
                                            ar: formData.translations?.ar?.pedagogicalCoordinator?.role,
                                            ru: formData.translations?.ru?.pedagogicalCoordinator?.role,
                                        }}
                                        fieldKey="pedagogicalCoordinator.role"
                                        onSourceChange={(val) => updatePedagogical('role', val)}
                                        onTranslationChange={(loc, val) => handleTranslationChange('pedagogicalCoordinator.role', loc, val)}
                                        isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                        isTranslating={isTranslating}
                                    />

                                    <TranslatedFieldInput
                                        label={t('profileEditor.team.shortBio')}
                                        value={formData.pedagogicalCoordinator?.bio || ''}
                                        translations={{
                                            en: formData.translations?.en?.pedagogicalCoordinator?.bio,
                                            ar: formData.translations?.ar?.pedagogicalCoordinator?.bio,
                                            ru: formData.translations?.ru?.pedagogicalCoordinator?.bio,
                                        }}
                                        fieldKey="pedagogicalCoordinator.bio"
                                        isTextArea
                                        onSourceChange={(val) => updatePedagogical('bio', val)}
                                        onTranslationChange={(loc, val) => handleTranslationChange('pedagogicalCoordinator.bio', loc, val)}
                                        isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                        isTranslating={isTranslating}
                                    />
                                </div>

                                {/* Dynamic Leading Team */}
                                {formData.leadingTeam?.map((member, index) => (
                                    <div key={index} className="space-y-6 border rounded-xl p-6 bg-muted/10 relative">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                {t('profileEditor.team.additionalMember')} {index + 1}
                                            </Badge>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => removeLeadingTeamMember(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{t('profileEditor.team.photoUrl')}</Label>
                                                <Input
                                                    value={member.photoUrl || ''}
                                                    onChange={e => updateLeadingTeamMember(index, 'photoUrl', e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('profileEditor.team.nameHebrew')}</Label>
                                                <Input
                                                    value={member.name || ''}
                                                    onChange={e => updateLeadingTeamMember(index, 'name', e.target.value)}
                                                    placeholder={t('profileEditor.team.memberNamePlaceholder')}
                                                />
                                            </div>
                                        </div>

                                        <TranslatedFieldInput
                                            label={t('profileEditor.team.titleRole')}
                                            value={member.role || ''}
                                            translations={{
                                                en: formData.translations?.en?.leadingTeam?.[index]?.role,
                                                ar: formData.translations?.ar?.leadingTeam?.[index]?.role,
                                                ru: formData.translations?.ru?.leadingTeam?.[index]?.role,
                                            }}
                                            fieldKey={`leadingTeam.${index}.role`}
                                            onSourceChange={(val) => updateLeadingTeamMember(index, 'role', val)}
                                            onTranslationChange={(loc, val) => handleTranslationChange(`leadingTeam.${index}.role`, loc, val)}
                                            isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                            isTranslating={isTranslating}
                                            overriddenLocales={Object.entries(formData.translationMeta?.overrides || {})
                                                .filter(([_, fields]) => fields.includes(`leadingTeam.${index}.role`))
                                                .map(([loc]) => loc)}
                                        />

                                        <TranslatedFieldInput
                                            label={t('profileEditor.team.shortBio')}
                                            value={member.bio || ''}
                                            translations={{
                                                en: formData.translations?.en?.leadingTeam?.[index]?.bio,
                                                ar: formData.translations?.ar?.leadingTeam?.[index]?.bio,
                                                ru: formData.translations?.ru?.leadingTeam?.[index]?.bio,
                                            }}
                                            fieldKey={`leadingTeam.${index}.bio`}
                                            isTextArea
                                            onSourceChange={(val) => updateLeadingTeamMember(index, 'bio', val)}
                                            onTranslationChange={(loc, val) => handleTranslationChange(`leadingTeam.${index}.bio`, loc, val)}
                                            isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                            isTranslating={isTranslating}
                                            overriddenLocales={Object.entries(formData.translationMeta?.overrides || {})
                                                .filter(([_, fields]) => fields.includes(`leadingTeam.${index}.bio`))
                                                .map(([loc]) => loc)}
                                        />
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-dashed"
                                    onClick={addLeadingTeamMember}
                                >
                                    <Plus className="w-4 h-4 me-2" />
                                    {t('profileEditor.team.addMember')}
                                </Button>

                                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                    {t('profileEditor.team.note')}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.social.title')}</CardTitle>
                                <CardDescription>{t('profileEditor.social.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.social.facebook')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.facebook || ''}
                                        onChange={e => updateSocial('facebook', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.social.instagram')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.instagram || ''}
                                        onChange={e => updateSocial('instagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.social.youtube')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.youtube || ''}
                                        onChange={e => updateSocial('youtube', e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.social.tiktok')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.tiktok || ''}
                                        onChange={e => updateSocial('tiktok', e.target.value)}
                                        placeholder="https://tiktok.com/@..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profileEditor.media.title')}</CardTitle>
                                <CardDescription>{t('profileEditor.media.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.media.headerImage')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[0] || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, photoUrls: [e.target.value, ...(prev.photoUrls?.slice(1) || [])] }))}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.media.galleryImage1')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[1] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[1] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.media.galleryImage2')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[2] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[2] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('profileEditor.media.galleryImage3')}</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[3] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[3] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-start"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="sticky bottom-0 z-20 border rounded-lg bg-background/95 backdrop-blur-sm p-3 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setFormData(currentCons)}>
                        {tUi('footer.resetChanges')}
                    </Button>
                    <Button type="submit" disabled={isSaving || isTranslating}>
                        {isSaving ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> {tUi('footer.saving')}</span> : <span className="flex items-center gap-2"><Save className="w-4 h-4" /> {tUi('footer.saveProfile')}</span>}
                    </Button>
                </div>
            </form>
        </div>
    );
}


