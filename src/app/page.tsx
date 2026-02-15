import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 w-full z-50 border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="ms-2 text-xl font-bold">הַרמוֹנְיָה</span>
        </Link>
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
        <section className="w-full h-dvh flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400 py-2">
                  מערכת ניהול קונסרבטוריונים למוזיקה
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  פשוט, חכם, מאובטח – הגישו טפסים, אשרו בקלות, חסכו זמן.
                </p>
              </div>
              <div className="space-x-4 space-x-reverse">
                <Button asChild size="lg">
                  <Link href="/login">התחבר</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/5 hover:text-primary">
                  <Link href="/register">הרשם חדש</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
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
