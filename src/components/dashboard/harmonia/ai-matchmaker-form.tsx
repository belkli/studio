'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, UserPlus, Sparkles, Music, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocale, useTranslations } from 'next-intl';

export function AiMatchmakerForm() {
    const t = useTranslations('AiMatchmaker');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const STEPS = [
        { id: 'goal', title: t('stepGoal') },
        { id: 'style', title: t('stepStyle') },
        { id: 'personality', title: t('stepPersonality') },
        { id: 'results', title: t('stepResults') }
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const { toast } = useToast();

    const handleNext = () => {
        if (currentStep === STEPS.length - 2) {
            // Simulate AI Analysis
            setIsAnalyzing(true);
            setTimeout(() => {
                setIsAnalyzing(false);
                setCurrentStep(prev => prev + 1);
            }, 2000);
        } else {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSelectOption = (question: string, value: string) => {
        setAnswers(prev => ({ ...prev, [question]: value }));
    };

    return (
        <Card className="max-w-3xl mx-auto shadow-sm border-t-4 border-t-purple-500 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b relative">
                <div className="absolute top-4 left-4 opacity-20">
                    <Bot className="w-24 h-24 text-purple-600" />
                </div>
                <div className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold text-purple-900">
                        <Sparkles className="w-6 h-6 text-purple-500" /> {t('title')}
                    </CardTitle>
                    <CardDescription className="text-purple-800/70 text-base mt-2 max-w-lg">
                        {t('description')}
                    </CardDescription>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 mt-6 relative z-10 w-3/4">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex-1 flex flex-col gap-2">
                            <div className={`h-2 rounded-full w-full transition-all duration-500 ${idx <= currentStep ? 'bg-purple-600' : 'bg-purple-200'}`} />
                            <span className={`text-xs font-medium ${idx === currentStep ? 'text-purple-900' : 'text-purple-400'}`}>{step.title}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="pt-8 min-h-[300px]">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                        <div className="relative">
                            <Bot className="w-16 h-16 text-purple-600 animate-pulse" />
                            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-semibold text-purple-900">{t('analyzingTitle')}</h3>
                        <p className="text-muted-foreground text-center max-w-sm">
                            {t('analyzingDesc')}
                        </p>
                    </div>
                ) : currentStep === 0 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">{t('qGoalTitle')}</Label>
                            <RadioGroup dir={isRtl ? 'rtl' : 'ltr'} value={answers['goal'] || ''} onValueChange={(val) => handleSelectOption('goal', val)}>
                                <div className="grid gap-3">
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="fun" /> <span>{t('qGoalA1')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="professional" /> <span>{t('qGoalA2')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="exam" /> <span>{t('qGoalA3')}</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                ) : currentStep === 1 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">{t('qStyleTitle')}</Label>
                            <RadioGroup dir={isRtl ? 'rtl' : 'ltr'} value={answers['style'] || ''} onValueChange={(val) => handleSelectOption('style', val)}>
                                <div className="grid gap-3">
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="structured" /> <span>{t('qStyleA1')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="flexible" /> <span>{t('qStyleA2')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="challenge" /> <span>{t('qStyleA3')}</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                ) : currentStep === 2 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">{t('qPersonalityTitle')}</Label>
                            <RadioGroup dir={isRtl ? 'rtl' : 'ltr'} value={answers['personality'] || ''} onValueChange={(val) => handleSelectOption('personality', val)}>
                                <div className="grid gap-3">
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="patient" /> <span>{t('qPersonalityA1')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="demanding" /> <span>{t('qPersonalityA2')}</span>
                                    </Label>
                                    <Label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-50">
                                        <RadioGroupItem value="creative" /> <span>{t('qPersonalityA3')}</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2 mt-6">
                            <Label className="text-muted-foreground">{t('qOtherTitle')}</Label>
                            <Textarea placeholder={t('qOtherPlaceholder')} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in zoom-in duration-500">
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-2xl font-bold text-green-700">{t('matchFoundTitle')}</h3>
                            <p className="text-muted-foreground">{t('matchFoundDesc')}</p>
                        </div>

                        <div className="grid gap-4">
                            {/* Top Match */}
                            <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-white" /> {t('topMatchLabel')}
                                </div>
                                <div className="flex gap-4 items-start mt-2">
                                    <div className="w-16 h-16 rounded-full bg-green-200 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                                        <Music className="w-8 h-8 text-green-700" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-xl font-bold text-gray-900">{t('ronitName')}</h4>
                                        <p className="text-sm text-gray-600">{t('ronitTitle')}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant="secondary" className="bg-white border-green-200 text-green-800">{t('ronitTag1')}</Badge>
                                            <Badge variant="secondary" className="bg-white border-green-200 text-green-800">{t('ronitTag2')}</Badge>
                                            <Badge variant="secondary" className="bg-white border-green-200 text-green-800">{t('ronitTag3')}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-3 pt-3 border-t border-green-200">
                                            <span className="font-semibold text-green-800">{t('whyRonitLabel')}</span> {t('whyRonitDesc')}
                                        </p>
                                    </div>
                                </div>
                                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                                    {t('bookTrialBtn')}
                                    {isRtl ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                                </Button>
                            </div>

                            {/* Runner Up */}
                            <div className="border rounded-xl p-6 bg-card relative opacity-90">
                                <div className="absolute top-0 right-0 bg-gray-200 text-gray-700 px-3 py-1 rounded-bl-lg text-xs font-semibold">
                                    {t('runnerUpLabel')}
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Music className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-lg font-bold">{t('danName')}</h4>
                                        <p className="text-sm text-gray-500">{t('danTitle')}</p>
                                    </div>
                                    <Button variant="outline" size="sm">{t('viewProfileBtn')}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {!isAnalyzing && currentStep < STEPS.length - 1 && (
                <CardFooter className="flex justify-between bg-muted/20 border-t pt-4">
                    <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                        {t('prevBtn')}
                    </Button>
                    <Button onClick={handleNext} disabled={!answers[STEPS[currentStep].id]}>
                        {currentStep === STEPS.length - 2 ? (
                            <><Sparkles className="w-4 h-4 me-2" /> {t('findTeacherBtn')}</>
                        ) : (
                            <>
                                {t('nextBtn')}
                                {isRtl ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                            </>
                        )}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
