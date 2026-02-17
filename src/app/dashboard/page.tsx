'use client';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentForms } from "@/components/dashboard/recent-forms";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) {
        return null; // Or a loading spinner
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ברוך הבא, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted-foreground">זהו לוח הבקרה שלך להיום.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/forms/new">
                        <PlusCircle className="me-2 h-4 w-4" />
                        טופס חדש
                    </Link>
                </Button>
            </div>
            <OverviewCards />
            <RecentForms />
        </div>
    )
}
