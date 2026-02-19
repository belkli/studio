import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-indigo-50/50 via-background to-background">
            <EnrollmentWizard />
        </div>
    );
}
