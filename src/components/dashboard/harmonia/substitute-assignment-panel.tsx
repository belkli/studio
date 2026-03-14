'use client';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonSlot, User, DayOfWeek } from '@/lib/types';
import { format, getDay, isFuture } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { UserCog } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { userHasInstrument } from '@/lib/instrument-matching';
import { tenantUsers } from '@/lib/tenant-filter';

interface AffectedLesson extends LessonSlot {
    originalTeacher?: User;
    student?: User;
    availableSubstitutes: User[];
}

export function SubstituteAssignmentPanel() {
    const { user, users, lessons, assignSubstitute, conservatoriumInstruments } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('SubstituteAssignmentPanel');
    const dateLocale = useDateLocale();
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const lessonsNeedingSub = useMemo((): AffectedLesson[] => {
        const teachers = user ? tenantUsers(users, user, 'teacher') : [];

        const affected = lessons
            .filter(lesson => lesson.status === 'CANCELLED_TEACHER' && isFuture(new Date(lesson.startTime)))
            .map(lesson => {
                const lessonDate = new Date(lesson.startTime);
                const lessonDayIndex = getDay(lessonDate);
                const lessonDayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][lessonDayIndex] as DayOfWeek;
                const lessonHour = lessonDate.getHours();

                const availableSubstitutes = teachers.filter(teacher => {
                    if (teacher.id === lesson.teacherId) return false;

                    const teachesInstrument = userHasInstrument((teacher.instruments || []).map((i) => i.instrument), lesson.instrument, conservatoriumInstruments, teacher.conservatoriumId);
                    if (!teachesInstrument) return false;

                    const dayAvailability = teacher.availability?.find(a => a.dayOfWeek === lessonDayOfWeek);
                    if (!dayAvailability) return false;

                    const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
                    const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
                    if (lessonHour < startHour || lessonHour >= endHour) return false;

                    const isBooked = lessons.some(l =>
                        l.teacherId === teacher.id &&
                        new Date(l.startTime).getTime() === lessonDate.getTime() &&
                        l.status === 'SCHEDULED'
                    );
                    if (isBooked) return false;

                    return true;
                });

                return {
                    ...lesson,
                    originalTeacher: users.find(u => u.id === lesson.teacherId),
                    student: users.find(u => u.id === lesson.studentId),
                    availableSubstitutes,
                };
            });

        return affected.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    }, [lessons, users, conservatoriumInstruments, user]);

    const handleAssignSubstitute = (lessonId: string, newTeacherId: string) => {
        const lesson = lessonsNeedingSub.find(l => l.id === lessonId);
        const student = lesson?.student;
        const newTeacher = users.find(u => u.id === newTeacherId);

        if (!lesson || !student || !newTeacher) {
            toast({ variant: 'destructive', title: t('errors.assignmentError') });
            return;
        }

        assignSubstitute(lessonId, newTeacherId);

        toast({
            title: t('successToast.title'),
            description: t('successToast.description', { teacherName: newTeacher.name, studentName: student.name }),
        });
    }

    return (
        <Card dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                    {lessonsNeedingSub.length > 0
                        ? t('descriptionWithCount', { count: lessonsNeedingSub.length })
                        : t('descriptionEmpty')
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table dir={isRtl ? 'rtl' : 'ltr'}>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-start">{t('table.date')}</TableHead>
                            <TableHead className="text-start">{t('table.student')}</TableHead>
                            <TableHead className="text-start">{t('table.instrument')}</TableHead>
                            <TableHead className="text-start">{t('table.originalTeacher')}</TableHead>
                            <TableHead className="w-[300px] text-start">{t('table.assignSubstitute')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lessonsNeedingSub.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="p-0">
                                    <EmptyState
                                        icon={UserCog}
                                        title={t('emptyState.title')}
                                        description={t('emptyState.description')}
                                        className="py-12"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            lessonsNeedingSub.map(lesson => (
                                <TableRow key={lesson.id}>
                                    <TableCell>{format(new Date(lesson.startTime), "EEEE, dd/MM, HH:mm", { locale: dateLocale })}</TableCell>
                                    <TableCell>{lesson.student?.name}</TableCell>
                                    <TableCell>{lesson.instrument}</TableCell>
                                    <TableCell>{lesson.originalTeacher?.name}</TableCell>
                                    <TableCell>
                                        {lesson.availableSubstitutes.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <Select dir={isRtl ? 'rtl' : 'ltr'} onValueChange={(teacherId) => handleAssignSubstitute(lesson.id, teacherId)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('selectPlaceholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {lesson.availableSubstitutes.map(sub => (
                                                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">{t('noAvailableTeachers')}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
