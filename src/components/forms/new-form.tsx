'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, FormSubmission } from '@/lib/types';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RecitalForm } from './recital-form';
import { KenesForm } from './kenes-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const formTypeSchema = z.object({
  formType: z.enum(['recital', 'kenes'], { required_error: 'חובה לבחור סוג טופס'}),
  studentId: z.string().optional(),
});

type FormTypeData = z.infer<typeof formTypeSchema>;

export function NewForm() {
  const { toast } = useToast();
  const { user, users, mockFormSubmissions, updateForm } = useAuth();
  const router = useRouter();

  const [studentList, setStudentList] = useState<User[]>([]);
  
  const formTypeForm = useForm<FormTypeData>({
    resolver: zodResolver(formTypeSchema),
  });

  const onFormSubmit = useCallback((formType: 'recital' | 'kenes') => (data: any) => {
    const newSubmission: FormSubmission = {
      id: `form-${Date.now()}`,
      status: user?.role === 'student' ? 'ממתין לאישור מורה' : 'ממתין לאישור מנהל',
      studentId: formType === 'recital' ? data.studentId : user!.id,
      studentName: formType === 'recital' ? users.find(u => u.id === data.studentId)?.name ?? '' : user!.name,
      submissionDate: new Date().toLocaleDateString('he-IL'),
      ...data,
    };

    // This is a mock implementation. In a real app, you'd likely have a single `addForm` function.
    updateForm(newSubmission);

    toast({
        title: `טופס ${formType === 'recital' ? 'רסיטל' : 'כנס'} הוגש בהצלחה!`,
        description: `הטופס נשלח לאישור.`,
    });
    router.push('/dashboard/forms');
  }, [toast, router, user, users, updateForm]);

  // Effect to set initial values once user is loaded
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

  // Effect to set student list based on user role
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
    return <p>טוען נתונים...</p>
  }

  const canSelectStudent = user.role !== 'student';
  const canSelectFormType = user.role !== 'student';
  
  const renderForm = () => {
    if (!selectedFormType) {
        return null;
    }

    switch(selectedFormType) {
        case 'recital':
            if (!selectedStudent) {
                return <p className="text-center text-muted-foreground pt-4">אנא בחר תלמיד/ה כדי להמשיך.</p>;
            }
            return <RecitalForm key={selectedStudent.id} user={user} student={selectedStudent} onSubmit={onFormSubmit('recital')} />;
        case 'kenes':
            return <KenesForm user={user} onSubmit={onFormSubmit('kenes')} />;
        default:
            return null;
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...formTypeForm}>
        <form>
          <Card>
            <CardHeader>
              <CardTitle>בחירת טופס</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
               {canSelectFormType && (
                 <FormField
                    control={formTypeForm.control}
                    name="formType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סוג טופס</FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר את סוג הטופס..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="recital">רסיטל בגרות</SelectItem>
                            <SelectItem value="kenes">כנס / אירוע</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               )}
              
              {canSelectStudent && selectedFormType === 'recital' && (
                 <FormField
                    control={formTypeForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>בחר תלמיד/ה</FormLabel>
                        <Select dir="rtl" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר תלמיד/ה להגשת טופס" />
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
