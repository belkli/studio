import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockFormSubmissions } from "@/lib/data";

const FormCard = ({ form }: { form: (typeof mockFormSubmissions)[0] }) => (
    <Card className="mb-4">
        <CardContent className="p-4">
            <h4 className="font-semibold">{form.studentName}</h4>
            <p className="text-sm text-muted-foreground">{form.formType}</p>
            <p className="text-sm text-muted-foreground">הוגש: {form.submissionDate}</p>
            <p className="text-sm text-muted-foreground">משך: {form.totalDuration}</p>
        </CardContent>
    </Card>
)

export default function ApprovalsPage() {
    const pendingForms = mockFormSubmissions.filter(f => f.status === 'ממתין לאישור מורה');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">אישורים ממתינים</h1>
                <p className="text-muted-foreground">כאן תוכל לצפות ולאשר טפסים של תלמידים.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>ממתין לאישור ({pendingForms.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingForms.map(form => <FormCard key={form.id} form={form} />)}
                        {pendingForms.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">אין טפסים ממתינים.</p>}
                    </CardContent>
                </Card>
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>בבדיקה (0)</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground p-4 text-center">גרור טפסים לכאן כדי לסמן אותם כ"בבדיקה".</p>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>מאושר (0)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground p-4 text-center">גרור טפסים לכאן כדי לאשר אותם.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
