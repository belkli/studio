'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AidApplicationWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const { toast } = useToast();
    const { addScholarshipApplication } = useAuth();
    const t = useTranslations('ScholarshipApplication');

    const handleNext = () => setStep((s) => Math.min(s + 1, 3));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            // In a real app, you would gather form data here.
            addScholarshipApplication({});

            setIsSubmitting(false);
            setIsDone(true);
            toast({
                title: t('successToastTitle'),
                description: t('successToastDesc'),
            });
        }, 1500);
    };

    if (isDone) {
        return (
            <Card className="w-full max-w-2xl mx-auto shadow-sm">
                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{t('requestReceived')}</h2>
                    <p className="text-muted-foreground max-w-md">
                        {t('requestReceivedDesc')}
                    </p>
                    <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
                        {t('backToDashboard')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const stepperSteps = [
        { id: 'details', title: t('step1') },
        { id: 'financial', title: t('step2') },
        { id: 'submit', title: t('step3') }
    ];

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-sm">
            <CardHeader>
                <CardTitle>{t('pageTitle')}</CardTitle>
                <CardDescription>
                    {t('pageDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />
                    <div className={cn("absolute top-1/2 right-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300",
                        step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'
                    )} />

                    {stepperSteps.map((s, index) => (
                        <div key={s.id} className="flex flex-col items-center z-10">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-semibold border-4 transition-colors", step >= index + 1 ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground')}>
                                {index + 1}
                            </div>
                            <p className="text-xs mt-2 font-medium text-muted-foreground">{s.title}</p>
                        </div>
                    ))}
                </div>

                <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">{t('personalInfoTitle')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">{t('firstName')}</Label>
                                        <Input id="firstName" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">{t('lastName')}</Label>
                                        <Input id="lastName" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idNumber">{t('idNumber')}</Label>
                                    <Input id="idNumber" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instrument">{t('instrument')}</Label>
                                    <Select dir="rtl" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectInstrument')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="piano">{t('piano')}</SelectItem>
                                            <SelectItem value="violin">{t('violin')}</SelectItem>
                                            <SelectItem value="guitar">{t('guitar')}</SelectItem>
                                            <SelectItem value="voice">{t('voice')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">{t('socioEconomicTitle')}</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="income">{t('familyIncome')}</Label>
                                    <Select dir="rtl" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectIncome')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tier1">{t('tier1')}</SelectItem>
                                            <SelectItem value="tier2">{t('tier2')}</SelectItem>
                                            <SelectItem value="tier3">{t('tier3')}</SelectItem>
                                            <SelectItem value="tier4">{t('tier4')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="siblings">{t('householdMembers')}</Label>
                                        <Input id="siblings" type="number" min="1" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">{t('applicationReason')}</Label>
                                    <Textarea
                                        id="reason"
                                        className="h-32 resize-none"
                                        placeholder={t('reasonPlaceholder')}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">{t('documentsTitle')}</h3>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{t('attention')}</AlertTitle>
                                    <AlertDescription>
                                        {t('attentionDesc')}
                                    </AlertDescription>
                                </Alert>

                                <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                                    <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <FileUp className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{t('uploadFiles')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{t('fileTypes')}</p>
                                    </div>
                                    <Input id="files" type="file" className="hidden" multiple />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>
                            {t('backBtn')}
                        </Button>
                        {step < 3 ? (
                            <Button type="submit">
                                {t('nextBtn')}
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('submittingBtn') : t('submitBtn')}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
