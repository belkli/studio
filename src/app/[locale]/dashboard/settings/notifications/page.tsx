
'use client';
import { Button } from "@/components/ui/button";
import { NotificationPreferences } from "@/components/dashboard/harmonia/notification-preferences";
import { Link } from '@/i18n/routing';
import { ArrowLeft } from "lucide-react";

export default function NotificationSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">העדפות התראות</h1>
                    <p className="text-muted-foreground">בחר כיצד ומתי לקבל עדכונים מהמערכת.</p>
                </div>
            </div>
            <NotificationPreferences />
        </div>
    );
}
