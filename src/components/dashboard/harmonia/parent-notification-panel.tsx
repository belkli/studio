'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellRing, Smartphone, Mail, AlertTriangle, Clock, Settings, Save } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function ParentNotificationPanel() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const t = useTranslations('ParentNotificationPanel');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    // Preferences state
    const [prefs, setPrefs] = useState({
        attendanceSms: true,
        attendanceEmail: false,
        paymentSms: false,
        paymentEmail: true,
        generalSms: false,
        generalEmail: true,
        marketingSms: false,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
    });

    const handleToggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast({ title: t('successMsg'), variant: 'default' });
        }, 800);
    };

    return (
        <Card className="max-w-3xl border-t-4 border-t-purple-600 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-purple-600" />
                    {t('panelTitle')}
                </CardTitle>
                <CardDescription>
                    {t('panelDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Channels Grid */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><Settings className="w-4 h-4" /> {t('channelsTitle')}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-medium text-sm text-center mb-2 px-4">
                        <div className={`hidden md:block text-start`}>{t('colUpdateType')}</div>
                        <div className="flex items-center justify-center gap-2 text-blue-700 bg-blue-50 py-2 rounded-md"><Smartphone className="w-4 h-4" /> {t('colSms')}</div>
                        <div className="flex items-center justify-center gap-2 text-indigo-700 bg-indigo-50 py-2 rounded-md"><Mail className="w-4 h-4" /> {t('colEmail')}</div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                            <div className="font-semibold flex items-center gap-2">
                                {t('rowAttendance')}
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex justify-center"><Switch checked={prefs.attendanceSms} onCheckedChange={() => handleToggle('attendanceSms')} /></div>
                            <div className="flex justify-center"><Switch checked={prefs.attendanceEmail} onCheckedChange={() => handleToggle('attendanceEmail')} /></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                            <div className="font-semibold">{t('rowPayments')}</div>
                            <div className="flex justify-center"><Switch checked={prefs.paymentSms} onCheckedChange={() => handleToggle('paymentSms')} /></div>
                            <div className="flex justify-center"><Switch checked={prefs.paymentEmail} onCheckedChange={() => handleToggle('paymentEmail')} /></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                            <div className="font-semibold">{t('rowEvents')}</div>
                            <div className="flex justify-center"><Switch checked={prefs.generalSms} onCheckedChange={() => handleToggle('generalSms')} /></div>
                            <div className="flex justify-center"><Switch checked={prefs.generalEmail} onCheckedChange={() => handleToggle('generalEmail')} /></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                            <div className="font-semibold text-muted-foreground">{t('rowMarketing')}</div>
                            <div className="flex justify-center"><Switch checked={prefs.marketingSms} onCheckedChange={() => handleToggle('marketingSms')} /></div>
                            <div className="flex justify-center"><Switch disabled checked={false} /></div>
                        </div>
                    </div>
                </div>

                {/* Quiet Hours */}
                <div className="bg-muted/30 p-5 rounded-xl border space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-600" />
                                {t('quietHoursTitle')}
                            </Label>
                            <span className="text-sm text-muted-foreground mt-1">
                                {t('quietHoursDesc')}
                            </span>
                        </div>
                        <Switch checked={prefs.quietHoursEnabled} onCheckedChange={() => handleToggle('quietHoursEnabled')} />
                    </div>

                    {prefs.quietHoursEnabled && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t mt-4">
                            <div className="space-y-2">
                                <Label>{t('fromTimeLabel')}</Label>
                                <Select dir={isRtl ? 'rtl' : 'ltr'} value={prefs.quietHoursStart} onValueChange={(val) => setPrefs(prev => ({ ...prev, quietHoursStart: val }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20:00">20:00</SelectItem>
                                        <SelectItem value="21:00">21:00</SelectItem>
                                        <SelectItem value="22:00">22:00</SelectItem>
                                        <SelectItem value="23:00">23:00</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('untilTimeLabel')}</Label>
                                <Select dir={isRtl ? 'rtl' : 'ltr'} value={prefs.quietHoursEnd} onValueChange={(val) => setPrefs(prev => ({ ...prev, quietHoursEnd: val }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="06:00">06:00 {t('morningLabel')}</SelectItem>
                                        <SelectItem value="07:00">07:00 {t('morningLabel')}</SelectItem>
                                        <SelectItem value="08:00">08:00 {t('morningLabel')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="px-8">
                        {isSaving ? t('savingBtn') : <><Save className="w-4 h-4 me-2" /> {t('saveBtn')}</>}
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
