import { PracticeVideoUploadForm } from "@/components/dashboard/harmonia/practice-video-upload-form";

export default function PracticeVideoUploadPage() {
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-2xl font-bold">העלאת וידאו למשוב</h1>
                <p className="text-muted-foreground">קבל/י פידבק מהמורה שלך בין השיעורים.</p>
            </div>
            <div className="flex justify-center">
                <PracticeVideoUploadForm />
            </div>
        </div>
    );
}
