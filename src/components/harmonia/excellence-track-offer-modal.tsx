
'use client';

import { useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Loader2, Sparkles, Music, Users, GraduationCap, Coins } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { acceptExcellenceTrackOffer, declineExcellenceTrackOffer } from "@/app/actions";
import { Textarea } from "@/components/ui/textarea";

interface ExcellenceTrackOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

export function ExcellenceTrackOfferModal({ isOpen, onClose, studentId, studentName: _studentName }: ExcellenceTrackOfferModalProps) {
    const t = useTranslations('ExcellenceTrack');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [showDeclineForm, setShowDeclineForm] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const result = await acceptExcellenceTrackOffer({ studentId });
            toast({ title: t('successTitle'), description: result.message });
            onClose();
        } catch {
            toast({ variant: 'destructive', title: t('errorTitle'), description: t('errorDesc') });
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        try {
            const result = await declineExcellenceTrackOffer({ studentId, reason: declineReason });
            toast({ title: t('declineTitle'), description: result.message });
            onClose();
        } catch {
            toast({ variant: 'destructive', title: t('errorTitle'), description: t('errorDesc') });
        } finally {
            setIsDeclining(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
                    <Sparkles className="absolute top-4 end-4 h-12 w-12 text-white/20 animate-pulse" />
                    <DialogHeader>
                        <Badge className="w-fit bg-white/20 hover:bg-white/30 text-white border-none mb-4 px-3 py-1 text-xs uppercase tracking-wider font-bold">
                            <Star className="h-3 w-3 me-2 fill-yellow-400 text-yellow-400" />
                            {t('badgeLabel')}
                        </Badge>
                        <DialogTitle className="text-3xl font-black">{t('offerTitle')}</DialogTitle>
                        <DialogDescription className="text-indigo-100 text-lg font-medium mt-2">
                            {t('offerSubtitle')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {!showDeclineForm ? (
                        <>
                            <p className="text-slate-600 leading-relaxed">
                                {t('offerDescription')}
                            </p>

                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                                    {t('benefits')}
                                </h3>
                                <div className="grid gap-3">
                                    {[1, 2, 3].map((num) => (
                                        <div key={num} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-colors hover:bg-indigo-50/50 hover:border-indigo-100">
                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                                {num === 1 && <Music className="h-5 w-5 text-indigo-600" />}
                                                {num === 2 && <Users className="h-5 w-5 text-indigo-600" />}
                                                {num === 3 && <GraduationCap className="h-5 w-5 text-indigo-600" />}
                                            </div>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            <p className="text-sm font-semibold text-slate-700 pt-2">{t(`benefit${num}` as any)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900">{t('tuitionTitle')}</h4>
                                    <p className="text-sm text-indigo-700/80 mt-1">{t('tuitionDescription')}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-slate-900">{t('declineReasonLabel')}</h4>
                            <Textarea
                                placeholder={t('notInterestedReason')}
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    {!showDeclineForm ? (
                        <>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-md shadow-lg shadow-indigo-600/20"
                                onClick={handleAccept}
                                disabled={isAccepting || isDeclining}
                            >
                                {isAccepting ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="me-2 h-5 w-5" />}
                                {t('acceptBtn')}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-slate-200 font-semibold text-slate-600 hover:bg-white hover:text-slate-900"
                                onClick={() => setShowDeclineForm(true)}
                                disabled={isAccepting || isDeclining}
                            >
                                {t('declineBtn')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-md"
                                onClick={handleDecline}
                                disabled={isAccepting || isDeclining}
                            >
                                {isDeclining ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : null}
                                {t('declineBtn')}
                            </Button>
                            <Button
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl font-semibold text-slate-500 hover:bg-slate-200"
                                onClick={() => setShowDeclineForm(false)}
                                disabled={isAccepting || isDeclining}
                            >
                                {t('backBtn')}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
