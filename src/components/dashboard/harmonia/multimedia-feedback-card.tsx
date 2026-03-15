
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Video, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations, useLocale } from 'next-intl';
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultimediaFeedbackCardProps {
  student: User;
}

export function MultimediaFeedbackCard({ student }: MultimediaFeedbackCardProps) {
  const { practiceVideos, addVideoFeedback } = useAuth();
  const dateLocale = useDateLocale();
  const { toast } = useToast();
  const t = useTranslations('MultimediaFeedback');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [newFeedback, setNewFeedback] = useState<Record<string, string>>({});

  const studentVideos = useMemo(() => {
    return practiceVideos
      .filter(v => v.studentId === student.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [practiceVideos, student.id]);

  const handleSendFeedback = (videoId: string) => {
    const comment = newFeedback[videoId];
    if (!comment || comment.trim() === '') return;

    addVideoFeedback(videoId, comment);
    setNewFeedback(prev => ({ ...prev, [videoId]: '' }));
    toast({ title: t('feedbackSentToast') });
  };

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Video /> {t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {studentVideos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('noVideos')}</p>
        ) : (
          <ScrollArea className="h-96 pe-4">
            <div className="space-y-6">
              {studentVideos.map(video => (
                <div key={video.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{video.repertoireTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('sentAgo', { time: formatDistanceToNow(new Date(video.createdAt), { addSuffix: true, locale: dateLocale }) })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">{t('watchVideo')}</Button>
                  </div>
                  {video.studentNote && <p className="text-sm italic mt-2 p-2 bg-background/50 rounded-md">&quot;{video.studentNote}&quot;</p>}

                  <div className="mt-4 space-y-3">
                    <h5 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />{t('yourFeedback')}</h5>
                    {video.feedback?.map((fb, index) => (
                      <div key={index} className="text-xs p-2 rounded-md bg-background/50">
                        <p>{fb.comment}</p>
                        <p className="text-muted-foreground text-end mt-1">
                          <Clock className="h-3 w-3 inline-block ms-1" />
                          {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true, locale: dateLocale })}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={t('writeFeedbackPlaceholder')}
                        rows={2}
                        value={newFeedback[video.id] || ''}
                        onChange={(e) => setNewFeedback(prev => ({ ...prev, [video.id]: e.target.value }))}
                      />
                      <Button size="icon" onClick={() => handleSendFeedback(video.id)} disabled={!newFeedback[video.id]}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">{t('sendFeedbackSrOnly')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
