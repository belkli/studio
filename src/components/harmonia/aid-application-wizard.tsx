'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper'; // Assuming Stepper exists, if not we build a simple one or use steps
import { FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AidApplicationWizard() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const { toast } = useToast();

    const handleNext = () => setStep((s) => Math.min(s + 1, 3));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsDone(true);
            toast({
                title: 'הבקשה הוגשה בהצלחה',
                description: 'בקשתך למלגה התקבלה ותיבחן על ידי הוועדה. תשובה תימסר עד 30 ימי עסקים.',
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
                    <h2 className="text-2xl font-bold">הבקשה התקבלה!</h2>
                    <p className="text-muted-foreground max-w-md">
                        תגובת הוועדה למלגות תישלח אליך בהקדם. בינתיים, סטטוס הבקשה עודכן באזור האישי שלך.
                    </p>
                    <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
                        חזור ללוח הבקרה
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-sm">
            <CardHeader>
                <CardTitle>בקשה לתמיכה כלכלית / מלגה</CardTitle>
                <CardDescription>
                    קרן המלגות של הרמוניה מסייעת לתלמידים מצטיינים או ממשפחות מעוטות יכולת להגשים את החלום המוזיקלי.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />
                    <div className={`absolute top-1/2 right-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`} />

                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold border-4 transition-colors ${step >= num ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'}`}>
                            {num}
                        </div>
                    ))}
                </div>

                <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">פרטים אישיים ורקע</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">שם פרטי</Label>
                                        <Input id="firstName" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">שם משפחה</Label>
                                        <Input id="lastName" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idNumber">תעודת זהות</Label>
                                    <Input id="idNumber" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instrument">כלי נגינה ראשי / מסלול</Label>
                                    <Select dir="rtl" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="בחר כלי נגינה..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="piano">פסנתר</SelectItem>
                                            <SelectItem value="violin">כינור</SelectItem>
                                            <SelectItem value="guitar">גיטרה</SelectItem>
                                            <SelectItem value="voice">פיתוח קול</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">מצב סוציו-אקונומי ונימוקים</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="income">הכנסה חודשית משפחתית ממוצעת</Label>
                                    <Select dir="rtl" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="אנא בחר רמת הכנסה..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tier1">עד 5,000 ש"ח</SelectItem>
                                            <SelectItem value="tier2">5,001 - 10,000 ש"ח</SelectItem>
                                            <SelectItem value="tier3">10,001 - 15,000 ש"ח</SelectItem>
                                            <SelectItem value="tier4">מעל 15,000 ש"ח</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="siblings">מספר נפשות בבית</Label>
                                        <Input id="siblings" type="number" min="1" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">נימוק הבקשה למלגה (עד 300 מילים)</Label>
                                    <Textarea
                                        id="reason"
                                        className="h-32 resize-none"
                                        placeholder="פרטו מדוע אתם זקוקים למלגה, הישגים מוזיקליים, או כל מידע רלוונטי לוועדה..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">צירוף מסמכים (רשות)</h3>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>שימו לב</AlertTitle>
                                    <AlertDescription>
                                        צירוף 3 תלושי שכר אחרונים של שני בני הזוג (או אישור מביטוח לאומי) מגדיל משמעותית את המידע העומד לרשות הוועדה בבחינת הבקשה.
                                    </AlertDescription>
                                </Alert>

                                <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                                    <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <FileUp className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">לחץ להעלאת קבצים או גרור לכאן</p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG עד 5MB</p>
                                    </div>
                                    <Input id="files" type="file" className="hidden" multiple />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>
                            חזור לחלק הקודם
                        </Button>
                        {step < 3 ? (
                            <Button type="submit">
                                המשך לחלק הבא
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'שולח בקשה...' : 'הגש בקשה למלגה'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
