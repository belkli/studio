'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, newFeaturesEnabled } = useAuth();

    if (!user) {
        return null;
    }

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: 'הפרופיל עודכן', description: 'הפרטים האישיים שלך נשמרו.' });
    }

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: 'הסיסמה עודכנה', description: 'הסיסמה החדשה שלך נשמרה.' });
    }
    
    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הגדרות</h1>
                <p className="text-muted-foreground">נהל את הגדרות החשבון וההתראות שלך.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>פרופיל</CardTitle>
                    <CardDescription>עדכן את הפרטים האישיים שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">שם מלא</Label>
                            <Input id="name" defaultValue={user.name} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">כתובת אימייל</Label>
                            <Input id="email" type="email" defaultValue={user.email} />
                        </div>
                        <Button type="submit">שמור שינויים</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>סיסמה</CardTitle>
                    <CardDescription>שנה את הסיסמה שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">סיסמה נוכחית</Label>
                            <Input id="current-password" type="password" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="new-password">סיסמה חדשה</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <Button type="submit">עדכן סיסמה</Button>
                    </form>
                </CardContent>
            </Card>

             {isAdmin && newFeaturesEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle>הגדרות מוסד</CardTitle>
                        <CardDescription>נהל הגדרות גלובליות עבור המוסד שלך, כולל תכונות, תמחור ועוד.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button asChild variant="outline"><Link href="/dashboard/settings/conservatorium">ניהול תכונות</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/settings/pricing">הגדרות תמחור</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/settings/cancellation">מדיניות ביטולים</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/ai">ניהול סוכני AI</Link></Button>
                    </CardContent>
                </Card>
            )}


            <Card>
                <CardHeader>
                    <CardTitle>התראות</CardTitle>
                    <CardDescription>בחר אילו התראות לקבל ובאיזה ערוץ - אימייל, SMS או בתוך האפליקציה.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        התאם אישית את ההתראות עבור תזכורות שיעורים, ביטולים, עדכוני חיובים ועוד.
                    </p>
                </CardContent>
                <CardFooter>
                     <Button asChild>
                        <Link href="/dashboard/settings/notifications">נהל העדפות התראות</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
