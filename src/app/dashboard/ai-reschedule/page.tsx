'use client';
import { ReschedulingChatWidget } from "@/components/dashboard/harmonia/rescheduling-chat-widget";
import { useAuth } from "@/hooks/use-auth";

export default function AiReschedulePage() {
    const { user } = useAuth();
    
    if (!user || (user.role !== 'student' && user.role !== 'parent')) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">עוזר תיאום AI</h1>
                    <p className="text-muted-foreground">עמוד זה זמין לתלמידים והורים בלבד.</p>
                </div>
            </div>
        );
    }
    
    return (
        <ReschedulingChatWidget />
    );
}
