'use client';

import { SheetMusicViewer } from "@/components/dashboard/harmonia/sheet-music-viewer";

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
