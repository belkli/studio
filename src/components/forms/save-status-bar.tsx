'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Save, Loader } from 'lucide-react';
import { format } from 'date-fns';

export type SaveState = 'idle' | 'saving' | 'success' | 'error';

interface SaveStatusBarProps {
  isDirty: boolean;
  saveState: SaveState;
  lastSaved: Date | null;
  onSave: () => void;
}

export function SaveStatusBar({ isDirty, saveState, lastSaved, onSave }: SaveStatusBarProps) {
  const isSaving = saveState === 'saving';

  const getStatus = () => {
    if (saveState === 'saving') {
      return { text: '⏳ שומר...', color: 'text-muted-foreground' };
    }
    if (saveState === 'error') {
      return { text: '❌ שגיאה בשמירה - נסה שוב', color: 'text-destructive' };
    }
    if (saveState === 'success' && lastSaved) {
      return { text: `✓ נשמר ב-${format(lastSaved, 'HH:mm')}`, color: 'text-green-600' };
    }
    if (isDirty) {
      return { text: '⚠️ שינויים לא נשמרו', color: 'text-yellow-600' };
    }
    if (lastSaved) {
      return { text: `✓ נשמר ב-${format(lastSaved, 'HH:mm')}`, color: 'text-muted-foreground' };
    }
    return { text: '', color: '' };
  };

  const { text, color } = getStatus();
  
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between p-2 mb-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-sm">
      <div className={cn("flex items-center gap-2 text-sm font-medium", color)}>
        <span>{text}</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSave}
        disabled={isSaving || !isDirty}
      >
        {isSaving ? <Loader className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
        שמור טיוטה
      </Button>
    </div>
  );
}
