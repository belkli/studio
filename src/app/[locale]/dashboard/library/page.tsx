import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function LibraryPage() {
    const t = await getTranslations('DashboardPages');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('library.title')}</h1>
                <p className="text-muted-foreground">{t('library.description')}</p>
            </div>
            <div className="flex items-center justify-center h-96">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">{t('library.underConstruction')}</CardTitle>
                        <CardDescription>
                            {t('library.underConstructionDesc')}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
