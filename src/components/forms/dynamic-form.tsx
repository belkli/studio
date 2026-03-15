'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '@/hooks/use-auth';
import type { FormTemplate, FormFieldDefinition, FormFieldOption } from '@/lib/types';

interface DynamicFormProps {
  template: FormTemplate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: Record<string, any>) => void;
}

function getLocalizedLabel(locale: string, value: string | { he: string; en: string; ru?: string; ar?: string }) {
  if (typeof value === 'string') return value;
  if (locale === 'he') return value.he;
  if (locale === 'ar') return value.ar || value.en;
  if (locale === 'ru') return value.ru || value.en;
  return value.en;
}

function getFieldOptions(options: FormFieldDefinition['options']): FormFieldOption[] {
  if (!options) return [];
  if (typeof options === 'string') {
    return options.split(',').map((opt) => ({ value: opt.trim(), label: opt.trim() }));
  }
  return options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evaluateShowIf(field: FormFieldDefinition, values: Record<string, any>): boolean {
  if (!field.showIf) return true;
  const targetValue = values[field.showIf.fieldId];
  switch (field.showIf.operator) {
    case 'equals':
      return targetValue === field.showIf.value;
    case 'not_equals':
      return targetValue !== field.showIf.value;
    case 'contains':
      return Array.isArray(targetValue)
        ? targetValue.includes(field.showIf.value)
        : String(targetValue ?? '').includes(String(field.showIf.value ?? ''));
    case 'not_empty':
      return Array.isArray(targetValue) ? targetValue.length > 0 : !!targetValue;
    default:
      return true;
  }
}

const generateSchema = (fields: FormTemplate['fields']) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, z.ZodType<any, any>> = {};
  fields.forEach((field) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fieldSchema: z.ZodType<any, any>;
    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'multiselect':
      case 'checkbox_group':
        fieldSchema = z.array(z.string());
        break;
      case 'separator':
      case 'heading':
      case 'info_text':
      case 'conditional_group':
        fieldSchema = z.any().optional();
        break;
      default:
        fieldSchema = z.string();
    }

    if (field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = (fieldSchema as z.ZodBoolean).refine((val) => val === true, { message: 'Required field' });
      } else if (field.type === 'multiselect' || field.type === 'checkbox_group') {
        fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, 'Required field');
      } else if (!['separator', 'heading', 'info_text', 'conditional_group'].includes(field.type)) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, 'Required field');
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.id] = fieldSchema;
  });
  return z.object(shape);
};

export function DynamicForm({ template, onSubmit }: DynamicFormProps) {
  const t = useTranslations('Forms');
  const locale = useLocale();
  const { users, conservatoriumInstruments, compositions } = useAuth();
  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});
  const formSchema = useMemo(() => generateSchema(template.fields), [template.fields]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: template.fields.reduce((acc, field) => {
      if (field.type === 'checkbox') acc[field.id] = false;
      else if (field.type === 'multiselect' || field.type === 'checkbox_group') acc[field.id] = [];
      else acc[field.id] = '';
      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const values = form.watch();

  const teacherOptions = users
    .filter((u) => u.role === 'teacher' && u.approved)
    .map((u) => ({ value: u.id, label: u.name }));

  const instrumentOptions = conservatoriumInstruments
    .filter((i) => i.isActive && i.availableForRegistration)
    .map((i) => ({ value: i.names.he, label: getLocalizedLabel(locale, i.names) }));

  const composerOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const c of compositions) {
      const id = c.composerId || c.composer;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const label =
        (locale === 'he' && c.composerNames?.he) ||
        (locale === 'ar' && c.composerNames?.ar) ||
        (locale === 'ru' && c.composerNames?.ru) ||
        c.composerNames?.en ||
        c.composer;
      opts.push({ value: id, label });
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [compositions, locale]);

  const sortedFields = [...template.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            {template.description && <CardDescription>{template.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedFields.map((field) => {
              if (!evaluateShowIf(field, values)) return null;

              if (field.type === 'separator') return <div key={field.id} className="my-2 border-t" />;
              if (field.type === 'heading') return <h3 key={field.id} className="text-lg font-semibold">{getLocalizedLabel(locale, field.label)}</h3>;
              if (field.type === 'info_text') return <p key={field.id} className="text-sm text-muted-foreground">{getLocalizedLabel(locale, field.label)}</p>;

              return (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={field.id}
                  render={({ field: formField }) => {
                    const label = getLocalizedLabel(locale, field.label);
                    const options =
                      field.type === 'teacher_select'
                        ? teacherOptions
                        : field.type === 'instrument_select'
                          ? instrumentOptions
                          : field.type === 'composer_select'
                            ? composerOptions
                            : getFieldOptions(field.options).map((opt) => ({ value: opt.value, label: getLocalizedLabel(locale, opt.label) }));

                    const renderInput = () => {
                      switch (field.type) {
                        case 'textarea':
                          return <Textarea placeholder={field.placeholder} {...formField} />;
                        case 'date':
                          return <Input type="date" dir="ltr" {...formField} />;
                        case 'number':
                          return <Input type="number" placeholder={field.placeholder} {...formField} />;
                        case 'select':
                        case 'dropdown':
                        case 'radio':
                        case 'composer_select':
                        case 'teacher_select':
                        case 'instrument_select':
                          return (
                            <Select onValueChange={formField.onChange} value={formField.value} dir={locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr'}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder={field.placeholder || t('selectPlaceholder')} /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          );
                        case 'multiselect':
                        case 'checkbox_group':
                          return (
                            <div className="space-y-2">
                              {options.map((opt) => (
                                <div key={opt.value} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={(formField.value || []).includes(opt.value)}
                                    onCheckedChange={(checked) => {
                                      const prev = formField.value || [];
                                      formField.onChange(checked ? [...prev, opt.value] : prev.filter((v: string) => v !== opt.value));
                                    }}
                                  />
                                  <span className="text-sm">{opt.label}</span>
                                </div>
                              ))}
                            </div>
                          );
                        case 'checkbox':
                          return (
                            <div className="flex items-center gap-2 pt-2">
                              <Checkbox checked={!!formField.value} onCheckedChange={formField.onChange} />
                              <span className="text-sm">{label}</span>
                            </div>
                          );
                        case 'signature':
                          return (
                            <div className="space-y-2">
                              <div className="rounded-md border bg-white p-2">
                                <SignatureCanvas
                                  ref={(ref) => { signatureRefs.current[field.id] = ref; }}
                                  canvasProps={{ className: 'h-28 w-full rounded border' }}
                                  onEnd={() => {
                                    const sig = signatureRefs.current[field.id];
                                    if (sig && !sig.isEmpty()) {
                                      formField.onChange(sig.getTrimmedCanvas().toDataURL('image/png'));
                                    }
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  signatureRefs.current[field.id]?.clear();
                                  formField.onChange('');
                                }}
                              >
                                {t('clearSignature')}
                              </Button>
                            </div>
                          );
                        case 'file_upload':
                          return <Input type="file" onChange={(e) => formField.onChange(e.target.files?.[0]?.name || '')} />;
                        default:
                          return <Input placeholder={field.placeholder} {...formField} />;
                      }
                    };

                    if (field.type === 'checkbox') {
                      return <FormItem><FormControl>{renderInput()}</FormControl><FormMessage /></FormItem>;
                    }

                    return (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>{renderInput()}</FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              );
            })}
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <Send className="me-2 h-4 w-4" />
              {t('submitForApproval')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
