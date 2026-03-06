import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50/50 via-background to-background">
      <div className="absolute top-4 start-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          ← Harmonia
        </Link>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
