
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { getCompositionSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useTranslations } from 'next-intl';

type SuggestionButtonProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  append: (value: any, options?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: () => any;
};


export function SuggestionButton({ fields: _fields, append, getValues }: SuggestionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations('SuggestionButton');

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      const currentValues = getValues();
      const existingCompositions = currentValues.repertoire
        ? currentValues.repertoire
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.title)
          .filter(Boolean)
        : [];

      const suggestions = await getCompositionSuggestions({
        locale,
        instrument: currentValues.instrumentDetails?.instrument || currentValues.instrument,
        existingCompositions: existingCompositions,
        context: `Student in grade ${currentValues.grade || 'unknown'}. The program should be balanced for a recital.`
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
          title: t('successTitle'),
          description: t('successDesc', { length: suggestions.length.toString() }),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('noSuggestionsTitle'),
          description: t('noSuggestionsDesc'),
        });
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: t('errorDesc'),
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
      {t('buttonText')}
    </Button>
  );
}
