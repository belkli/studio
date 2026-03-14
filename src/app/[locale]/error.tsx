'use client';

import { useEffect } from 'react';
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
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">An unexpected error occurred. Please try again.</p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- error boundary cannot use next/link (may lack router context) */}
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Back to Dashboard
        </a>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="text-xs text-start bg-muted p-4 rounded max-w-lg overflow-auto mt-4">
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
      )}
    </div>
  );
}
