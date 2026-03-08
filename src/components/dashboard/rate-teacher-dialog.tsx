'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';

interface RateTeacherDialogProps {
  teacherId: string;
  teacherName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RateTeacherDialog({ teacherId, teacherName, open, onOpenChange }: RateTeacherDialogProps) {
  const { submitTeacherRating, getTeacherRating } = useAuth();
  const t = useTranslations('TeacherRating');
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const { userRating } = getTeacherRating(teacherId);
  const alreadyRated = userRating !== undefined;

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) return;
    submitTeacherRating(teacherId, rating as 1|2|3|4|5, comment.trim() || undefined);
    toast({ title: t('thankYou') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title', { teacher: teacherName })}</DialogTitle>
          <DialogDescription>{t('desc')}</DialogDescription>
        </DialogHeader>
        {alreadyRated ? (
          <p className="text-sm text-muted-foreground py-4">{t('alreadyRated')}</p>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium">{t('selectRating')}</p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <Textarea
              placeholder={t('commentPlaceholder')}
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          {!alreadyRated && (
            <Button onClick={handleSubmit} disabled={rating < 1}>{t('submit')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
