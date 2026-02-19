'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Send } from 'lucide-react';
import type { FormTemplate } from '@/lib/types';

interface DynamicFormProps {
  template: FormTemplate;
  onSubmit: (data: Record<string, any>) => void;
}

const generateSchema = (fields: FormTemplate['fields']) => {
  const shape: Record<string, z.ZodType<any, any>> = {};
  fields.forEach(field => {
    let fieldSchema: z.ZodType<any, any>;
    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        break;
      case 'date':
        fieldSchema = z.string();
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.string();
    }
    if (field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = (fieldSchema as z.ZodBoolean).refine(val => val === true, {
          message: 'שדה זה הוא חובה.',
        });
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, 'שדה חובה');
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }
    shape[field.id] = fieldSchema;
  });
  return z.object(shape);
};


export function DynamicForm({ template, onSubmit }: DynamicFormProps) {
  const formSchema = useMemo(() => generateSchema(template.fields), [template.fields]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{template.title}</CardTitle>
            {template.description && <CardDescription>{template.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {template.fields.map(field => (
              <FormField
                key={field.id}
                control={form.control}
                name={field.id}
                render={({ field: formField }) => {
                  
                  const renderField = () => {
                    switch (field.type) {
                        case 'textarea':
                            return <Textarea placeholder={field.placeholder} {...formField} />;
                        case 'date':
                            return <Input type="date" {...formField} />;
                        case 'number':
                            return <Input type="number" placeholder={field.placeholder} {...formField} />;
                        case 'dropdown':
                            return (
                                <Select onValueChange={formField.onChange} defaultValue={formField.value} dir="rtl">
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder={field.placeholder || "בחר..."} /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {field.options?.split(',').map(opt => <SelectItem key={opt} value={opt.trim()}>{opt.trim()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            );
                        case 'checkbox':
                             return (
                                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                                     <Checkbox 
                                        id={field.id}
                                        checked={formField.value}
                                        onCheckedChange={formField.onChange}
                                     />
                                     <label htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                       {field.label}
                                     </label>
                                </div>
                             )
                        default: // text
                            return <Input placeholder={field.placeholder} {...formField} />;
                    }
                  };

                  if (field.type === 'checkbox') {
                    return <FormItem><FormControl>{renderField()}</FormControl><FormMessage/></FormItem>
                  }

                  return (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>{renderField()}</FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            ))}
          </CardContent>
          <CardFooter>
             <Button type="submit">
                <Send className="me-2 h-4 w-4" />
                הגש לאישור
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
