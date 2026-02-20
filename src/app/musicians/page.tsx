
import { MusiciansForHire } from '@/components/harmonia/musicians-for-hire';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MusiciansPage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
                <Link href="/" className="flex items-center justify-center" prefetch={false}>
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ms-2 text-xl font-bold">הַרמוֹנְיָה</span>
                </Link>
                 <nav className="hidden md:flex gap-4 sm:gap-6 mx-6">
                    <Link href="/available-now" className="text-sm font-medium hover:underline underline-offset-4">שיעורים פנויים</Link>
                    <Link href="/musicians" className="text-sm font-medium hover:underline underline-offset-4">מוזיקאים לאירועים</Link>
                     <Link href="/donate" className="text-sm font-medium hover:underline underline-offset-4">תרומה</Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground">אודות</Link>
                    <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 text-muted-foreground">צור קשר</Link>
                </nav>
                <div className="flex-grow" />
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost">
                        <Link href="/login">התחבר</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">הרשם חדש</Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1">
                <MusiciansForHire />
            </main>
             <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-muted-foreground">&copy; 2024 הַרמוֹנְיָה. כל הזכויות שמורות.</p>
                <nav className="sm:ms-auto flex gap-4 sm:gap-6">
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    מדיניות פרטיות
                </Link>
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    צור קשר
                </Link>
                </nav>
            </footer>
        </div>
    );
}
