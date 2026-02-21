'use client';

import { FormBuilder } from "@/components/dashboard/harmonia/form-builder";
import { useAuth } from "@/hooks/use-auth";

export default function FormBuilderPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'conservatorium_admin' || user?.role === 'site_admin';

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">בנאי טפסים</h1>
                    <p className="text-muted-foreground">אין לך הרשאה לצפות בעמוד זה.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">בנאי טפסים דינמי</h1>
                <p className="text-muted-foreground">צור וערוך תבניות טפסים מותאמות אישית עבור המוסד שלך.</p>
            </div>
            <FormBuilder />
        </div>
    );
}
