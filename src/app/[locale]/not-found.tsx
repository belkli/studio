import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <Music className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <p className="text-xl text-muted-foreground">הדף המבוקש לא נמצא</p>
            <Button asChild>
                <Link href="/">חזרה לדף הבית</Link>
            </Button>
        </div>
    );
}
