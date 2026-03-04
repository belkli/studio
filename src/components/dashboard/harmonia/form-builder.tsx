'use client';

import { useMemo } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { FormTemplate, FormFieldDefinition, UserRole } from '@/lib/types';
import { DynamicForm } from '@/components/forms/dynamic-form';

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'multiselect',
  'checkbox',
  'checkbox_group',
  'radio',
  'file_upload',
  'signature',
  'composer_select',
  'teacher_select',
  'instrument_select',
  'separator',
  'heading',
  'info_text',
  'conditional_group',
] as const;

const getFieldSchema = (t: any) => z.object({
  id: z.string().min(1),
  label: z.string().min(1, t('labelRequired')),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.string().optional(),
  showIfFieldId: z.string().optional(),
  showIfOperator: z.enum(['equals', 'not_equals', 'contains', 'not_empty']).optional(),
  showIfValue: z.string().optional(),
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

const RECITAL_FORM_TEMPLATE: FormFieldDefinition[] = [
  { id: 'student_details', type: 'heading', label: { he: 'פרטי התלמיד/ה', en: 'Student Details' }, required: false, order: 1 },
  { id: 'student_name', type: 'text', label: { he: 'שם מלא', en: 'Full Name' }, required: true, order: 2 },
  { id: 'grade', type: 'select', label: { he: 'כיתה', en: 'Grade' }, required: true, order: 3, options: [{ value: '1', label: { he: 'א\'', en: '1st' } }, { value: '2', label: { he: 'ב\'', en: '2nd' } }] },
  { id: 'is_music_major', type: 'checkbox', label: { he: 'משתתף/ת במגמה', en: 'Music Major' }, required: false, order: 4 },
  { id: 'instrument_section', type: 'heading', label: { he: 'פרטי כלי הנגינה', en: 'Instrument Details' }, required: false, order: 10 },
  { id: 'instrument', type: 'instrument_select', label: { he: 'כלי נגינה', en: 'Instrument' }, required: true, order: 11 },
  { id: 'teacher', type: 'teacher_select', label: { he: 'שם המורה', en: 'Teacher' }, required: true, order: 12 },
  { id: 'years_with_teacher', type: 'number', label: { he: 'שנות לימוד עם המורה', en: 'Years with Teacher' }, required: true, order: 13, validation: { min: 0, max: 30 } },
  { id: 'repertoire_section', type: 'heading', label: { he: 'רפרטואר', en: 'Repertoire' }, required: false, order: 20 },
  { id: 'repertoire_items', type: 'multiselect', label: { he: 'יצירות', en: 'Pieces' }, required: true, order: 21 },
  { id: 'signature', type: 'signature', label: { he: 'חתימה', en: 'Signature' }, required: true, order: 30 },
];

export function FormBuilder() {
  const { addFormTemplate } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations('FormBuilder');
  const locale = useLocale();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  const formSchema = getFormBuilderSchema(t);

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'teacher', label: t('roleTeacher') },
    { value: 'conservatorium_admin', label: t('roleAdmin') },
    { value: 'site_admin', label: t('roleSiteAdmin') },
  ];

  const form = useForm<FormBuilderData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      fields: [{ id: 'field_1', label: '', type: 'text', required: false, placeholder: '', options: '', showIfFieldId: '', showIfOperator: 'equals', showIfValue: '' }],
      workflow: [{ roleName: t('defaultTeacherApproval'), requiredRole: 'teacher' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'fields' });
  const { fields: workflowSteps, append: appendWorkflowStep, remove: removeWorkflowStep } = useFieldArray({ control: form.control, name: 'workflow' });

  const previewTemplate: FormTemplate = useMemo(() => ({
    id: 'preview-template',
    conservatoriumId: 'preview',
    title: form.watch('title') || t('previewTitle'),
    description: form.watch('description') || '',
    createdAt: new Date().toISOString(),
    fields: form.watch('fields').map((f, index) => ({
      id: f.id || `field_${index + 1}`,
      label: f.label || `Field ${index + 1}`,
      type: f.type,
      required: f.required,
      order: index + 1,
      placeholder: f.placeholder,
      options: f.options,
      showIf: f.showIfFieldId
        ? { fieldId: f.showIfFieldId, operator: f.showIfOperator || 'equals', value: f.showIfValue }
        : undefined,
    })),
    workflow: [],
  }), [form, t]);

  const onSubmit = (data: FormBuilderData) => {
    addFormTemplate({
      title: data.title,
      description: data.description,
      fields: data.fields.map((f, i) => ({
        id: f.id,
        label: { he: f.label, en: f.label },
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        options: f.options,
        order: i + 1,
        showIf: f.showIfFieldId
          ? { fieldId: f.showIfFieldId, operator: f.showIfOperator || 'equals', value: f.showIfValue }
          : undefined,
      })),
      workflow: data.workflow.map((w, i) => ({ ...w, id: `wf-${Date.now()}-${i}`, stepIndex: i })),
    } as Partial<FormTemplate>);

    toast({ title: t('templateSavedTitle'), description: t('templateSavedDesc', { title: data.title }) });
    router.push('/dashboard/forms/new');
  };

  const loadRecitalTemplate = () => {
    replace(RECITAL_FORM_TEMPLATE.map((field) => ({
      id: field.id,
      label: typeof field.label === 'string' ? field.label : field.label.he,
      type: field.type as FormBuilderData['fields'][number]['type'],
      required: field.required,
      placeholder: field.placeholder || '',
      options: Array.isArray(field.options) ? field.options.map((opt) => opt.value).join(',') : (typeof field.options === 'string' ? field.options : ''),
      showIfFieldId: field.showIf?.fieldId || '',
      showIfOperator: field.showIf?.operator || 'equals',
      showIfValue: String(field.showIf?.value || ''),
    })));
    form.setValue('title', t('recitalTemplateTitle'));
    form.setValue('description', t('recitalTemplateDesc'));
  };

  return (
    <div className="space-y-6" dir={dir}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('formDetailsTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={loadRecitalTemplate}>{t('loadRecitalTemplate')}</Button>
              </div>
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>{t('formTitleLabel')}</FormLabel><FormControl><Input placeholder={t('formTitlePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>{t('descriptionLabel')}</FormLabel><FormControl><Input placeholder={t('descriptionPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('formFieldsTitle')}</CardTitle>
              <CardDescription>{t('formFieldsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="pt-2 font-semibold">{t('fieldItemLabel', { index: index + 1 })}</h4>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={form.control} name={`fields.${index}.id`} render={({ field: f }) => (<FormItem><FormLabel>{t('fieldId')}</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`fields.${index}.label`} render={({ field: f }) => (<FormItem><FormLabel>{t('fieldLabel')}</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`fields.${index}.type`} render={({ field: f }) => (
                      <FormItem><FormLabel>{t('fieldType')}</FormLabel><Select onValueChange={f.onChange} value={f.value} dir={dir}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{FIELD_TYPES.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={form.control} name={`fields.${index}.placeholder`} render={({ field: f }) => (<FormItem><FormLabel>{t('placeholder')}</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`fields.${index}.options`} render={({ field: f }) => (<FormItem><FormLabel>{t('optionsLabel')}</FormLabel><FormControl><Input {...f} placeholder={t('optionsPlaceholder')} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`fields.${index}.required`} render={({ field: f }) => (<FormItem className="flex items-end gap-2 pb-2"><FormControl><Checkbox checked={f.value} onCheckedChange={f.onChange} /></FormControl><FormLabel>{t('requiredField')}</FormLabel></FormItem>)} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={form.control} name={`fields.${index}.showIfFieldId`} render={({ field: f }) => (<FormItem><FormLabel>{t('showIfField')}</FormLabel><FormControl><Input {...f} placeholder={t('optional')} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`fields.${index}.showIfOperator`} render={({ field: f }) => (
                      <FormItem><FormLabel>{t('showIfOperator')}</FormLabel><Select onValueChange={f.onChange} value={f.value} dir={dir}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="equals">equals</SelectItem><SelectItem value="not_equals">not_equals</SelectItem><SelectItem value="contains">contains</SelectItem><SelectItem value="not_empty">not_empty</SelectItem></SelectContent></Select></FormItem>
                    )} />
                    <FormField control={form.control} name={`fields.${index}.showIfValue`} render={({ field: f }) => (<FormItem><FormLabel>{t('showIfValue')}</FormLabel><FormControl><Input {...f} placeholder={t('optional')} /></FormControl></FormItem>)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ id: `field_${fields.length + 1}`, label: '', type: 'text', required: false, placeholder: '', options: '', showIfFieldId: '', showIfOperator: 'equals', showIfValue: '' })}>
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
                <div key={step.id} className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                  <span className="font-semibold text-muted-foreground">{t('stepItemLabel', { index: index + 1 })}</span>
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name={`workflow.${index}.roleName`} render={({ field: f }) => (<FormItem><FormLabel>{t('stepNameLabel')}</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`workflow.${index}.requiredRole`} render={({ field: f }) => (<FormItem><FormLabel>{t('approverRoleLabel')}</FormLabel><Select onValueChange={f.onChange} value={f.value} dir={dir}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{roleOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeWorkflowStep(index)} disabled={workflowSteps.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      <Card>
        <CardHeader>
          <CardTitle>{t('previewTitle')}</CardTitle>
          <CardDescription>{t('previewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm template={previewTemplate} onSubmit={() => undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
