'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReports } from "./reports/financial-reports";
import { OperationalReports } from "./reports/operational-reports";
import { AcademicReports } from "./reports/academic-reports";
import { TeacherReports } from "./reports/teacher-reports";
import { useTranslations } from "next-intl";

export function AdminReportsDashboard() {
    const t = useTranslations('Reports');
    return (
        <Tabs defaultValue="financial" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="financial">דוחות פיננסיים</TabsTrigger>
                <TabsTrigger value="operational">דוחות תפעוליים</TabsTrigger>
                <TabsTrigger value="academic">דוחות אקדמיים</TabsTrigger>
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
