
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function SettingsPage() {
    const t = useTranslations("SettingsPage");
    const { toast } = useToast();
    const { user, newFeaturesEnabled } = useAuth();

    if (!user) {
        return null;
    }

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('profile.success'),
            description: t('profile.successDesc')
        });
    }

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('password.success'),
            description: t('password.successDesc')
        });
    }

    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('profile.title')}</CardTitle>
                    <CardDescription>{t('profile.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('profile.name')}</Label>
                            <Input id="name" defaultValue={user.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('profile.email')}</Label>
                            <Input id="email" type="email" defaultValue={user.email} />
                        </div>
                        <Button type="submit">{t('profile.save')}</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('password.title')}</CardTitle>
                    <CardDescription>{t('password.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">{t('password.current')}</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t('password.new')}</Label>
                            <Input id="new-password" type="password" />
                        </div>
                        <Button type="submit">{t('password.update')}</Button>
                    </form>
                </CardContent>
            </Card>

            {isAdmin && newFeaturesEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('conservatorium.title')}</CardTitle>
                        <CardDescription>{t('conservatorium.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button asChild variant="outline"><Link href="/dashboard/settings/conservatorium">{t('conservatorium.manageFeatures')}</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/settings/pricing">{t('conservatorium.pricing')}</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/settings/cancellation">{t('conservatorium.cancellation')}</Link></Button>
                        <Button asChild variant="outline"><Link href="/dashboard/ai">{t('conservatorium.manageAI')}</Link></Button>
                    </CardContent>
                </Card>
            )}


            <Card>
                <CardHeader>
                    <CardTitle>{t('notifications.title')}</CardTitle>
                    <CardDescription>{t('notifications.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('notifications.prompt')}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild>
                        <Link href="/dashboard/settings/notifications">{t('notifications.manage')}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
