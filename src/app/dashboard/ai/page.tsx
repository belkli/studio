'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bot, BrainCircuit, HeartHandshake, MessageSquare, Presentation, Bell, Search, FilePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";

const agents = [
    {
        icon: HeartHandshake,
        title: "סוכן ההתאמה (Matchmaker)",
        description: "מתאים אוטומטית בין תלמידים חדשים למורים הזמינים המתאימים ביותר על סמך פרופיל מוזיקלי, מטרות וזמינות.",
        id: "matchmaker-agent",
        defaultChecked: true,
    },
    {
        icon: FilePlus,
        title: "סוכן הצעת יצירות",
        description: "מציע יצירות רלוונטיות לרפרטואר על בסיס רמת התלמיד, מטרותיו והיצירות שכבר נבחרו.",
        id: "composition-suggester",
        defaultChecked: true,
    },
    {
        icon: MessageSquare,
        title: "סוכן תיאום (Rescheduling Concierge)",
        description: "מטפל בבקשות לביטול ושינוי מועד שיעורים באופן אוטומטי דרך וואטסאפ או צ'אט.",
        id: "reschedule-agent",
        defaultChecked: false,
    },
    {
        icon: Presentation,
        title: "סוכן דוחות התקדמות",
        description: "מייצר טיוטה ראשונית של דוחות התקדמות תקופתיים עבור מורים, על בסיס יומני אימון והערות שיעור.",
        id: "progress-report-agent",
        defaultChecked: false,
    },
    {
        icon: Bell,
        title: "סוכן התראות למנהלים",
        description: "מנטר את המערכת באופן רציף ומציף בעיות תפעוליות לפני שהן הופכות למשבר.",
        id: "admin-alerts-agent",
        defaultChecked: true,
    },
    {
        icon: Search,
        title: "סוכן שימור לידים",
        description: "מבצע מעקב אוטומטי ומותאם אישית אחרי תלמידים שנרשמו לשיעור ניסיון ולא המשיכו לחבילה.",
        id: "lead-nurture-agent",
        defaultChecked: false,
    }
];

export default function AiAgentsPage() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();

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
        
        toast({
            title: "הגדרה עודכנה",
            description: `סוכן "${agents.find(a => a.id === agentId)?.title}" ${enabled ? 'הופעל' : 'כובה'}.`
        });
    };
    
    if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
        return <p>אין לך הרשאה לצפות בעמוד זה.</p>
    }

    if (!currentConservatorium) {
        return <div>טוען הגדרות...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">סוכני AI</h1>
                <p className="text-muted-foreground">נהל את האוטומציות והסוכנים החכמים של המערכת.</p>
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
