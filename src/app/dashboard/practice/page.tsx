import { PracticeLogForm } from "@/components/dashboard/harmonia/practice-log-form";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import Link from "next/link";

export default function PracticeLogPage() {
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">רישום אימון</h1>
                    <p className="text-muted-foreground">תעד את האימונים שלך כדי לעקוב אחר ההתקדמות.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard/practice/upload">
                        <UploadCloud className="ms-2 h-4 w-4" />
                        העלה וידאו למשוב
                    </Link>
                </Button>
            </div>
            <div className="flex justify-center">
                <PracticeLogForm />
            </div>
        </div>
    );
}
