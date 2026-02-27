'use client';

import { useState } from "react";
import { FormsList } from "@/components/dashboard/forms-list";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FormsPage() {
    const t = useTranslations('FormsPage');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <Tabs defaultValue="all">
                <div className="flex items-center justify-between border-b pb-4">
                    <TabsList>
                        <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                        <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
                        <TabsTrigger value="approved">{t('tabs.approved')}</TabsTrigger>
                        <TabsTrigger value="drafts">{t('tabs.drafts')}</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={t('searchPlaceholder')}
                            className="w-full rounded-lg bg-muted ps-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <TabsContent value="all" className="pt-4">
                    <FormsList searchQuery={searchQuery} />
                </TabsContent>
                <TabsContent value="pending" className="pt-4">
                    <FormsList
                        statusFilter={['ממתין לאישור מורה', 'ממתין לאישור מנהל', 'נדרש תיקון']}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
                <TabsContent value="approved" className="pt-4">
                    <FormsList
                        statusFilter={['מאושר', 'מאושר סופית']}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
                <TabsContent value="drafts" className="pt-4">
                    <FormsList
                        statusFilter={['טיוטה']}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
