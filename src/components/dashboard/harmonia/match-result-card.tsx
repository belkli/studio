'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Star, CalendarClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { TeacherMatchResult } from '@/lib/types';

interface MatchResultCardProps {
  result: TeacherMatchResult;
  rank: number;
  locale: string;
  isRtl: boolean;
}

export function MatchResultCard({ result, rank, locale: _locale, isRtl: _isRtl }: MatchResultCardProps) {
  const t = useTranslations('AiMatchmaker');
  const router = useRouter();

  const isTopMatch = rank === 1;

  return (
    <Card
      role="article"
      aria-label={`${result.teacherName} - ${result.score}% match`}
      className={isTopMatch ? 'border-2 border-green-500 bg-green-50/30' : ''}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Music className="h-7 w-7 text-indigo-600" />
              {result.isPremiumTeacher && (
                <Star className="absolute -top-1 -end-1 h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold">{result.teacherName}</h4>
              {isTopMatch ? (
                <Badge className="bg-green-100 text-green-800 text-xs">{t('topMatchLabel')}</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">{t('runnerUpLabel')}</Badge>
              )}
              <Badge aria-label={`Match score: ${result.score} percent`} className="bg-indigo-100 text-indigo-800 text-xs ms-auto">
                {t('matchScore', { score: result.score })}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-1">{result.matchReason}</p>

            {/* Instrument tags */}
            {result.instruments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.instruments.map(inst => (
                  <Badge key={inst} variant="outline" className="text-xs">{inst}</Badge>
                ))}
              </div>
            )}

            {/* Next slot */}
            {result.nextAvailableSlot && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3" />
                {t('nextSlot', { day: result.nextAvailableSlot.day, time: result.nextAvailableSlot.time })}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant={isTopMatch ? 'default' : 'outline'}
                className={isTopMatch ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => {
                  sessionStorage.setItem('pending_matchmaker_teacher', JSON.stringify({
                    teacherId: result.teacherId,
                    conservatoriumId: result.conservatoriumId,
                  }));
                  router.push(`/register?teacher=${result.teacherId}&conservatorium=${result.conservatoriumId}`);
                }}
              >
                {t('bookTrialBtn')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
