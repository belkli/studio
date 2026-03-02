'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Music, Share2, Tag } from "lucide-react";
import { Link } from '@/i18n/routing';
import { format } from "date-fns";
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations } from 'next-intl';
import type { EmptySlot } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface SlotPromotionCardProps {
    slot: EmptySlot;
}

export function SlotPromotionCard({ slot }: SlotPromotionCardProps) {
    const { toast } = useToast();
    const t = useTranslations('SlotPromotionCard');
    const dateLocale = useDateLocale();

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
                // Fallback for desktop
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast({
                    title: t('linkCopied'),
                    description: t('linkCopiedDesc'),
                });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({
                variant: 'destructive',
                title: t('shareError'),
                description: t('shareErrorDesc'),
            });
        }
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={slot.teacher.avatarUrl} alt={slot.teacher.name} />
                    <AvatarFallback>{slot.teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{slot.teacher.name}</CardTitle>
                    <CardDescription>{slot.teacher.specialties?.slice(0, 2).join(', ')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{slot.instrument}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(slot.startTime, "EEEE, HH:mm", { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="destructive">{t('lastMinute')}</Badge>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                <div className="text-center">
                    <span className="text-2xl font-bold text-accent">₪{slot.promotionalPrice}</span>
                    <span className="text-sm text-muted-foreground line-through ms-2">₪{slot.basePrice}</span>
                    <span className="text-sm font-bold text-green-600 ms-2">{t('discount', { percent: String(slot.discount) })}</span>
                </div>
                <div className="flex gap-2">
                    <Button asChild className="w-full">
                        <Link href="/register">
                            {t('bookNow')}
                            <ArrowLeft className="ms-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">{t('shareTitle')}</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
