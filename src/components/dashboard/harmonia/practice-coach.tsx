
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Target, Gauge, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslations, useLocale } from 'next-intl';

type Feedback = {
    pitchAccuracy: number;
    rhythmAccuracy: number;
    observations: string[];
};

export function PracticeCoach() {
    const t = useTranslations('PracticeCoach');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    const handleRecord = () => {
        setIsRecording(true);
        setFeedback(null);
        // Simulate recording
        setTimeout(() => {
            setIsRecording(false);
            setIsAnalyzing(true);
            // Simulate analysis
            setTimeout(() => {
                setIsAnalyzing(false);
                setFeedback({
                    pitchAccuracy: Math.floor(Math.random() * 15) + 85, // 85-100%
                    rhythmAccuracy: Math.floor(Math.random() * 20) + 80, // 80-100%
                    observations: [
                        'האינטונציה בתיבה 5 הייתה מעט נמוכה.',
                        'קצב יציב מאוד לאורך רוב הקטע, במיוחד במעברים.',
                        'מומלץ לשים לב להפרשי הדינמיקה בין הפורטה לפיאנו בתיבות 12-14.'
                    ]
                });
            }, 3000);
        }, 5000);
    };

    return (
        <Card className="w-full max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader className="text-center">
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="h-20 w-20 rounded-full"
                        onClick={handleRecord}
                        disabled={isRecording || isAnalyzing}
                    >
                        {isRecording ? (
                            <div className="h-8 w-8 bg-red-500 rounded animate-pulse" />
                        ) : (
                            <Mic className="h-10 w-10" />
                        )}
                    </Button>
                </div>
                {isRecording && <p className="text-center text-red-500 font-medium animate-pulse">{t('recording')}</p>}
                {isAnalyzing && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <p>{t('analyzing')}</p>
                    </div>
                )}
                {feedback && (
                    <div className="space-y-4 animate-in fade-in-50">
                        <Alert>
                            <Star className="h-4 w-4" />
                            <AlertTitle>{t('feedbackTitle')}</AlertTitle>
                            <AlertDescription>
                                {t('feedbackDesc')}
                            </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-2 gap-4">
                             <Card>
                                 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Target/> {t('pitchAccuracy')}</CardTitle></CardHeader>
                                 <CardContent>
                                     <p className="text-2xl font-bold">{feedback.pitchAccuracy}%</p>
                                      <Progress value={feedback.pitchAccuracy} className="h-2 mt-1"/>
                                 </CardContent>
                             </Card>
                             <Card>
                                 <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Gauge/> {t('rhythmAccuracy')}</CardTitle></CardHeader>
                                 <CardContent>
                                     <p className="text-2xl font-bold">{feedback.rhythmAccuracy}%</p>
                                     <Progress value={feedback.rhythmAccuracy} className="h-2 mt-1"/>
                                 </CardContent>
                             </Card>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('observations')}</h4>
                            <ul className="space-y-2 list-disc pe-4 text-sm">
                                {feedback.observations.map((obs, i) => <li key={i}>{obs}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
