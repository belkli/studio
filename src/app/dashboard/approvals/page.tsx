'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockFormSubmissions } from "@/lib/data";
import { Check, Eye, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const FormCard = ({ form }: { form: (typeof mockFormSubmissions)[0] }) => {
    const { toast } = useToast();
    
    const handleApprove = () => {
        toast({ title: "הטופס אושר", description: `הטופס של ${form.studentName} אושר בהצלחה.` });
    }
    
    const handleReject = () => {
        toast({ variant: "destructive", title: "הטופס נדחה", description: `הטופס של ${form.studentName} נדחה.` });
    }

    return (
        <Card className="mb-4 flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{form.studentName}</CardTitle>
                <p className="text-sm text-muted-foreground">{form.formType}</p>
            </CardHeader>
            <CardContent className="flex-grow text-sm text-muted-foreground space-y-1">
                <p>הוגש: {form.submissionDate}</p>
                <p>משך: {form.totalDuration}</p>
            </CardContent>
            <CardFooter className="p-2 pt-0 grid grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm" className="col-span-1">
                    <Link href={`/dashboard/forms/${form.id}`}>
                        <Eye className="ms-1 h-4 w-4" />
                        צפייה
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleApprove} className="col-span-1 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800">
                    <Check className="ms-1 h-4 w-4" />
                    אישור
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReject} className="col-span-1 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800">
                    <ThumbsDown className="ms-1 h-4 w-4" />
                    דחייה
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ApprovalsPage() {
    const pendingForms = mockFormSubmissions.filter(f => f.status === 'ממתין לאישור מורה');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">אישורים ממתינים</h1>
                <p className="text-muted-foreground">כאן תוכל לצפות ולאשר טפסים של תלמידים.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
