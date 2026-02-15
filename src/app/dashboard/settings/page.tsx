import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mockUser } from "@/lib/data";

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">הגדרות</h1>
                <p className="text-muted-foreground">נהל את הגדרות החשבון וההתראות שלך.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>פרופיל</CardTitle>
                    <CardDescription>עדכן את הפרטים האישיים שלך.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">שם מלא</Label>
                        <Input id="name" defaultValue={mockUser.name} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">כתובת אימייל</Label>
                        <Input id="email" type="email" defaultValue={mockUser.email} />
                    </div>
                    <Button>שמור שינויים</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>סיסמה</CardTitle>
                    <CardDescription>שנה את הסיסמה שלך.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">סיסמה נוכחית</Label>
                        <Input id="current-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-password">סיסמה חדשה</Label>
                        <Input id="new-password" type="password" />
                    </div>
                    <Button>עדכן סיסמה</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>התראות</CardTitle>
                    <CardDescription>נהל את העדפות ההתראות שלך.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="email-notifications">התראות באימייל</Label>
                            <p className="text-sm text-muted-foreground">קבל אימיילים על עדכוני טפסים ואישורים.</p>
                        </div>
                        <Switch id="email-notifications" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="push-notifications">התראות דחיפה</Label>
                            <p className="text-sm text-muted-foreground">קבל התראות דחיפה בדפדפן.</p>
                        </div>
                        <Switch id="push-notifications" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
