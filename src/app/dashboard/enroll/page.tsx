import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

export default function AdminEnrollmentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">רישום תלמיד חדש</h1>
                <p className="text-muted-foreground">מלא את פרטי התלמיד כדי לרשום אותו לקונסרבטוריון.</p>
            </div>
            <div className="flex items-center justify-center py-12">
                <EnrollmentWizard isAdminFlow={true} />
            </div>
        </div>
    );
}
