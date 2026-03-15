"use client"
import { Link, useRouter } from "@/i18n/routing";
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations, useLocale } from "next-intl"
import type { OAuthProfile } from '@/lib/auth/oauth';
import { getClientAuthProvider } from '@/lib/auth/client-provider';
import { createSessionAction } from '@/app/actions/auth';
import { useBrandTheme } from '@/components/brand-theme-provider';
import { cn } from '@/lib/utils';

function sanitizeCallbackUrl(url: string | null): string {
  if (!url) return '/dashboard';
  // Must be a relative path (starts with /) and not a protocol-relative URL (//)
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return '/dashboard';
}

const LOGIN_FORM_STYLES = {
  indigo: {
    card: 'border',
    heading: 'font-heading',
  },
  gold: {
    card: 'border border-brand-gold/10',
    heading: 'font-display',
  },
} as const;

export function LoginForm() {
  const t = useTranslations("Auth")
  const { toast } = useToast()
  const { login, users, updateUser } = useAuth()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'))
  const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr'
  const { brand } = useBrandTheme()
  const s = LOGIN_FORM_STYLES[brand]
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const linkOAuthToExistingUser = (oauthProfile: OAuthProfile) => {
    const existing = users.find((entry) => entry.email.toLowerCase() === oauthProfile.email.toLowerCase());
    if (!existing) return;

    const now = new Date().toISOString();
    const nextProvider = {
      userId: existing.id,
      provider: oauthProfile.provider,
      providerUserId: oauthProfile.providerUserId,
      providerEmail: oauthProfile.email,
      linkedAt: now,
      lastUsedAt: now,
    };

    const providers = existing.oauthProviders || [];
    const index = providers.findIndex((item) => item.provider === oauthProfile.provider);
    const mergedProviders = [...providers];
    if (index >= 0) {
      mergedProviders[index] = { ...mergedProviders[index], ...nextProvider, linkedAt: mergedProviders[index].linkedAt || now };
    } else {
      mergedProviders.push(nextProvider);
    }

    updateUser({
      ...existing,
      avatarUrl: existing.avatarUrl || oauthProfile.avatarUrl,
      oauthProviders: mergedProviders,
      registrationSource: existing.registrationSource || 'email',
    });
  };

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    setLoading(true);
    try {
      const authProvider = await getClientAuthProvider();
      const result = await authProvider.signInWithOAuth(provider, email || undefined);

      if (result.type === 'conflict') {
        toast({
          variant: 'destructive',
          title: t('accountExistsTitle'),
          description: t('accountExistsDesc', { methods: result.existingMethods.join(', ') || 'password' }),
        });
        return;
      }

      const existing = users.find((entry) => entry.email.toLowerCase() === result.profile.email.toLowerCase());
      if (existing) {
        linkOAuthToExistingUser(result.profile);

        // Create session cookie if Firebase auth provider is configured
        // (Supabase OAuth uses redirect — this code is unreachable for Supabase)
        try {
          const authProviderType = (process.env.AUTH_PROVIDER || 'firebase').toLowerCase();
          if (authProviderType === 'firebase') {
            const { getClientAuth } = await import('@/lib/firebase-client');
            const auth = getClientAuth();
            if (auth && auth.currentUser) {
              const idToken = await auth.currentUser.getIdToken();
              await createSessionAction(idToken);
            }
          }
        } catch {
          // Provider may not be configured — continue with mock login
        }

        login(result.profile.email);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(callbackUrl as any);
        return;
      }

      sessionStorage.setItem('oauth_prefill', JSON.stringify(result.profile));
      router.push('/register?source=oauth');
    } catch {
      toast({
        variant: 'destructive',
        title: t('oauthErrorTitle'),
        description: t('oauthErrorDesc'),
      })
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: t('enterEmailFirst') ?? 'Please enter your email first', variant: 'destructive' })
      return
    }
    toast({ title: t('passwordResetSent') ?? 'Password reset link sent', description: t('passwordResetSentDesc') ?? 'Check your inbox for instructions.' })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        variant: "destructive",
        title: t('toasts.missingEmail'),
        description: t('toasts.missingEmailDesc'),
      })
      return;
    }
    if (!password) {
      toast({
        variant: 'destructive',
        title: t('toasts.missingPassword') ?? 'Password required',
        description: t('toasts.missingPasswordDesc') ?? 'Please enter your password.',
      })
      return;
    }
    setLoading(true)

    try {
      const authProvider = await getClientAuthProvider();
      const token = await authProvider.signInWithEmailPassword(email, password);

      const result = await createSessionAction(token);
      if (!result.ok) {
        toast({
          variant: 'destructive',
          title: t('toasts.loginFailed'),
          description: result.error,
        });
        setLoading(false);
        return;
      }

      toast({
        title: t('toasts.loginSuccess'),
        description: t('toasts.loginSuccessDesc', { name: email.split('@')[0] }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(callbackUrl as any);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message : '';

      // Check if auth provider is not configured — fall back to mock login
      if (message.includes('not configured')) {
        // ── Dev fallback: mock login when auth provider is not configured ──
        setTimeout(() => {
          const { user, status } = login(email);

          if (status === 'approved' && user) {
            toast({
              title: t('toasts.loginSuccess'),
              description: t('toasts.loginSuccessDesc', { name: user.name.split(' ')[0] }),
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(callbackUrl as any);
          } else if (status === 'pending') {
            toast({
              variant: 'destructive',
              title: t('toasts.pendingAccount'),
              description: t('toasts.pendingAccountDesc'),
            });
            setLoading(false);
          } else {
            toast({
              variant: 'destructive',
              title: t('toasts.loginFailed'),
              description: t('toasts.loginFailedDesc'),
            });
            setLoading(false);
          }
        }, 500);
        return;
      }

      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast({
          variant: 'destructive',
          title: t('toasts.loginFailed'),
          description: t('toasts.loginFailedDesc'),
        });
      } else if (code === 'auth/too-many-requests') {
        toast({
          variant: 'destructive',
          title: t('toasts.loginFailed'),
          description: 'Too many attempts. Please try again later.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('toasts.loginFailed'),
          description: t('toasts.loginFailedDesc'),
        });
      }
      setLoading(false);
    }
  }

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ variant: 'destructive', title: t('toasts.missingEmail'), description: t('toasts.missingEmailDesc') })
      return;
    }
    setLoading(true)
    setTimeout(() => {
      try {
        toast({
          title: t('toasts.magicLinkSent'),
          description: t('toasts.magicLinkSentDesc'),
          variant: "default",
        })
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not send magic link. Try again.' })
      } finally {
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <Card className={cn("w-full max-w-md mx-4 shadow-xl", s.card)}>
      <CardHeader className="text-center">
        <CardTitle className={cn("text-2xl font-bold", s.heading)}>{t('cardTitle')}</CardTitle>
        <CardDescription>{t('cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-3 text-xs mb-6 flex items-start gap-2">
            <Icons.help className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{t('demoModeNotice')}</span>
          </div>
        )}
        <Tabs defaultValue="email" className="w-full" dir={dir}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">{t('emailPasswordTab')}</TabsTrigger>
            <TabsTrigger value="magic">{t('magicLinkTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input id="email" type="email" placeholder={t('emailPlaceholder')} required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('passwordLabel')}</Label>
                  <Link href="#" onClick={handleForgotPassword} className="ms-auto inline-block text-sm underline">
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loggingIn') : t('loginButton')}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="magic" className="pt-4">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">{t('emailLabel')}</Label>
                <Input id="magic-email" type="email" placeholder={t('emailPlaceholder')} required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('sending') : t('sendMagicLink')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t('orContinueWith')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={loading}>
            <Icons.google className="me-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" onClick={() => handleOAuthSignIn('microsoft')} disabled={loading}>
            <Icons.microsoft className="me-2 h-4 w-4" />
            Microsoft
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')} {" "}
          <Link href="/register" className="underline text-primary">
            {t('registerHere')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
