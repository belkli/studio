"use client"
import { Link } from "@/i18n/routing";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from "next-intl"

export function LoginForm() {
  const t = useTranslations("Auth")
  const { toast } = useToast()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password') // Mock password

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        variant: "destructive",
        title: t('toasts.missingEmail'),
        description: t('toasts.missingEmailDesc'),
      })
      return;
    }
    setLoading(true)

    setTimeout(() => { // Simulate network delay
      const { user, status } = login(email);

      if (status === 'approved' && user) {
        toast({
          title: t('toasts.loginSuccess'),
          description: t('toasts.loginSuccessDesc', { name: user.name.split(' ')[0] }),
        });
      } else if (status === 'pending') {
        toast({
          variant: 'destructive',
          title: t('toasts.pendingAccount'),
          description: t('toasts.pendingAccountDesc'),
        });
        setLoading(false);
      } else { // status === 'not_found'
        toast({
          variant: 'destructive',
          title: t('toasts.loginFailed'),
          description: t('toasts.loginFailedDesc'),
        });
        setLoading(false);
      }
    }, 500);
  }

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast({
        title: t('toasts.magicLinkSent'),
        description: t('toasts.magicLinkSentDesc'),
        variant: "default",
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{t('cardTitle')}</CardTitle>
        <CardDescription>{t('cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">{t('emailPasswordTab')}</TabsTrigger>
            <TabsTrigger value="magic">{t('magicLinkTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('passwordLabel')}</Label>
                  <Link href="#" className="ms-auto inline-block text-sm underline">
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
                <Input id="magic-email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <Button variant="outline" disabled={loading}>
            <Icons.google className="me-2 h-4 w-4" />
            Google
          </Button>
          <Button variant="outline" disabled={loading}>
            <Icons.microsoft className="me-2 h-4 w-4" />
            Microsoft
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{" "}
          <Link href="/register" className="underline text-primary">
            {t('registerHere')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
