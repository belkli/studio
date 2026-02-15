'use client';

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUser, instruments } from '@/lib/data';
import { PlusCircle, Save, Send, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getCompositionSuggestions } from '@/app/actions';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const compositionSchema = z.object({
  composer: z.string().min(1, 'חובה להזין מלחין'),
  title: z.string().min(1, 'חובה להזין שם יצירה'),
  genre: z.string().min(1, 'חובה לבחור ז\'אנר'),
  duration: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט לא תקין (MM:SS)'),
});

const formSchema = z.object({
  formType: z.string().min(1, "חובה לבחור סוג טופס"),
  repertoire: z.array(compositionSchema).min(1, 'חובה להוסיף לפחות יצירה אחת'),
});

type FormData = z.infer<typeof formSchema>;
type Suggestion = { composer: string; title: string; duration: string; genre: string };

function CompositionSuggestions({ composer, onSelect }: { composer: string; onSelect: (suggestion: Suggestion) => void }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = useCallback(async (composerName: string) => {
        if (composerName.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        const result = await getCompositionSuggestions({ composer: composerName });
        setSuggestions(result as Suggestion[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchSuggestions(composer);
        }, 500);
        return () => clearTimeout(debounce);
    }, [composer, fetchSuggestions]);

    if(loading) return <div className="p-2 text-sm text-muted-foreground">טוען הצעות...</div>
    if (suggestions.length === 0) return null;

    return (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
            {suggestions.map((s, i) => (
                <div key={i} onClick={() => onSelect(s)} className="p-2 hover:bg-muted cursor-pointer text-sm">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.composer} - {s.duration}</p>
                </div>
            ))}
        </div>
    )
}


export function NewForm() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formType: 'רסיטל בגרות',
      repertoire: [{ composer: '', title: '', genre: 'קלאסי', duration: '00:00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'repertoire',
  });

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  const repertoire = form.watch('repertoire');
  const totalDuration = repertoire.reduce((total, item) => {
    const [minutes, seconds] = item.duration.split(':').map(Number);
    return total + (minutes * 60) + seconds;
  }, 0);
  const totalDurationFormatted = `${String(Math.floor(totalDuration / 60)).padStart(2, '0')}:${String(totalDuration % 60).padStart(2, '0')}`;
  
  const onSubmit = (data: FormData) => {
    toast({
        title: "הטופס הוגש בהצלחה!",
        description: "הטופס נשלח לאישור המורה.",
    });
    console.log(data);
  };

  const saveDraft = () => {
    toast({
        title: "טיוטה נשמרה!",
    });
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>פרטי הטופס</CardTitle>
            <CardDescription>פרטי התלמיד/ה והקונסרבטוריון ימולאו אוטומטית.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid md:grid-cols-3 gap-4">
                <div className="p-2 border rounded-md bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">שם התלמיד/ה</p>
                    <p className="font-semibold">{mockUser.name}</p>
                </div>
                 <div className="p-2 border rounded-md bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">כלי נגינה</p>
                    <p className="font-semibold">{mockUser.instrument}</p>
                </div>
                <FormField
                    control={form.control}
                    name="formType"
                    render={({ field }) => (
                    <FormItem>
                    <FormLabel>סוג הטופס</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="בחר סוג טופס" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="רסיטל בגרות">רסיטל בגרות</SelectItem>
                            <SelectItem value="מבחן שלב">מבחן שלב</SelectItem>
                            <SelectItem value="קונצרט כיתתי">קונצרט כיתתי</SelectItem>
                            <SelectItem value="מופע הרכבים">מופע הרכבים</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
             </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>רפרטואר</CardTitle>
                <CardDescription>הוסף את היצירות שיבוצעו.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 items-start p-4 border rounded-lg relative">
                        <FormField
                            control={form.control}
                            name={`repertoire.${index}.composer`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>מלחין</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input {...field} onFocus={() => setActiveSuggestionIndex(index)} />
                                        {activeSuggestionIndex === index && <CompositionSuggestions composer={field.value} onSelect={(s) => {
                                            form.setValue(`repertoire.${index}.composer`, s.composer);
                                            form.setValue(`repertoire.${index}.title`, s.title);
                                            form.setValue(`repertoire.${index}.duration`, s.duration);
                                            form.setValue(`repertoire.${index}.genre`, s.genre);
                                            setActiveSuggestionIndex(null);
                                        }} />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={form.control} name={`repertoire.${index}.title`} render={({ field }) => ( <FormItem> <FormLabel>שם היצירה</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`repertoire.${index}.genre`} render={({ field }) => ( <FormItem> <FormLabel>ז'אנר</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        <FormField control={form.control} name={`repertoire.${index}.duration`} render={({ field }) => ( <FormItem> <FormLabel>זמן ביצוע</FormLabel> <FormControl><Input dir='ltr' {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        
                        <div className="flex items-end h-full">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">מחק יצירה</span>
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => append({ composer: '', title: '', genre: 'קלאסי', duration: '00:00' })}
                >
                    <PlusCircle className="ml-2 h-4 w-4" />
                    הוסף יצירה
                </Button>
                 <FormMessage>{form.formState.errors.repertoire?.root?.message}</FormMessage>

            </CardContent>
            <Separator />
            <CardFooter className="flex justify-end pt-6">
                <div className="text-lg font-bold">
                    <span>סה"כ זמן ביצוע: </span>
                    <span>{totalDurationFormatted}</span>
                </div>
            </CardFooter>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={saveDraft}>
                <Save className="ml-2 h-4 w-4" />
                שמור כטיוטה
            </Button>
            <Button type="submit">
                <Send className="ml-2 h-4 w-4" />
                הגש לאישור
            </Button>
        </div>
      </form>
    </FormProvider>
  );
}
