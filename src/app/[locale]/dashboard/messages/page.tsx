import { MessagingInterface } from "@/components/dashboard/harmonia/messaging-interface";

export default function MessagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">הודעות</h1>
                <p className="text-muted-foreground">תקשר עם תלמידים, הורים ומורים.</p>
            </div>
            <MessagingInterface />
        </div>
    );
}
