'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocale } from 'next-intl';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, FormSubmission } from '@/lib/types';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RecitalForm } from '@/components/forms/recital-form';
import { KenesForm } from '@/components/forms/kenes-form';
import { ExamRegistrationForm } from '@/components/forms/exam-registration-form';
import { DynamicForm } from '@/components/forms/dynamic-form'; // Import new component
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Update schema to accept custom form IDs
const getFormTypeSchema = (t: any) => z.object({
  formType: z.string().min(1, t('validation.required')),
  studentId: z.string().optional(),
});

type FormTypeData = {
  formType: string;
  studentId?: string;
};

export function NewForm() {
  const t = useTranslations('NewForm');
  const locale = useLocale();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  const { toast } = useToast();
  const { user, users, formSubmissions, updateForm, formTemplates } = useAuth();
  const router = useRouter();

  const [studentList, setStudentList] = useState<User[]>([]);

  const formTypeForm = useForm<FormTypeData>({
    resolver: zodResolver(getFormTypeSchema(t)),
  });

  const onFormSubmit = useCallback((data: any, template?: any) => {
    let formTitle = '';
    let submissionData: Partial<FormSubmission> = {};

    if (template) { // Handling custom form
      formTitle = template.title;
      submissionData = {
        formData: data,
        formTemplateId: template.id,
        formType: formTitle,
        repertoire: [], // Custom forms don't have standard repertoire
        totalDuration: '00:00'
      };
    } else { // Handling standard forms
      const formType = formTypeForm.getValues('formType');
      let studentIdForSubmission;
      switch (formType) {
        case 'recital':
          formTitle = t('types.recital');
          studentIdForSubmission = data.studentId;
          break;
        case 'kenes':
          formTitle = t('types.kenes');
          studentIdForSubmission = user!.id;
          break;
        case 'exam_registration':
          formTitle = t('types.exam_registration');
          studentIdForSubmission = data.studentId;
          break;
        default:
          formTitle = formType;
          studentIdForSubmission = user!.id;
      }

      const totalDurationSeconds = (data.repertoire || []).reduce((total: number, item: any) => {
        if (!item?.duration) return total;
        const [minutes, seconds] = item.duration.split(':').map(Number);
        if (isNaN(minutes) || isNaN(seconds)) return total;
        return total + (minutes * 60) + seconds;
      }, 0);
      const totalDurationFormatted = `${String(Math.floor(totalDurationSeconds / 60)).padStart(2, '0')}:${String(totalDurationSeconds % 60).padStart(2, '0')}`;

      submissionData = {
        ...data,
        studentId: studentIdForSubmission,
        formType: formTitle,
        totalDuration: totalDurationFormatted,
      };
    }

    const finalStudentId = submissionData.studentId || user!.id;

    const newSubmission = {
      id: `form-${Date.now()}`,
      status: user?.role === 'student' ? 'PENDING_TEACHER' : 'PENDING_ADMIN',
      studentId: finalStudentId,
      studentName: users.find(u => u.id === finalStudentId)?.name ?? '',
      submissionDate: new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'he-IL'),
      ...submissionData,
    } as any;

    updateForm(newSubmission);

    toast({
      title: t('successTitle', { type: formTitle }),
      description: t('successDesc'),
    });
    router.push('/dashboard/forms');
  }, [toast, router, user, users, updateForm, formTypeForm]);

  useEffect(() => {
    if (user) {
      formTypeForm.reset({
        formType: user.role === 'student' ? 'recital' : undefined,
        studentId: user.role === 'student' ? user.id : undefined,
      });
    }
  }, [user, formTypeForm]);


  const selectedFormType = formTypeForm.watch('formType');
  const selectedStudentId = formTypeForm.watch('studentId');

  const selectedStudent = useMemo(
    () => users.find(u => u.id === selectedStudentId),
    [selectedStudentId, users]
  );

  const formOptions = useMemo(() => {
    const standardForms = [
      { value: 'recital', label: t('types.recital') },
      { value: 'kenes', label: t('types.kenes') },
      { value: 'exam_registration', label: t('types.exam_registration') },
    ];
    const customForms = formTemplates.map(t => ({
      value: t.id,
      label: t.title,
    }));
    return [...standardForms, ...customForms];
  }, [formTemplates]);

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        const studentsOfUser = users.filter(u => user.students?.includes(u.id));
        setStudentList(studentsOfUser);
      } else if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
        const allStudentsInConservatorium = users.filter(u => u.role === 'student' && (user.role === 'site_admin' || u.conservatoriumId === user.conservatoriumId));
        setStudentList(allStudentsInConservatorium);
      } else if (user.role === 'student') {
        setStudentList([user]);
      }
    }
  }, [user, users]);

  if (!user) {
    return <p>{t('loading')}</p>
  }

  const canSelectStudent = user.role !== 'student';
  const canSelectFormType = true;

  const renderForm = () => {
    if (!selectedFormType) {
      return null;
    }

    // Default needs student selection
    let needsStudentSelection = true;
    if (selectedFormType === 'kenes' || formTemplates.some(t => t.id === selectedFormType)) {
      needsStudentSelection = false;
    }

    if (needsStudentSelection && !selectedStudent) {
      return <p className="text-center text-muted-foreground pt-4">{t('pleaseSelectStudent')}</p>;
    }


    switch (selectedFormType) {
      case 'recital':
        return <RecitalForm key={selectedStudent!.id} user={user} student={selectedStudent!} onSubmit={(data) => onFormSubmit(data)} />;
      case 'kenes':
        return <KenesForm user={user} onSubmit={(data) => onFormSubmit(data)} />;
      case 'exam_registration':
        return <ExamRegistrationForm key={selectedStudent!.id} user={user} student={selectedStudent!} onSubmit={(data) => onFormSubmit(data)} />;
      default:
        // This handles custom forms
        const template = formTemplates.find(t => t.id === selectedFormType);
        if (template) {
          return <DynamicForm template={template} onSubmit={(data) => onFormSubmit(data, template)} />;
        }
        return null;
    }
  }

  const needsStudentSelectionForSelected = ['recital', 'exam_registration'].includes(selectedFormType ?? '');

  return (
    <div className="space-y-8">
      <FormProvider {...formTypeForm}>
        <form>
          <Card>
            <CardHeader>
              <CardTitle>{t('selectionTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {canSelectFormType && (
                <FormField
                  control={formTypeForm.control}
                  name="formType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formType')}</FormLabel>
                      <Select dir={dir} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {canSelectStudent && needsStudentSelectionForSelected && (
                <FormField
                  control={formTypeForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('selectStudent')}</FormLabel>
                      <Select dir={dir} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectStudentPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </form>
      </FormProvider>

      {renderForm()}
    </div>
  );
}
