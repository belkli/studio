
'use client';

import { useState } from 'react';
import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UserPlus, ShieldCheck, ArrowRight, LayoutDashboard, Settings, Users } from "lucide-react";
import { BRAND_SUPPORT_EMAIL } from '@/lib/brand';
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from 'next/navigation';

export default function AcceptInvitePage() {
    const t = useTranslations('CoordinatorInvite');
    const { inviteToken } = useParams();
    const router = useRouter();
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAccept = async () => {
        setIsAccepting(true);
        // Simulate acceptance logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsAccepting(false);
        toast({ title: t('welcomeTitle'), description: t('welcomeDesc') });
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 mb-4">
                        <UserPlus className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('title')}</h1>
                    <p className="text-slate-500 font-medium">{t('subtitle', { token: inviteToken as string })}</p>
                </div>

                <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                        <ShieldCheck className="absolute top-4 end-4 h-12 w-12 text-white/10" />
                        <h2 className="text-xl font-bold">{t('cardTitle')}</h2>
                        <p className="text-indigo-100 text-sm mt-1">{t('cardDesc')}</p>
                    </div>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('capabilitiesTitle')}</h3>
                            <ul className="space-y-3">
                                {[
                                    { icon: <LayoutDashboard className="h-4 w-4" />, text: t('cap1') },
                                    { icon: <Users className="h-4 w-4" />, text: t('cap2') },
                                    { icon: <CheckCircle2 className="h-4 w-4" />, text: t('cap3') },
                                    { icon: <Settings className="h-4 w-4" />, text: t('cap4') },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                        <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            {item.icon}
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-md shadow-lg shadow-indigo-600/20"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            {isAccepting ? t('processing') : t('acceptBtn')}
                            <ArrowRight className="ms-2 h-5 w-5" />
                        </Button>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-center">
                        <p className="text-xs text-slate-400">{t('questions', { support: 'Support' })} <a href={`mailto:${BRAND_SUPPORT_EMAIL}`} className="text-indigo-600 hover:underline">Support</a></p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
