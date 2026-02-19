'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialReports } from "./reports/financial-reports";
import { OperationalReports } from "./reports/operational-reports";
import { AcademicReports } from "./reports/academic-reports";

export function AdminReportsDashboard() {
    return (
        <Tabs defaultValue="financial">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="financial">דוחות פיננסיים</TabsTrigger>
                <TabsTrigger value="operational">דוחות תפעוליים</TabsTrigger>
                <TabsTrigger value="academic">דוחות אקדמיים</TabsTrigger>
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
        </Tabs>
    );
}
