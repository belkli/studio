'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Harmonia Error]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">משהו השתבש</h2>
            <p className="text-muted-foreground max-w-md">
                אירעה שגיאה בלתי צפויה. ניתן לנסות שוב או לחזור לדף הבית.
            </p>
            <div className="flex gap-2">
                <Button onClick={reset}>נסה שוב</Button>
                <Button variant="outline" asChild>
                    <a href="/dashboard">חזרה לדשבורד</a>
                </Button>
            </div>
            {process.env.NODE_ENV !== 'production' && (
                <pre className="text-xs text-left bg-muted p-4 rounded max-w-lg overflow-auto mt-4">
                    {error.message}
                    {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
            )}
        </div>
    );
}
