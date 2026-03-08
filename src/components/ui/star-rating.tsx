'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value?: number;       // current rating 1-5
  onChange?: (rating: number) => void;  // if undefined, read-only
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

const sizeClasses = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

export function StarRating({ value = 0, onChange, size = 'md', showCount, count }: StarRatingProps) {
  const isReadOnly = !onChange;

  return (
    <div className="flex items-center gap-0.5" role={isReadOnly ? 'img' : 'group'} aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={isReadOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            'focus-visible:outline-none focus-visible:ring-1',
            isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform',
          )}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
            )}
          />
        </button>
      ))}
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground ms-1">({count})</span>
      )}
    </div>
  );
}
