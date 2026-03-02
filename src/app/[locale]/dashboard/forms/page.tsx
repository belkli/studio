'use client';

import { useState } from "react";
import { FormsList } from "@/components/dashboard/forms-list";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { FormStatus } from "@/lib/types";

export default function FormsPage() {
    const t = useTranslations('FormsPage');
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    // Role-aware subtitle
    const getSubtitle = () => {
        if (!user) return t('subtitle');
        switch (user.role) {
            case 'student': return t('subtitleStudent');
            case 'parent': return t('subtitleParent');
            case 'teacher': return t('subtitleTeacher');
            default: return t('subtitle');
        }
    };

    // Show New Form button only for students and teachers who can create forms
    const canCreateForm = user?.role === 'student' || user?.role === 'teacher';

    const pendingStatuses: FormStatus[] = ['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'];
    const approvedStatuses: FormStatus[] = ['APPROVED', 'FINAL_APPROVED'];
    const draftStatuses: FormStatus[] = ['DRAFT'];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{getSubtitle()}</p>
                </div>
                {canCreateForm && (
                    <Button asChild>
                        <Link href="/dashboard/forms/new">{t('newForm')}</Link>
                    </Button>
                )}
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
                        statusFilter={pendingStatuses}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
                <TabsContent value="approved" className="pt-4">
                    <FormsList
                        statusFilter={approvedStatuses}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
                <TabsContent value="drafts" className="pt-4">
                    <FormsList
                        statusFilter={draftStatuses}
                        searchQuery={searchQuery}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
