'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, Meh, Frown } from "lucide-react";
import { useState } from "react";

const practiceLogSchema = z.object({
  date: z.string().min(1, "יש לבחור תאריך."),
  durationMinutes: z.number().min(5, "אימון חייב להיות לפחות 5 דקות."),
  pieces: z.string().optional(),
  mood: z.enum(["GREAT", "OKAY", "HARD"], {
    required_error: "חובה לבחור את הרגשתך באימון.",
  }),
  studentNote: z.string().optional(),
});

type PracticeLogFormData = z.infer<typeof practiceLogSchema>;

export function PracticeLogForm() {
  const { toast } = useToast();
  const [duration, setDuration] = useState(30);

  const form = useForm<PracticeLogFormData>({
    resolver: zodResolver(practiceLogSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      durationMinutes: 30,
    },
  });

  const onSubmit = (data: PracticeLogFormData) => {
    console.log(data);
    toast({
      title: "האימון נרשם בהצלחה!",
      description: `כל הכבוד על אימון של ${data.durationMinutes} דקות.`,
    });
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>יומן אימונים</CardTitle>
        <CardDescription>מלא את פרטי האימון שלך.</CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>משך אימון (דקות): {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={5}
                      max={120}
                      step={5}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pieces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>יצירות שתורגלו</FormLabel>
                  <FormControl>
                    <Textarea placeholder="לדוגמה: סונטה של מוצרט (חזרתי על הפתיחה), אטיוד של שופן..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>איך היה האימון?</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      className="grid grid-cols-3"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <ToggleGroupItem value="GREAT" aria-label="Great">
                        <ThumbsUp className="h-4 w-4 me-2" />
                        מעולה
                      </ToggleGroupItem>
                      <ToggleGroupItem value="OKAY" aria-label="Okay">
                        <Meh className="h-4 w-4 me-2" />
                        בסדר
                      </ToggleGroupItem>
                      <ToggleGroupItem value="HARD" aria-label="Hard">
                        <Frown className="h-4 w-4 me-2" />
                        מאתגר
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="studentNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות למורה (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="לדוגמה: התקשיתי במעבר בתיבה 24, אשמח לעבור על זה בשיעור הבא." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              שמור אימון
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
