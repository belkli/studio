
'use client';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

const policySchema = z.object({
  studentNoticeHoursRequired: z.coerce.number().min(0, "חובה להזין מספר שעות חיובי."),
  studentCancellationCredit: z.enum(['FULL', 'NONE']),
  studentLateCancelCredit: z.enum(['FULL', 'NONE']),
  makeupCreditExpiryDays: z.coerce.number().min(0, "חובה להזין מספר ימים חיובי."),
  maxMakeupsPerTerm: z.coerce.number().min(0, "חובה להזין מספר חיובי."),
});

type PolicyFormData = z.infer<typeof policySchema>;

export function CancellationPolicySettings() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();

    const currentConservatorium = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const form = useForm<PolicyFormData>({
        resolver: zodResolver(policySchema),
        defaultValues: currentConservatorium?.cancellationPolicy || {
            studentNoticeHoursRequired: 24,
            studentCancellationCredit: 'FULL',
            studentLateCancelCredit: 'NONE',
            makeupCreditExpiryDays: 60,
            maxMakeupsPerTerm: 4,
        },
    });

    const onSubmit = (data: PolicyFormData) => {
        if (!currentConservatorium) return;
        const updatedPolicy = {
            ...data,
            noShowCredit: 'NONE', // This is non-configurable for now
        };
        updateConservatorium({ ...currentConservatorium, cancellationPolicy: updatedPolicy as any });
        toast({ title: 'מדיניות הביטולים עודכנה בהצלחה!' });
        form.reset(data); // Reset dirty state
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>כללי ביטול תלמידים</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <FormField name="studentNoticeHoursRequired" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>שעות התראה נדרשות לביטול עם זיכוי</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="studentCancellationCredit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>זיכוי עבור ביטול בזמן</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="FULL">זיכוי מלא</SelectItem><SelectItem value="NONE">ללא זיכוי</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField name="studentLateCancelCredit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>זיכוי עבור ביטול מאוחר</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="FULL">זיכוי מלא (לא מומלץ)</SelectItem><SelectItem value="NONE">ללא זיכוי</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>כללי שיעורי השלמה</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                             <FormField name="makeupCreditExpiryDays" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>תוקף זיכוי להשלמה (בימים)</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField name="maxMakeupsPerTerm" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>מקסימום שיעורי השלמה לסמסטר</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={!form.formState.isDirty}>
                        <Save className="me-2 h-4 w-4" />
                        שמור שינויים
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
