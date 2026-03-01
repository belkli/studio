'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bot, BrainCircuit, HeartHandshake, MessageSquare, Presentation, Bell, Search, FilePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from 'next-intl';
import { useMemo } from "react";

export default function AiAgentsPage() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('AiAgents');

    const agents = [
        { icon: HeartHandshake, title: t('agents.matchmaker'), description: t('agents.matchmakerDesc'), id: "matchmaker-agent", defaultChecked: true },
        { icon: FilePlus, title: t('agents.compositionSuggester'), description: t('agents.compositionSuggesterDesc'), id: "composition-suggester", defaultChecked: true },
        { icon: MessageSquare, title: t('agents.reschedule'), description: t('agents.rescheduleDesc'), id: "reschedule-agent", defaultChecked: false },
        { icon: Presentation, title: t('agents.progressReport'), description: t('agents.progressReportDesc'), id: "progress-report-agent", defaultChecked: false },
        { icon: Bell, title: t('agents.adminAlerts'), description: t('agents.adminAlertsDesc'), id: "admin-alerts-agent", defaultChecked: true },
        { icon: Search, title: t('agents.leadNurture'), description: t('agents.leadNurtureDesc'), id: "lead-nurture-agent", defaultChecked: false },
    ];

    const currentConservatorium = useMemo(() => {
        if (!user) return null;
        return conservatoriums.find(c => c.id === user.conservatoriumId);
    }, [user, conservatoriums]);

    const handleAgentToggle = (agentId: string, enabled: boolean) => {
        if (!currentConservatorium) return;

        const newConfig = {
            ...currentConservatorium.aiAgentsConfig,
            [agentId]: enabled,
        };

        updateConservatorium({ ...currentConservatorium, aiAgentsConfig: newConfig });

        const agentName = agents.find(a => a.id === agentId)?.title || '';
        toast({
            title: t('settingUpdated'),
            description: t('agentToggled', { name: agentName, state: enabled ? t('activated') : t('deactivated') })
        });
    };

    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>{t('noPermission')}</p>;
    }

    if (!currentConservatorium) {
        return <div>{t('loadingSettings')}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('manageAutomations')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => {
                    const isChecked = currentConservatorium.aiAgentsConfig?.[agent.id] ?? agent.defaultChecked;
                    return (
                        <Card key={agent.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                            <agent.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle>{agent.title}</CardTitle>
                                    </div>
                                    <Switch
                                        id={agent.id}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handleAgentToggle(agent.id, checked)}
                                        aria-label={`Enable ${agent.title}`}
                                    />
                                </div>
                                <CardDescription className="pt-2">{agent.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
