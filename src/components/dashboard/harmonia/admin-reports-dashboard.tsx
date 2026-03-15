'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReports } from "./reports/financial-reports";
import { OperationalReports } from "./reports/operational-reports";
import { AcademicReports } from "./reports/academic-reports";
import { TeacherReports } from "./reports/teacher-reports";
import { useTranslations, useLocale } from "next-intl";

export function AdminReportsDashboard() {
    const t = useTranslations('Reports');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';
    return (
        <Tabs defaultValue="financial" dir={isRtl ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="financial">{t('tabFinancial')}</TabsTrigger>
                <TabsTrigger value="operational">{t('tabOperational')}</TabsTrigger>
                <TabsTrigger value="academic">{t('tabAcademic')}</TabsTrigger>
                <TabsTrigger value="teachers">{t('teachers')}</TabsTrigger>
            </TabsList>
            <TabsContent value="financial">
                <FinancialReports />
            </TabsContent>
            <TabsContent value="operational">
                <OperationalReports />
            </TabsContent>
            <TabsContent value="academic">
                <AcademicReports />
            </TabsContent>
            <TabsContent value="teachers">
                <TeacherReports />
            </TabsContent>
        </Tabs>
    );
}
