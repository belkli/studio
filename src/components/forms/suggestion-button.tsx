
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { getCompositionSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Composition } from '@/lib/types';

type SuggestionButtonProps = {
  fields: any[];
  append: (value: Partial<Composition> | Partial<Composition>[], options?: any) => void;
  getValues: () => any;
};

export function SuggestionButton({ fields, append, getValues }: SuggestionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const currentValues = getValues();
      const existingCompositions = currentValues.repertoire
        .map((item: Composition) => item.title)
        .filter(Boolean);

      const suggestions = await getCompositionSuggestions({
        instrument: currentValues.instrument,
        existingCompositions: existingCompositions,
        context: `Student in grade ${currentValues.grade}. The program should be balanced for a recital.`
      });
      
      if (suggestions && suggestions.length > 0) {
        const newCompositions = suggestions.map(s => ({
            composer: s.composer,
            title: s.title,
            duration: s.duration,
            genre: s.genre,
        }));
        
        append(newCompositions);

        toast({
          title: 'הצעות נוספו!',
          description: `${suggestions.length} יצירות חדשות נוספו לרשימה.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'לא נמצאו הצעות',
          description: 'לא הצלחנו למצוא הצעות מתאימות. נסה/י לשנות את פרטי הטופס.',
        });
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'אירעה שגיאה בעת קבלת ההצעות.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGetSuggestions}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="me-2 h-4 w-4 text-yellow-500" />
      )}
      קבל הצעות AI
    </Button>
  );
}
