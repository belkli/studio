'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Contact, MapPin, Users, Share2, Save, Image as ImageIcon } from 'lucide-react';
import { SocialMediaLinks, ConservatoriumDepartment } from '@/lib/types';

export default function ConservatoriumProfileEditor() {
    const t = useTranslations('SettingsPage.conservatorium');
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return null;
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        toast({
            title: 'Profile Saved',
            description: 'The conservatorium public profile has been updated.',
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold">Public Profile (About Us)</h1>
                <p className="text-muted-foreground">Manage the information displayed on the public directory.</p>
            </div>

            <form onSubmit={handleSave}>
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="flex flex-wrap h-auto mb-6">
                        <TabsTrigger value="basic" className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Basic Info</TabsTrigger>
                        <TabsTrigger value="contact" className="flex items-center gap-2"><Contact className="w-4 h-4" /> Contact</TabsTrigger>
                        <TabsTrigger value="location" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</TabsTrigger>
                        <TabsTrigger value="team" className="flex items-center gap-2"><Users className="w-4 h-4" /> Team</TabsTrigger>
                        <TabsTrigger value="social" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Social</TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Media</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Primary details about the conservatorium.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name (Hebrew)</Label>
                                        <Input defaultValue={user.conservatoriumName} placeholder="e.g קונסרבטוריון פתח תקווה" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Name (English)</Label>
                                        <Input placeholder="e.g Petah Tikva Conservatorium" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>About Us (Description)</Label>
                                    <Textarea rows={5} placeholder="Write a short description about the conservatorium, its history, and vision..." />
                                </div>
                                <div className="space-y-2 max-w-sm">
                                    <Label>Founded Year</Label>
                                    <Input type="number" placeholder="e.g 1995" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Details</CardTitle>
                                <CardDescription>How prospective students and parents can reach you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Main Phone</Label>
                                        <Input type="tel" placeholder="e.g 03-1234567" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp Number</Label>
                                        <Input type="tel" placeholder="e.g 054-1234567" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Primary Email</Label>
                                        <Input type="email" placeholder="e.g office@conservatory.co.il" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secondary Email</Label>
                                        <Input type="email" placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Official Website</Label>
                                    <Input type="url" placeholder="https://www..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Opening Hours</Label>
                                    <Input placeholder="e.g Sun-Thu 14:00-20:00" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                                <CardDescription>Where are you located?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City (Hebrew)</Label>
                                        <Input placeholder="e.g פתח תקווה" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City (English)</Label>
                                        <Input placeholder="e.g Petah Tikva" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Address</Label>
                                    <Input placeholder="e.g 15 Maccabi St, Petah Tikva" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leadership Team</CardTitle>
                                <CardDescription>Key figures in the conservatorium.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                    <h3 className="font-semibold text-sm">Manager</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input placeholder="Manager's Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title / Role</Label>
                                            <Input defaultValue="Manager" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Bio</Label>
                                        <Textarea rows={2} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Photo URL</Label>
                                        <Input placeholder="https://..." />
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                    <h3 className="font-semibold text-sm">Pedagogical Coordinator</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input placeholder="Coordinator's Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title / Role</Label>
                                            <Input defaultValue="Pedagogical Coordinator" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Short Bio</Label>
                                        <Textarea rows={2} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Media Links</CardTitle>
                                <CardDescription>Connect your online presence.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Facebook URL</Label>
                                    <Input type="url" placeholder="https://facebook.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram URL</Label>
                                    <Input type="url" placeholder="https://instagram.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>YouTube Channel URL</Label>
                                    <Input type="url" placeholder="https://youtube.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>TikTok URL</Label>
                                    <Input type="url" placeholder="https://tiktok.com/@..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Photos & Media</CardTitle>
                                <CardDescription>Images displayed on your public profile.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">Add URLs to high-quality images of your facilities, events, and ensembles.</p>
                                <div className="space-y-2">
                                    <Label>Header Image URL</Label>
                                    <Input type="url" placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 1 URL</Label>
                                    <Input type="url" placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 2 URL</Label>
                                    <Input type="url" placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gallery Image 3 URL</Label>
                                    <Input type="url" placeholder="https://..." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/80 backdrop-blur-sm shadow-md flex justify-end gap-2 z-10 w-full sm:w-[calc(100%-16rem)] sm:ml-64 transition-all">
                    <Button type="button" variant="outline">Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Saving...</span> : <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</span>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
