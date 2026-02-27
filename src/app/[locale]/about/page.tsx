'use client';
import { useTranslations } from 'next-intl';
import { Icons } from "@/components/icons";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";
import { conservatoriums, mockBranches } from "@/lib/data";

export default function AboutPage() {
    const tNav = useTranslations('Navigation');
    const tHome = useTranslations('HomePage');

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
                    <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4 text-primary">{tNav('about')}</Link>
                    <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4">{tNav('contact')}</Link>
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
                <div className="container px-4 md:px-6">
                    <div className="space-y-4 mb-12 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter">אודות הרמוניה</h1>
                        <p className="max-w-[700px] mx-auto text-muted-foreground text-lg">
                            רשת הקונסרבטוריונים המובילה בישראל, המעניקה חינוך מוזיקלי מקצועי לכל הגילאים.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {conservatoriums.map(cons => (
                            <Card key={cons.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-32 bg-primary/10 flex items-center justify-center">
                                    <Icons.logo className="h-12 w-12 text-primary/40" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl">{cons.name}</CardTitle>
                                    <CardDescription>מרכז לחינוך מוזיקלי</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-start text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 ml-2 mt-0.5" />
                                        <span>סניף מרכזי, {cons.name.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-start text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4 ml-2 mt-0.5" />
                                        <span>077-1234567</span>
                                    </div>
                                    {mockBranches.filter(b => b.conservatoriumId === cons.id).length > 0 && (
                                        <div className="pt-2 mt-2 border-t">
                                            <p className="text-xs font-semibold mb-1">סניפים נוספים:</p>
                                            <ul className="text-xs text-muted-foreground space-y-1">
                                                {mockBranches.filter(b => b.conservatoriumId === cons.id).map(b => (
                                                    <li key={b.id}>{b.name} - {b.address}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">&copy; 2024 {tHome('title')}. {tHome('copyright')}</p>
                <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                    <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>{tHome('privacyPolicy')}</Link>
                    <Link href="/contact" className="text-xs hover:underline underline-offset-4" prefetch={false}>{tNav('contact')}</Link>
                </nav>
            </footer>
        </div>
    );
}
