'use client';

import { Button } from "@/components/ui/button";
import { EventsList } from "@/components/dashboard/harmonia/events-list";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function EventsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ניהול אירועים ורסיטלים</h1>
                    <p className="text-muted-foreground">תכנן, נהל והפק את כל האירועים של הקונסרבטוריון.</p>
                </div>
                {isAdmin && (
                    <Button asChild>
                        <Link href="/dashboard/events/new">
                            <PlusCircle className="me-2 h-4 w-4" />
                            צור אירוע חדש
                        </Link>
                    </Button>
                )}
            </div>
            <EventsList />
        </div>
    );
}
