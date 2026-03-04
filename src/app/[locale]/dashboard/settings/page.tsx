'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Icons } from "@/components/icons";
import { signInWithGoogle, signInWithMicrosoft } from '@/lib/auth/oauth';
import type { UserOAuthProvider } from '@/lib/types';
import { useState, type ReactNode } from 'react';

export default function SettingsPage() {
    const t = useTranslations("SettingsPage");
    const locale = useLocale();
    const isRtl = locale === "he" || locale === "ar";
    const { toast } = useToast();
    const { user, updateUser, newFeaturesEnabled } = useAuth();
    const [linkingProvider, setLinkingProvider] = useState<'google' | 'microsoft' | null>(null);

    if (!user) {
        return null;
    }

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('profile.success'),
            description: t('profile.successDesc')
        });
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('password.success'),
            description: t('password.successDesc')
        });
    };

    const linkProvider = async (provider: 'google' | 'microsoft') => {
        setLinkingProvider(provider);
        try {
            const result = provider === 'google'
                ? await signInWithGoogle({ fallbackEmail: user.email })
                : await signInWithMicrosoft({ fallbackEmail: user.email });

            if (result.type === 'conflict') {
                toast({
                    variant: 'destructive',
                    title: t('linkedAccounts.conflictTitle'),
                    description: t('linkedAccounts.conflictDesc', { methods: result.existingMethods.join(', ') || 'password' }),
                });
                return;
            }

            if (result.profile.email.toLowerCase() !== user.email.toLowerCase()) {
                toast({
                    variant: 'destructive',
                    title: t('linkedAccounts.emailMismatchTitle'),
                    description: t('linkedAccounts.emailMismatchDesc'),
                });
                return;
            }

            const now = new Date().toISOString();
            const nextProvider: UserOAuthProvider = {
                userId: user.id,
                provider,
                providerUserId: result.profile.providerUserId,
                providerEmail: result.profile.email,
                linkedAt: now,
                lastUsedAt: now,
            };

            const existing = user.oauthProviders || [];
            const index = existing.findIndex((item) => item.provider === provider);
            const updatedProviders = [...existing];
            if (index >= 0) {
                updatedProviders[index] = {
                    ...updatedProviders[index],
                    ...nextProvider,
                    linkedAt: updatedProviders[index].linkedAt || now,
                };
            } else {
                updatedProviders.push(nextProvider);
            }

            updateUser({
                ...user,
                oauthProviders: updatedProviders,
                avatarUrl: user.avatarUrl || result.profile.avatarUrl,
                registrationSource: user.registrationSource || 'email',
            });

            toast({
                title: t('linkedAccounts.linkedTitle'),
                description: t('linkedAccounts.linkedDesc', { provider: provider === 'google' ? 'Google' : 'Microsoft' }),
            });
        } catch {
            toast({
                variant: 'destructive',
                title: t('linkedAccounts.errorTitle'),
                description: t('linkedAccounts.errorDesc'),
            });
        } finally {
            setLinkingProvider(null);
        }
    };

    const unlinkProvider = (provider: 'google' | 'microsoft') => {
        const updatedProviders = (user.oauthProviders || []).filter((item) => item.provider !== provider);
        updateUser({ ...user, oauthProviders: updatedProviders });
        toast({
            title: t('linkedAccounts.unlinkedTitle'),
            description: t('linkedAccounts.unlinkedDesc', { provider: provider === 'google' ? 'Google' : 'Microsoft' }),
        });
    };

    const providerRows: Array<{
        provider: 'google' | 'microsoft';
        label: string;
        icon: ReactNode;
        linked: UserOAuthProvider | undefined;
    }> = [
        {
            provider: 'google',
            label: 'Google',
            icon: <Icons.google className="h-4 w-4" />,
            linked: user.oauthProviders?.find((item) => item.provider === 'google'),
        },
        {
            provider: 'microsoft',
            label: 'Microsoft',
            icon: <Icons.microsoft className="h-4 w-4" />,
            linked: user.oauthProviders?.find((item) => item.provider === 'microsoft'),
        },
    ];

    const isAdmin = user.role === 'conservatorium_admin' || user.role === 'site_admin';

    return (
        <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
            <div>
                <h1 className="text-2xl font-bold text-start">{t('title')}</h1>
                <p className="text-muted-foreground text-start">{t('subtitle')}</p>
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

            <Card>
                <CardHeader>
                    <CardTitle>{t('linkedAccounts.title')}</CardTitle>
                    <CardDescription>{t('linkedAccounts.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {providerRows.map(({ provider, label, icon, linked }) => (
                        <div key={provider} className="flex items-center justify-between rounded-md border p-3">
                            <div className="flex items-center gap-3">
                                <span aria-hidden>{icon}</span>
                                <div>
                                    <p className="font-medium">{label}</p>
                                    {linked && <p className="text-sm text-muted-foreground text-start">{linked.providerEmail}</p>}
                                </div>
                            </div>
                            {linked ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => unlinkProvider(provider)}>
                                    {t('linkedAccounts.unlink')}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => linkProvider(provider)}
                                    disabled={linkingProvider === provider}
                                >
                                    {t('linkedAccounts.link')}
                                </Button>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('conservatorium.title')}</CardTitle>
                        <CardDescription>{t('conservatorium.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button asChild variant="default"><Link href="/dashboard/settings/conservatorium/profile">{t('conservatorium.publicProfile')}</Link></Button>
                        {newFeaturesEnabled && (
                            <>
                                <Button asChild variant="outline"><Link href="/dashboard/settings/conservatorium">{t('conservatorium.manageFeatures')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/dashboard/settings/pricing">{t('conservatorium.pricing')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/dashboard/settings/cancellation">{t('conservatorium.cancellation')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/dashboard/settings/instruments">{t('conservatorium.instruments')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/dashboard/settings/packages">{t('conservatorium.packages')}</Link></Button>
                                <Button asChild variant="outline"><Link href="/dashboard/ai">{t('conservatorium.manageAI')}</Link></Button>
                            </>
                        )}
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
    );
}
