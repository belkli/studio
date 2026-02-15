import { NewForm } from "@/components/forms/new-form";

export default function NewFormPage() {
    return (
         <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">יצירת טופס חדש</h1>
                <p className="text-muted-foreground">מלא את הפרטים ליצירת טופס רסיטל חדש.</p>
            </div>
            <NewForm />
        </div>
    )
}
