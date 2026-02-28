'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Contact, MapPin, Users, Share2, Save, Image as ImageIcon, Sparkles, Languages } from 'lucide-react';
import { SocialMediaLinks, ConservatoriumDepartment, Conservatorium, TranslationMeta, ConservatoriumTranslations, ConservatoriumStaffMember } from '@/lib/types';
import { translateConservatoriumProfile } from '@/app/actions/translate';
import { TranslatedFieldInput } from '@/components/dashboard/harmonia/translated-field-input';
import { computeConservatoriumSourceHash } from '@/lib/utils/translation-hash';

export default function ConservatoriumProfileEditor() {
    const t = useTranslations('SettingsPage.conservatorium');
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [formData, setFormData] = useState<Partial<Conservatorium>>({});

    const currentCons = conservatoriums.find(c => c.id === user?.conservatoriumId);

    useEffect(() => {
        if (currentCons) {
            setFormData(currentCons);
        }
    }, [currentCons]);

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
                title: 'Content Changed',
                description: 'Updating AI translations to match your new content...',
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
                title: 'Profile Saved',
                description: 'The conservatorium public profile has been updated.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error Saving',
                description: 'Failed to update the profile.',
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
            toast({ title: 'Translations Updated' });
        }
        setIsTranslating(false);
    };

    const handleTranslationChange = (field: string, locale: string, value: string) => {
        setFormData(prev => {
            const currentTranslations = prev.translations || {};
            const localeData = (currentTranslations as any)[locale] || {};

            // Deep update for nested fields like manager.role
            const newLocaleData = { ...localeData };
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                newLocaleData[parent] = { ...newLocaleData[parent], [child]: value };
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

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Public Profile (About Us)</h1>
                    <p className="text-muted-foreground">Manage the multilingual profile shown on the public directory.</p>
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
                        Force Re-translate
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="flex flex-wrap h-auto mb-6 bg-muted/50 p-1">
                        <TabsTrigger value="basic" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Basic Info</TabsTrigger>
                        <TabsTrigger value="contact" className="flex items-center gap-2"><Contact className="w-4 h-4" /> Contact</TabsTrigger>
                        <TabsTrigger value="location" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</TabsTrigger>
                        <TabsTrigger value="team" className="flex items-center gap-2"><Users className="w-4 h-4" /> Team</TabsTrigger>
                        <TabsTrigger value="social" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Social</TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Media</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Primary details about the conservatorium.</CardDescription>
                                </div>
                                {computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 h-6">
                                        <Sparkles className="w-3 h-3" />
                                        Pending Sync
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <TranslatedFieldInput
                                    label="Conservatorium Name"
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
                                    label="About Us (Description)"
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
                                    <Label>Founded Year</Label>
                                    <Input
                                        type="number"
                                        value={formData.foundedYear || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, foundedYear: parseInt(e.target.value) }))}
                                        placeholder="e.g 1995"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Details</CardTitle>
                                <CardDescription>How prospective students and parents can reach you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Main Phone</Label>
                                        <Input
                                            type="tel"
                                            value={formData.tel || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                                            placeholder="e.g 03-1234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp Number</Label>
                                        <Input
                                            type="tel"
                                            value={formData.socialMedia?.whatsapp || ''}
                                            onChange={e => updateSocial('whatsapp', e.target.value)}
                                            placeholder="e.g 054-1234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Primary Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="e.g office@conservatory.co.il"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secondary Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.secondaryEmail || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, secondaryEmail: e.target.value }))}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Official Website</Label>
                                    <Input
                                        type="url"
                                        value={formData.officialSite || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, officialSite: e.target.value }))}
                                        placeholder="https://www..."
                                    />
                                </div>

                                <TranslatedFieldInput
                                    label="Opening Hours"
                                    value={formData.openingHours || ''}
                                    translations={{
                                        en: formData.translations?.en?.openingHours,
                                        ar: formData.translations?.ar?.openingHours,
                                        ru: formData.translations?.ru?.openingHours,
                                    }}
                                    fieldKey="openingHours"
                                    onSourceChange={(val) => setFormData(prev => ({ ...prev, openingHours: val }))}
                                    onTranslationChange={(loc, val) => handleTranslationChange('openingHours', loc, val)}
                                    isStale={computeConservatoriumSourceHash(formData) !== formData.translationMeta?.sourceHash}
                                    isTranslating={isTranslating}
                                    overriddenLocales={Object.entries(formData.translationMeta?.overrides || {})
                                        .filter(([_, fields]) => fields.includes('openingHours'))
                                        .map(([loc]) => loc)}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                                <CardDescription>Where are you located?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City (Hebrew)</Label>
                                        <Input
                                            value={formData.location?.city || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location!, city: e.target.value } }))}
                                            placeholder="e.g פתח תקווה"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City (English)</Label>
                                        <Input
                                            value={formData.location?.cityEn || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location!, cityEn: e.target.value } }))}
                                            placeholder="e.g Petah Tikva"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Address</Label>
                                    <Input
                                        value={formData.location?.address || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location!, address: e.target.value } }))}
                                        placeholder="e.g 15 Maccabi St, Petah Tikva"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leadership Team</CardTitle>
                                <CardDescription>Key figures in the conservatorium.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-6 border rounded-xl p-6 bg-muted/20">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">Manager</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Photo URL</Label>
                                            <Input
                                                value={formData.manager?.photoUrl || ''}
                                                onChange={e => updateManager('photoUrl', e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Name (Hebrew)</Label>
                                            <Input
                                                value={formData.manager?.name || ''}
                                                onChange={e => updateManager('name', e.target.value)}
                                                placeholder="Manager's Name"
                                            />
                                        </div>
                                    </div>

                                    <TranslatedFieldInput
                                        label="Title / Role"
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
                                        label="Short Bio"
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
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">Pedagogical Coordinator</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name (Hebrew)</Label>
                                            <Input
                                                value={formData.pedagogicalCoordinator?.name || ''}
                                                onChange={e => updatePedagogical('name', e.target.value)}
                                                placeholder="Coordinator's Name"
                                            />
                                        </div>
                                    </div>

                                    <TranslatedFieldInput
                                        label="Title / Role"
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
                                        label="Short Bio"
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Media Links</CardTitle>
                                <CardDescription>Connect your online presence.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Facebook URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.facebook || ''}
                                        onChange={e => updateSocial('facebook', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.instagram || ''}
                                        onChange={e => updateSocial('instagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>YouTube Channel URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.youtube || ''}
                                        onChange={e => updateSocial('youtube', e.target.value)}
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>TikTok URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.socialMedia?.tiktok || ''}
                                        onChange={e => updateSocial('tiktok', e.target.value)}
                                        placeholder="https://tiktok.com/@..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Photos & Media</CardTitle>
                                <CardDescription>Images displayed on your public profile.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Header Image URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[0] || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, photoUrls: [e.target.value, ...(prev.photoUrls?.slice(1) || [])] }))}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 1 URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[1] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[1] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 2 URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[2] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[2] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 3 URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.photoUrls?.[3] || ''}
                                        onChange={e => setFormData(prev => {
                                            const photos = [...(prev.photoUrls || [])];
                                            photos[3] = e.target.value;
                                            return { ...prev, photoUrls: photos };
                                        })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/80 backdrop-blur-sm shadow-md flex justify-end gap-2 z-10 w-full sm:w-[calc(100%-16rem)] sm:ml-64 transition-all">
                    <Button type="button" variant="outline" onClick={() => setFormData(currentCons)}>Cancel</Button>
                    <Button type="submit" disabled={isSaving || isTranslating}>
                        {isSaving ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</span> : <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</span>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

