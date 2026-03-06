'use client';

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SheetMusicViewer = dynamic(
    () => import("@/components/dashboard/harmonia/sheet-music-viewer").then(mod => ({ default: mod.SheetMusicViewer })),
    { loading: () => <Skeleton className="h-[600px] w-full" /> }
);

export default function StudentRepertoirePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ספריית תווים דיגיטלית</h1>
                <p className="text-muted-foreground">עיין בתווים של היצירות אותן המורה שייך אליך ובצע תרגול מותאם אישית.</p>
            </div>

            <SheetMusicViewer />
        </div>
    );
}
