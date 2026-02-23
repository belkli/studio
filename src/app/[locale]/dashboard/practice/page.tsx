
import { PracticeLogForm } from "@/components/dashboard/harmonia/practice-log-form";
import { Button } from "@/components/ui/button";
import { UploadCloud, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function PracticeLogPage() {
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">רישום אימון</h1>
                    <p className="text-muted-foreground">תעד את האימונים שלך כדי לעקוב אחר ההתקדמות.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/practice/upload">
                            <UploadCloud className="ms-2 h-4 w-4" />
                            העלה וידאו למשוב
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/practice/coach">
                            <BrainCircuit className="ms-2 h-4 w-4" />
                            פתח מאמן AI
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="flex justify-center">
                <PracticeLogForm />
            </div>
        </div>
    );
}
