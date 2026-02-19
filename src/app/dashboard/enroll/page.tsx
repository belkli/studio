import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

export default function AdminEnrollmentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">רישום תלמיד חדש (מנהל מערכת)</h1>
                <p className="text-muted-foreground">מלא את פרטי התלמיד/ה באופן ידני כדי ליצור עבורו/ה חשבון במערכת.</p>
            </div>
            <div className="flex items-center justify-center py-12">
                <EnrollmentWizard isAdminFlow={true} />
            </div>
        </div>
    );
}
