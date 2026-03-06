'use client';

import { AiMatchmakerForm } from "@/components/dashboard/harmonia/ai-matchmaker-form";

export default function MatchmakerPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 shadow-inner">
            <div className="max-w-3xl w-full space-y-2 mb-8 text-center text-purple-900">
                <h1 className="text-3xl font-extrabold tracking-tight">ברוכים הבאים ל&quot;הרמוניה&quot;</h1>
                <p className="text-lg opacity-80 mt-2">רגע לפני שמתחילים את המסע המוזיקלי, בואו נמצא את המורה המושלם עבורכם.</p>
            </div>

            <div className="w-full">
                <AiMatchmakerForm />
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
                © 2026 קונסרבטוריון &quot;הרמוניה&quot;. כל הזכויות שמורות למשרד החינוך.
            </div>
        </div>
    );
}
