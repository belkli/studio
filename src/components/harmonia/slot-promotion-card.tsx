'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            router.push('/dashboard/schedule/book?tab=deals' as any);
        } else {
            router.push(`/register?teacher=${slot.teacher.id}&conservatorium=${slot.teacher.conservatoriumId}` as any);
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                    <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                        {slot.teacher.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    {/* High contrast teacher name — slate-900 */}
                    <p className="font-bold text-slate-900 dark:text-slate-50 text-[15px] leading-tight truncate">
                        {slot.teacher.name}
                    </p>
                    {/* Conservatorium — slate-600 minimum for 4.5:1 */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {consName}
                    </p>
                </div>
            </div>

            {/* ── Metadata rows ── */}
            <div className="px-4 pb-3 space-y-2.5">
                {/* Instrument + duration badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Solid indigo badge — much easier to read than bg-primary/10 */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 border border-indigo-200 dark:border-indigo-700">
                        <Music className="h-3 w-3" />
                        {slot.instrument}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 border border-slate-200 dark:border-slate-700">
                        <Clock className="h-3 w-3" />
                        {slot.durationMinutes} {t('minutes')}
                    </span>
                </div>

                {/* Location — slate-700 for contrast */}
                {city && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {city}
                        </span>
                    </div>
                )}

                {/* Date — slate-700 for contrast */}
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {format(slot.startTime, 'EEEE, d/M', { locale: dateLocale })}
                    </span>
                </div>
            </div>

            {/* ── Price + CTA ── */}
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                {/* Price row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        {/* Promotional price — large, green, high contrast */}
                        <span className="text-2xl font-extrabold text-green-600 dark:text-green-400 tabular-nums">
                            ₪{slot.promotionalPrice}
                        </span>
                        {/* Original price — slate-500, still readable */}
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through tabular-nums">
                            ₪{slot.basePrice}
                        </span>
                    </div>
                    {/* Discount badge — solid red bg, white text = 4.5:1+ */}
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
