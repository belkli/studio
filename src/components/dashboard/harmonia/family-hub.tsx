'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { differenceInYears } from 'date-fns';
import { AgeUpgradeModal } from "./age-upgrade-modal";
import type { User } from "@/lib/types";
import { WeeklyDigestCard } from "./weekly-digest-card";
import { PlayingSchoolChildCard } from "./playing-school-child-card";
import { useTranslations, useLocale } from 'next-intl';

export function FamilyHub() {
    const { user, users, isLoading } = useAuth();
    const [selectedChildForUpgrade, setSelectedChildForUpgrade] = useState<User | null>(null);
    const t = useTranslations('FamilyHub');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const children = useMemo(() => {
        if (!user || !user.childIds) return [];
        return user.childIds.map(childId => users.find(u => u.id === childId)).filter(Boolean) as User[];
    }, [user, users]);

    if (isLoading || !user) {
        return (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Skeleton className="h-[450px] w-full" />
                <Skeleton className="h-[450px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {children.map((child, index) => {
                    const age = child.birthDate ? differenceInYears(new Date(), new Date(child.birthDate)) : 0;
                    const needsAgeUpgrade = age === 13 && (!child.email || child.email === user.email);

                    return (
                        <div key={child.id} id={`child-card-${index}`} className="flex flex-col gap-6">
                            <WeeklyDigestCard child={child} />
                            {child.playingSchoolInfo && (
                                <PlayingSchoolChildCard
                                    child={child}
                                    psInfo={child.playingSchoolInfo}
                                />
                            )}
                            {needsAgeUpgrade && (
                                <Button variant="outline" className="w-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" onClick={() => setSelectedChildForUpgrade(child)}>
                                    {t('inviteChildToManage', { name: child.name.split(' ')[0] })}
                                </Button>
                            )}
                        </div>
                    );
                })}
                <Card className="border-dashed flex flex-col items-center justify-center min-h-[224px]">
                    <CardHeader className="text-center">
                        <PlusCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                        <CardTitle className="mt-2">{t('addChildTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/register">{t('newRegistration')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <AgeUpgradeModal
                child={selectedChildForUpgrade}
                open={!!selectedChildForUpgrade}
                onOpenChange={() => setSelectedChildForUpgrade(null)}
            />
        </div>
    );
}
