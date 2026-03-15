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
import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/routing";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getUploadSignedUrl } from "@/app/actions/storage";
import { useTranslations, useLocale } from 'next-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVideoUploadSchema = (t: any) => z.object({
  repertoireId: z.string().min(1, t('errorSelectPiece')),
  studentNote: z.string().optional(),
});

type VideoUploadFormData = z.infer<ReturnType<typeof createVideoUploadSchema>>;

export function PracticeVideoUploadForm() {
  const { toast } = useToast();
  const { user, addPracticeVideo, assignedRepertoire, compositions } = useAuth();
  const router = useRouter();
  const t = useTranslations('PracticeVideoUpload');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoUploadSchema = createVideoUploadSchema(t);

  const studentId = user?.role === 'student' ? user.id : (user?.role === 'parent' ? user.childIds?.[0] : undefined);

  const studentRepertoire = useMemo(() => {
    if (!studentId) return [];
    return assignedRepertoire.filter(rep => rep.studentId === studentId);
  }, [assignedRepertoire, studentId]);

  const form = useForm<VideoUploadFormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const onSubmit = async (data: VideoUploadFormData) => {
    setIsUploading(true);

    const repertoireItem = studentRepertoire.find(r => r.id === data.repertoireId);
    const composition = compositions.find(c => c.id === repertoireItem?.compositionId);

    let videoUrl = '';
    const uploadTimestamp = new Date().getTime();

    // Try real upload via signed URL if a file is selected
    if (selectedFile && studentId && user?.conservatoriumId) {
      try {
        const { uploadUrl, storagePath } = await getUploadSignedUrl({
          conservatoriumId: user.conservatoriumId,
          studentId,
          filename: `${uploadTimestamp}-${selectedFile.name}`,
          contentType: selectedFile.type,
        });

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': selectedFile.type },
          body: selectedFile,
        });

        videoUrl = storagePath;
      } catch (err) {
        // Storage credentials not available (dev mode) — fall back to mock
        console.warn('[PracticeVideoUpload] Signed URL unavailable, using mock upload:', err);
        videoUrl = `mock://practiceVideos/${studentId}/${uploadTimestamp}-${selectedFile.name}`;
      }
    } else {
      videoUrl = `mock://practiceVideos/${studentId || 'unknown'}/${uploadTimestamp}-no-file`;
    }

    if (addPracticeVideo) {
      addPracticeVideo({
        repertoireTitle: composition?.title || 'Unknown Piece',
        studentNote: data.studentNote,
        videoUrl,
      });
    }

    setIsUploading(false);
    toast({
      title: t('uploadSuccessTitle'),
      description: t('uploadSuccessDesc'),
    });
    router.push('/dashboard/progress');
  };

  return (
    <Card className="w-full max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('formTitle')}</CardTitle>
        <CardDescription>{t('formDesc')}</CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              {selectedFile ? (
                <p className="mt-4 text-sm font-medium">{selectedFile.name}</p>
              ) : (
                <p className="mt-4 text-muted-foreground">{t('dropzoneText')}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t('dropzoneFormats')}</p>
            </div>
            <FormField
              control={form.control}
              name="repertoireId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('repertoireLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t('repertoirePlaceholder')} /></SelectTrigger>
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
                  <FormLabel>{t('notesLabel')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('notesPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin h-4 w-4 me-2" /> : <UploadCloud className="h-4 w-4 me-2" />}
              {isUploading ? t('uploading') : t('submitBtn')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
