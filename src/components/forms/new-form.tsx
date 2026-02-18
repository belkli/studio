'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RecitalForm } from './recital-form';
import { KenesForm } from './kenes-form';
import { useAuth } from '@/hooks/use-auth';

const formTypeSchema = z.object({
  formType: z.enum(['recital', 'kenes'], { required_error: 'חובה לבחור סוג טופס'}),
  studentId: z.string().optional(),
});

type FormTypeData = z.infer<typeof formTypeSchema>;

export function NewForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [studentList, setStudentList] = useState<User[]>([]);
  
  const formTypeForm = useForm<FormTypeData>({
    resolver: zodResolver(formTypeSchema),
  });
  
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
    () => mockUsers.find(u => u.id === selectedStudentId),
    [selectedStudentId]
  );

  // Effect to set student list based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
          const studentsOfUser = mockUsers.filter(u => user.students?.includes(u.id));
          setStudentList(studentsOfUser);
      } else if (user.role === 'conservatorium_admin' || user.role === 'site_admin') {
          const allStudentsInConservatorium = mockUsers.filter(u => u.role === 'student' && (user.role === 'site_admin' || u.conservatoriumId === user.conservatoriumId));
          setStudentList(allStudentsInConservatorium);
      } else if (user.role === 'student') {
          setStudentList([user]);
      }
    }
  }, [user]);

  if (!user) {
    return <p>טוען נתונים...</p>
  }

  const canSelectStudent = user.role !== 'student';
  const canSelectFormType = user.role !== 'student';
  
  const onSubmitRecital = useCallback((data: any) => {
    console.log("Recital Form Data:", data);
    toast({
        title: "טופס רסיטל הוגש בהצלחה!",
        description: "הטופס נשלח לאישור המורה.",
    });
  }, [toast]);

  const onSubmitKenes = useCallback((data: any) => {
    console.log("Kenes Form Data:", data);
    toast({
        title: "טופס כנס הוגש בהצלחה!",
        description: "הטופס נשלח לאישור המנהל.",
    });
  }, [toast]);

  const renderForm = () => {
    if (!selectedFormType) {
        return null;
    }

    switch(selectedFormType) {
        case 'recital':
            if (!selectedStudent) {
                return <p className="text-center text-muted-foreground pt-4">אנא בחר תלמיד/ה כדי להמשיך.</p>;
            }
            return <RecitalForm key={selectedStudent.id} user={user} student={selectedStudent} onSubmit={onSubmitRecital} />;
        case 'kenes':
            return <KenesForm user={user} onSubmit={onSubmitKenes} />;
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
