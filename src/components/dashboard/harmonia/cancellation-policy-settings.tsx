
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
import { useTranslations, useLocale } from 'next-intl';

const getPolicySchema = (t: any) => z.object({
    studentNoticeHoursRequired: z.coerce.number().min(0, t('errors.positiveHours')),
    studentCancellationCredit: z.enum(['FULL', 'NONE']),
    studentLateCancelCredit: z.enum(['FULL', 'NONE']),
    makeupCreditExpiryDays: z.coerce.number().min(0, t('errors.positiveDays')),
    maxMakeupsPerTerm: z.coerce.number().min(0, t('errors.positiveNumber')),
});

type PolicyFormData = z.infer<ReturnType<typeof getPolicySchema>>;

export function CancellationPolicySettings() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('CancellationPolicySettings');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const policySchema = getPolicySchema(t);

    const currentConservatorium = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const form = useForm<PolicyFormData>({
        resolver: zodResolver(policySchema) as any,
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
        toast({ title: t('successToast') });
        form.reset(data); // Reset dirty state
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('studentRulesTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <FormField name="studentNoticeHoursRequired" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('noticeHoursLabel')}</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="studentCancellationCredit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('cancellationCreditLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="FULL">{t('options.FULL')}</SelectItem><SelectItem value="NONE">{t('options.NONE')}</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="studentLateCancelCredit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('lateCancelCreditLabel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="FULL">{t('options.FULL_NOT_RECOMMENDED')}</SelectItem><SelectItem value="NONE">{t('options.NONE')}</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('makeupRulesTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <FormField name="makeupCreditExpiryDays" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('makeupExpiryLabel')}</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="maxMakeupsPerTerm" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('maxMakeupsLabel')}</FormLabel>
                                    <Input type="number" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>
                <div className={`flex ${isRtl ? 'justify-end' : 'justify-start'} mt-6`}>
                    <Button type="submit" disabled={!form.formState.isDirty}>
                        <Save className="me-2 h-4 w-4" />
                        {t('saveChanges')}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
