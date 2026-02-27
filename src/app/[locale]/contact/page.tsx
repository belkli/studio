'use client';
import { useTranslations } from 'next-intl';
import { Icons } from "@/components/icons";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { conservatoriums } from "@/lib/data";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ContactPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitted(true);
        toast({
            title: "הפנייה נשלחה בהצלחה",
            description: "ניצור איתך קשר בהקדם האפשרי.",
        });
    };

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
                <Link href="/" className="flex items-center justify-center" prefetch={false}>
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ms-2 text-xl font-bold">{tHome('title')}</span>
                </Link>
                <nav className="hidden md:flex gap-4 sm:gap-6 mx-6">
                    <Link href="/available-now" className="text-sm font-medium hover:underline underline-offset-4">{tNav('lessons')}</Link>
                    <Link href="/musicians" className="text-sm font-medium hover:underline underline-offset-4">{tNav('musicians')}</Link>
                    <Link href="/donate" className="text-sm font-medium hover:underline underline-offset-4">{tNav('donate')}</Link>
                    <Link href="/open-day" className="text-sm font-medium hover:underline underline-offset-4">{tNav('openDay')}</Link>
                    <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">{tNav('about')}</Link>
                    <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4 text-primary">{tNav('contact')}</Link>
                </nav>
                <div className="flex-grow" />
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <Button asChild variant="ghost">
                        <Link href="/login">{tNav('login')}</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">{tNav('register')}</Link>
                    </Button>
                </div>
            </header>

            <main className="flex-1 pt-24 pb-12">
                <div className="container px-4 md:px-6 max-w-3xl">
                    <div className="space-y-4 mb-10 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter">צור קשר</h1>
                        <p className="text-muted-foreground text-lg">
                            יש לך שאלה? מעוניין להירשם? השאר פרטים ונחזור אליך בהקדם.
                        </p>
                    </div>

                    {isSubmitted ? (
                        <Card className="w-full text-center shadow-sm">
                            <CardContent className="pt-12 pb-12 flex flex-col items-center space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold">תודה על פנייתך!</h2>
                                <p className="text-muted-foreground max-w-md">הפרטים התקבלו במערכת, צוות הקונסרבטוריון ייצור עמך קשר בשעות הקרובות.</p>
                                <Button className="mt-4" onClick={() => setIsSubmitted(false)}>שליחת הודעה נוספת</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <form onSubmit={handleSubmit}>
                                <CardHeader>
                                    <CardTitle>טופס פנייה</CardTitle>
                                    <CardDescription>אנא מלא את כל הפרטים המסומנים בכוכבית.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">שם פרטי *</Label>
                                            <Input id="firstName" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">שם משפחה *</Label>
                                            <Input id="lastName" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">טלפון *</Label>
                                            <Input id="phone" type="tel" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">דוא"ל</Label>
                                            <Input id="email" type="email" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="conservatorium">קונסרבטוריון מבוקש *</Label>
                                        <Select required>
                                            <SelectTrigger dir="rtl">
                                                <SelectValue placeholder="בחר סניף" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                {conservatoriums.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">תוכן הפנייה</Label>
                                        <Textarea id="message" rows={4} placeholder="איך נוכל לעזור?" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full">שליחה</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    )}
                </div>
            </main>

            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto">
                <p className="text-xs text-muted-foreground">&copy; 2024 {tHome('title')}. {tHome('copyright')}</p>
                <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                    <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>{tHome('privacyPolicy')}</Link>
                    <Link href="/contact" className="text-xs hover:underline underline-offset-4 text-primary" prefetch={false}>{tNav('contact')}</Link>
                </nav>
            </footer>
        </div>
    );
}
