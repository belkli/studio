'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Music, Share2, Star, Zap } from "lucide-react";
import { useRouter } from '@/i18n/routing';
import { format, isToday, isTomorrow } from "date-fns";
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations, useLocale } from 'next-intl';
import type { EmptySlot } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SlotPromotionCardProps {
    slot: EmptySlot;
}

export function SlotPromotionCard({ slot }: SlotPromotionCardProps) {
    const { toast } = useToast();
    const t = useTranslations('SlotPromotionCard');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const { conservatoriums, user } = useAuth();
    const router = useRouter();

    const conservatorium = conservatoriums.find(c => c.id === slot.teacher.conservatoriumId);
    const city = conservatorium?.location?.city || slot.teacher.conservatoriumName || '';
    const consName = conservatorium?.name || slot.teacher.conservatoriumName || '';

    const isSlotToday = isToday(slot.startTime);
    const isSlotTomorrow = isTomorrow(slot.startTime);

    const urgencyLabel = isSlotToday
        ? t('today')
        : isSlotTomorrow
        ? t('tomorrow')
        : format(slot.startTime, 'EEE d/M', { locale: dateLocale });

    const timeLabel = format(slot.startTime, 'HH:mm');

    const handleShare = async () => {
        const shareData = {
            title: t('shareTitle'),
            text: t('shareText', { instrument: slot.instrument, teacher: slot.teacher.name, price: String(slot.promotionalPrice) }),
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast({ title: t('linkCopied'), description: t('linkCopiedDesc') });
            }
        } catch {
            toast({ variant: 'destructive', title: t('shareError'), description: t('shareErrorDesc') });
        }
    };

    const handleBookNow = () => {
        sessionStorage.setItem('pending_slot', JSON.stringify({
            id: slot.id,
            teacherId: slot.teacher.id,
            instrument: slot.instrument,
            startTime: slot.startTime.toISOString(),
            durationMinutes: slot.durationMinutes,
            promotionalPrice: slot.promotionalPrice,
            basePrice: slot.basePrice,
            discount: slot.discount,
        }));

        if (user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push('/dashboard/schedule/book?tab=deals' as any);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(`/register?teacher=${slot.teacher.id}&conservatorium=${slot.teacher.conservatoriumId}` as any);
        }
    };

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={handleBookNow}
            className="group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-200 overflow-hidden cursor-pointer"
        >
            {/* ── Urgency strip — full-width top bar ── */}
            <div className={cn(
                "flex items-center justify-between px-4 py-2",
                isSlotToday ? "bg-amber-500" : "bg-indigo-500"
            )}>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                    <Zap className="h-3.5 w-3.5" />
                    {urgencyLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white tabular-nums">
                    <Clock className="h-3.5 w-3.5" />
                    {timeLabel}
                </span>
            </div>

            {/* ── Teacher info ── */}
            <div className="flex items-start gap-3 px-4 pt-3 pb-3">
                <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/30 mt-0.5">
                    <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                    <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                        {slot.teacher.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-50 text-base leading-snug">
                        {slot.teacher.name}
                    </p>
                    {slot.teacher.isPremiumTeacher && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5 mt-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            Premium
                        </span>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {consName}
                    </p>
                </div>
            </div>

            {/* ── Metadata rows ── */}
            <div className="px-4 pb-3 space-y-2">
                {/* Instrument + duration badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 border border-indigo-200 dark:border-indigo-700">
                        <Music className="h-3 w-3 shrink-0" />
                        {slot.instrument}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 border border-slate-200 dark:border-slate-700">
                        <Clock className="h-3 w-3 shrink-0" />
                        {slot.durationMinutes} {t('minutes')}
                    </span>
                </div>

                {/* Location */}
                {city && (
                    <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400 mt-0.5" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                            {city}
                        </span>
                    </div>
                )}

                {/* Date */}
                <div className="flex items-start gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        {format(slot.startTime, 'EEEE, d/M', { locale: dateLocale })}
                    </span>
                </div>
            </div>

            {/* ── Price + CTA ── */}
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                {/* Price row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-green-600 dark:text-green-400 tabular-nums">
                            ₪{slot.promotionalPrice}
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through tabular-nums">
                            ₪{slot.basePrice}
                        </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-500 text-white text-xs font-bold px-2.5 py-1 shadow-sm">
                        -{slot.discount}%
                    </span>
                </div>

                {/* CTA row */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button
                        className="flex-1 font-semibold shadow-sm"
                        onClick={handleBookNow}
                    >
                        {t('bookNow')}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="shrink-0 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        aria-label={t('shareTitle')}
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
