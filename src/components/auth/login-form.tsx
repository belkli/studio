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

export function LoginForm() {
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
        title: "אימייל חסר",
        description: "יש להזין כתובת אימייל.",
      })
      return;
    }
    setLoading(true)

    setTimeout(() => { // Simulate network delay
      const { user, status } = login(email);

      if (status === 'approved' && user) {
        toast({
          title: "התחברות מוצלחת",
          description: `ברוך הבא, ${user.name.split(' ')[0]}!`,
        });
      } else if (status === 'pending') {
        toast({
          variant: 'destructive',
          title: "חשבון ממתין לאישור",
          description: "חשבונך עדיין לא אושר על ידי מנהל הקונסרבטוריון.",
        });
        setLoading(false);
      } else { // status === 'not_found'
        toast({
          variant: 'destructive',
          title: "התחברות נכשלה",
          description: "לא נמצא משתמש עם האימייל שהוזן.",
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
        title: "קישור קסום נשלח!",
        description: "בדוק את תיבת הדואר שלך לקבלת הקישור.",
        variant: "default",
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">כניסה למערכת</CardTitle>
        <CardDescription>התחבר לחשבונך כדי להמשיך</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">אימייל וסיסמה</TabsTrigger>
            <TabsTrigger value="magic">קישור קסום</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">סיסמה</Label>
                  <Link href="#" className="ms-auto inline-block text-sm underline">
                    שכחת סיסמה?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "מתחבר..." : "התחבר"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="magic" className="pt-4">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">אימייל</Label>
                <Input id="magic-email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "שולח..." : "שלח קישור קסום"}
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
              או התחבר עם
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
          אין לך חשבון?{" "}
          <Link href="/register" className="underline text-primary">
            הרשם כאן
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
