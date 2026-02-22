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

const fieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.string().optional(), // For dropdowns
});

const workflowStepSchema = z.object({
  roleName: z.string().min(1, "Step name is required"),
  requiredRole: z.enum(['teacher', 'conservatorium_admin', 'site_admin']),
});

const formBuilderSchema = z.object({
  title: z.string().min(3, "Title must have at least 3 characters."),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1, "At least one field is required."),
  workflow: z.array(workflowStepSchema).min(1, "At least one approval step is required."),
});

type FormBuilderData = z.infer<typeof formBuilderSchema>;

const fieldTypeOptions = [
    { value: 'text', label: 'שדה טקסט' },
    { value: 'textarea', label: 'תיבת טקסט' },
    { value: 'number', label: 'מספר' },
    { value: 'date', label: 'תאריך' },
    { value: 'dropdown', label: 'רשימה נפתחת' },
    { value: 'checkbox', label: 'תיבת סימון' },
];

const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'teacher', label: 'מורה' },
    { value: 'conservatorium_admin', label: 'מנהל/ת קונסרבטוריון' },
];

export function FormBuilder() {
    const { addFormTemplate } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const form = useForm<FormBuilderData>({
        resolver: zodResolver(formBuilderSchema),
        defaultValues: {
            title: '',
            description: '',
            fields: [{ label: '', type: 'text', required: false, placeholder: '', options: '' }],
            workflow: [{ roleName: 'אישור מורה', requiredRole: 'teacher' }],
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
            title: "תבנית טופס נשמרה!",
            description: `התבנית "${data.title}" זמינה כעת ליצירה.`,
        });
        router.push('/dashboard/forms/new');
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>פרטי טופס</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>כותרת הטופס</FormLabel> <FormControl><Input placeholder="לדוגמה: בקשה להשאלת כלי נגינה" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                         <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>תיאור (אופציונלי)</FormLabel> <FormControl><Textarea placeholder="הסבר קצר על מטרת הטופס." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>שדות הטופס</CardTitle>
                        <CardDescription>הוסף ונהל את השדות שיופיעו בטופס.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold pt-2">שדה #{index + 1}</h4>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => ( <FormItem> <FormLabel>תווית</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                     <FormField control={form.control} name={`fields.${index}.type`} render={({ field }) => ( <FormItem> <FormLabel>סוג שדה</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> {fieldTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                                     <FormField control={form.control} name={`fields.${index}.required`} render={({ field }) => ( <FormItem className="flex flex-row items-end space-x-3 space-x-reverse pb-2"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl> <FormLabel>שדה חובה</FormLabel> </FormItem> )} />
                                </div>
                                {form.watch(`fields.${index}.type`) === 'dropdown' && (
                                     <FormField control={form.control} name={`fields.${index}.options`} render={({ field }) => ( <FormItem> <FormLabel>אפשרויות (מופרד בפסיק)</FormLabel> <FormControl><Input {...field} placeholder="לדוגמה: אפשרות 1, אפשרות 2, אפשרות 3" /></FormControl> <FormMessage /> </FormItem> )} />
                                )}
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => append({ label: '', type: 'text', required: false, placeholder: '', options: '' })}>
                            <PlusCircle className="me-2 h-4 w-4" />
                            הוסף שדה
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>תהליך אישורים</CardTitle>
                         <CardDescription>הגדר את שלבי האישור הנדרשים עבור טופס זה.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {workflowSteps.map((step, index) => (
                             <div key={step.id} className="p-4 border rounded-lg flex items-center gap-4 bg-muted/30">
                                <span className="text-muted-foreground font-semibold">שלב {index + 1}:</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <FormField control={form.control} name={`workflow.${index}.roleName`} render={({ field }) => ( <FormItem> <FormLabel>שם השלב</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                                    <FormField control={form.control} name={`workflow.${index}.requiredRole`} render={({ field }) => ( <FormItem> <FormLabel>תפקיד מאשר</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl"> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> {roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeWorkflowStep(index)} disabled={workflowSteps.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendWorkflowStep({ roleName: '', requiredRole: 'conservatorium_admin' })}>
                             <PlusCircle className="me-2 h-4 w-4" />
                            הוסף שלב אישור
                        </Button>
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit">שמור תבנית טופס</Button>
                </div>
            </form>
        </FormProvider>
    );
}
