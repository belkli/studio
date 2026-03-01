'use client';

import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import type { FormTemplate, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const getFieldSchema = (t: any) => z.object({
    label: z.string().min(1, t('labelRequired')),
    type: z.enum(['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.string().optional(), // For dropdowns
});

const getWorkflowStepSchema = (t: any) => z.object({
    roleName: z.string().min(1, t('stepNameRequired')),
    requiredRole: z.enum(['teacher', 'conservatorium_admin', 'site_admin']),
});

const getFormBuilderSchema = (t: any) => z.object({
    title: z.string().min(3, t('titleMinLength')),
    description: z.string().optional(),
    fields: z.array(getFieldSchema(t)).min(1, t('fieldRequired')),
    workflow: z.array(getWorkflowStepSchema(t)).min(1, t('approvalStepRequired')),
});

type FormBuilderData = z.infer<ReturnType<typeof getFormBuilderSchema>>;

export function FormBuilder() {
    const { addFormTemplate } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const t = useTranslations('FormBuilder');
    const formSchema = getFormBuilderSchema(t);

    const fieldTypeOptions = [
        { value: 'text', label: t('textField') },
        { value: 'textarea', label: t('textArea') },
        { value: 'number', label: t('numberField') },
        { value: 'date', label: t('dateField') },
        { value: 'dropdown', label: t('dropdownField') },
        { value: 'checkbox', label: t('checkboxField') },
    ];

    const roleOptions: { value: UserRole; label: string }[] = [
        { value: 'teacher', label: t('roleTeacher') },
        { value: 'conservatorium_admin', label: t('roleAdmin') },
    ];

    const form = useForm<FormBuilderData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            fields: [{ label: '', type: 'text', required: false, placeholder: '', options: '' }],
            workflow: [{ roleName: t('defaultTeacherApproval'), requiredRole: 'teacher' }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "fields" });
    const { fields: workflowSteps, append: appendWorkflowStep, remove: removeWorkflowStep } = useFieldArray({ control: form.control, name: "workflow" });

    const onSubmit = (data: FormBuilderData) => {
        addFormTemplate({
            title: data.title,
            description: data.description,
            fields: data.fields.map((f, i) => ({ ...f, id: `field-${Date.now()}-${i}` })),
            workflow: data.workflow.map((w, i) => ({ ...w, id: `wf-${Date.now()}-${i}`, stepIndex: i })),
        } as Partial<FormTemplate>);

        toast({
            title: t('templateSavedTitle'),
            description: t('templateSavedDesc', { title: data.title }),
        });
        router.push('/dashboard/forms/new');
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>{t('formDetailsTitle')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem> <FormLabel>{t('formTitleLabel')}</FormLabel> <FormControl><Input placeholder={t('formTitlePlaceholder')} {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem> <FormLabel>{t('descriptionLabel')}</FormLabel> <FormControl><Textarea placeholder={t('descriptionPlaceholder')} {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('formFieldsTitle')}</CardTitle>
                        <CardDescription>{t('formFieldsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold pt-2">{t('fieldItemLabel', { index: index + 1 })}</h4>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name={`fields.${index}.label`} render={({ field: formField }) => (<FormItem> <FormLabel>{t('fieldLabel')}</FormLabel> <FormControl><Input {...formField} /></FormControl> <FormMessage /> </FormItem>)} />
                                    <FormField control={form.control} name={`fields.${index}.type`} render={({ field: formField }) => (<FormItem> <FormLabel>{t('fieldType')}</FormLabel> <Select onValueChange={formField.onChange} defaultValue={formField.value} dir="rtl"> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> {fieldTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                                    <FormField control={form.control} name={`fields.${index}.required`} render={({ field: formField }) => (<FormItem className="flex flex-row items-end space-x-3 space-x-reverse pb-2"> <FormControl><Checkbox checked={formField.value} onCheckedChange={formField.onChange} /></FormControl> <FormLabel>{t('requiredField')}</FormLabel> </FormItem>)} />
                                </div>
                                {form.watch(`fields.${index}.type`) === 'dropdown' && (
                                    <FormField control={form.control} name={`fields.${index}.options`} render={({ field: formField }) => (<FormItem> <FormLabel>{t('optionsLabel')}</FormLabel> <FormControl><Input {...formField} placeholder={t('optionsPlaceholder')} /></FormControl> <FormMessage /> </FormItem>)} />
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => append({ label: '', type: 'text', required: false, placeholder: '', options: '' })}>
                            <PlusCircle className="me-2 h-4 w-4" />
                            {t('addFieldBtn')}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('approvalWorkflowTitle')}</CardTitle>
                        <CardDescription>{t('approvalWorkflowDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {workflowSteps.map((step, index) => (
                            <div key={step.id} className="p-4 border rounded-lg flex items-center gap-4 bg-muted/30">
                                <span className="text-muted-foreground font-semibold">{t('stepItemLabel', { index: index + 1 })}</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <FormField control={form.control} name={`workflow.${index}.roleName`} render={({ field: formField }) => (<FormItem> <FormLabel>{t('stepNameLabel')}</FormLabel> <FormControl><Input {...formField} /></FormControl> <FormMessage /> </FormItem>)} />
                                    <FormField control={form.control} name={`workflow.${index}.requiredRole`} render={({ field: formField }) => (<FormItem> <FormLabel>{t('approverRoleLabel')}</FormLabel> <Select onValueChange={formField.onChange} defaultValue={formField.value} dir="rtl"> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> {roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeWorkflowStep(index)} disabled={workflowSteps.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendWorkflowStep({ roleName: '', requiredRole: 'conservatorium_admin' })}>
                            <PlusCircle className="me-2 h-4 w-4" />
                            {t('addApprovalStepBtn')}
                        </Button>
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit">{t('saveTemplateBtn')}</Button>
                </div>
            </form>
        </FormProvider>
    );
}
