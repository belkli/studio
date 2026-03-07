'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const videoUploadSchema = z.object({
  repertoireId: z.string().min(1, "יש לבחור יצירה."),
  studentNote: z.string().optional(),
});

type VideoUploadFormData = z.infer<typeof videoUploadSchema>;

export function PracticeVideoUploadForm() {
  const { toast } = useToast();
  const { user, addPracticeVideo, assignedRepertoire, compositions } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const studentId = user?.role === 'student' ? user.id : (user?.role === 'parent' ? user.childIds?.[0] : undefined);

  const studentRepertoire = useMemo(() => {
    if (!studentId) return [];
    return assignedRepertoire.filter(rep => rep.studentId === studentId);
  }, [assignedRepertoire, studentId]);

  const form = useForm<VideoUploadFormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const onSubmit = (data: VideoUploadFormData) => {
    setIsUploading(true);

    const repertoireItem = studentRepertoire.find(r => r.id === data.repertoireId);
    const composition = compositions.find(c => c.id === repertoireItem?.compositionId);

    // Simulate upload
    setTimeout(() => {
      if (addPracticeVideo) {
        addPracticeVideo({
          repertoireTitle: composition?.title || 'Unknown Piece',
          studentNote: data.studentNote,
        });
      }
      setIsUploading(false);
      toast({
        title: "הוידאו הועלה בהצלחה!",
        description: `המורה שלך יקבל התראה ויוכל לתת משוב.`,
      });
      router.push('/dashboard/progress');
    }, 1500);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>העלאת וידאו לאימון</CardTitle>
        <CardDescription>שלח/י סרטון קצר (עד 60 שניות) למורה לקבלת משוב באמצע השבוע.</CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">גרור קובץ וידאו לכאן, או לחץ כדי לבחור</p>
              <p className="text-xs text-muted-foreground mt-1">(העלאה בפועל אינה ממומשת בדמו זה)</p>
            </div>
            <FormField
              control={form.control}
              name="repertoireId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>לאיזו יצירה מתייחס הוידאו?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="בחר יצירה מהרפרטואר..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studentRepertoire.map(rep => {
                        const composition = compositions.find(c => c.id === rep.compositionId);
                        return <SelectItem key={rep.id} value={rep.id}>{composition?.title}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
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
                    <Textarea placeholder="לדוגמה: אני לא בטוח/ה לגבי האצבוע כאן, או האם הדינמיקה נכונה?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin h-4 w-4 me-2" /> : <UploadCloud className="h-4 w-4 me-2" />}
              {isUploading ? 'מעלה...' : 'שלח למשוב'}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
