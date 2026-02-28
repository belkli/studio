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
import { SocialMediaLinks, ConservatoriumDepartment, Conservatorium } from '@/lib/types';
import { translateProfileContent } from '@/app/actions/translate';

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
        try {
            updateConservatorium({ ...currentCons, ...formData } as Conservatorium);
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

    const handleAutoTranslate = async () => {
        setIsTranslating(true);
        toast({
            title: 'Translation Started',
            description: 'Translating profile content to English, Arabic, and Russian via Gemini AI...',
        });

        try {
            const result = await translateProfileContent({
                about: formData.about,
                openingHours: formData.openingHours
            });

            if (result.success && result.translations) {
                const updatedData = {
                    ...formData,
                    translations: result.translations
                };

                setFormData(updatedData);
                updateConservatorium({ ...currentCons, ...updatedData } as Conservatorium);

                toast({
                    title: 'Translation Complete',
                    description: 'Content has been translated and saved.',
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Translation Failed',
                description: 'Could not complete the auto-translation.',
            });
        } finally {
            setIsTranslating(false);
        }
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
                ...prev.manager!,
                [key]: value
            }
        }));
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Public Profile (About Us)</h1>
                    <p className="text-muted-foreground">Manage the information displayed on the public directory.</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-primary/30 hover:bg-primary/5 text-primary"
                    onClick={handleAutoTranslate}
                    disabled={isTranslating}
                >
                    {isTranslating ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Auto-Translate via Gemini
                </Button>
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
                        <TabsTrigger value="translations" className="flex items-center gap-2"><Languages className="w-4 h-4" /> Translations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Primary details about the conservatorium.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name (Hebrew)</Label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g קונסרבטוריון פתח תקווה"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Name (English)</Label>
                                        <Input
                                            value={formData.nameEn || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                                            placeholder="e.g Petah Tikva Conservatorium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>About Us (Description)</Label>
                                    <Textarea
                                        rows={5}
                                        value={formData.about || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, about: e.target.value }))}
                                        placeholder="Write a short description about the conservatorium, its history, and vision..."
                                    />
                                </div>
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
                            <CardContent className="space-y-4">
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
                                <div className="space-y-2">
                                    <Label>Opening Hours</Label>
                                    <Input
                                        value={formData.openingHours || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, openingHours: e.target.value }))}
                                        placeholder="e.g Sun-Thu 14:00-20:00"
                                    />
                                </div>
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
                            <CardContent className="space-y-6">
                                <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                                    <h3 className="font-semibold text-sm">Manager</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={formData.manager?.name || ''}
                                                onChange={e => updateManager('name', e.target.value)}
                                                placeholder="Manager's Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title / Role</Label>
                                            <Input
                                                value={formData.manager?.role || ''}
                                                onChange={e => updateManager('role', e.target.value)}
                                                placeholder="Manager"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Bio</Label>
                                        <Textarea
                                            rows={2}
                                            value={formData.manager?.bio || ''}
                                            onChange={e => updateManager('bio', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Photo URL</Label>
                                        <Input
                                            value={formData.manager?.photoUrl || ''}
                                            onChange={e => updateManager('photoUrl', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                                    <h3 className="font-semibold text-sm">Pedagogical Coordinator</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={formData.pedagogicalCoordinator?.name || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, pedagogicalCoordinator: { ...prev.pedagogicalCoordinator!, name: e.target.value } }))}
                                                placeholder="Coordinator's Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title / Role</Label>
                                            <Input
                                                value={formData.pedagogicalCoordinator?.role || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, pedagogicalCoordinator: { ...prev.pedagogicalCoordinator!, role: e.target.value } }))}
                                                placeholder="Pedagogical Coordinator"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Bio</Label>
                                        <Textarea
                                            rows={2}
                                            value={formData.pedagogicalCoordinator?.bio || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, pedagogicalCoordinator: { ...prev.pedagogicalCoordinator!, bio: e.target.value } }))}
                                        />
                                    </div>
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
                                <p className="text-sm text-muted-foreground">Add URLs to high-quality images of your facilities, events, and ensembles.</p>
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

                    <TabsContent value="translations" className="space-y-4 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Automatic Translations</CardTitle>
                                <CardDescription>Review the AI-generated translations for other languages.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!formData.translations ? (
                                    <div className="text-center py-8 space-y-3">
                                        <Languages className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                                        <p className="text-sm text-muted-foreground">No translations generated yet.</p>
                                        <Button variant="outline" size="sm" onClick={handleAutoTranslate} disabled={isTranslating}>
                                            Generate Translations Now
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {['en', 'ar', 'ru'].map(lang => (
                                            <div key={lang} className="space-y-3 p-4 border rounded-xl bg-muted/10">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="uppercase">{lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : 'Russian'}</Badge>
                                                    <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" /> Auto-translated
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">About Us</Label>
                                                    <p className="text-sm text-muted-foreground border rounded-lg p-2 bg-background">
                                                        {(formData.translations as any)[lang]?.about || 'No translation available'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
