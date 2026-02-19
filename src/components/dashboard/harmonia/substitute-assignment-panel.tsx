'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonSlot, User, DayOfWeek } from '@/lib/types';
import { format, getDay, isFuture } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AffectedLesson extends LessonSlot {
    originalTeacher?: User;
    student?: User;
    availableSubstitutes: User[];
}

export function SubstituteAssignmentPanel() {
    const { users, mockLessons, assignSubstitute } = useAuth();
    const { toast } = useToast();
    const [selectedSubstitute, setSelectedSubstitute] = useState<Record<string, string>>({});


    const lessonsNeedingSub = useMemo((): AffectedLesson[] => {
        const teachers = users.filter(u => u.role === 'teacher');
        
        const affected = mockLessons
            .filter(lesson => lesson.status === 'CANCELLED_TEACHER' && isFuture(new Date(lesson.startTime)))
            .map(lesson => {
                const lessonDate = new Date(lesson.startTime);
                const lessonDayIndex = getDay(lessonDate);
                const lessonDayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][lessonDayIndex] as DayOfWeek;
                const lessonHour = lessonDate.getHours();

                const availableSubstitutes = teachers.filter(teacher => {
                    if (teacher.id === lesson.teacherId) return false;

                    const teachesInstrument = teacher.instruments?.some(i => i.instrument === lesson.instrument);
                    if (!teachesInstrument) return false;

                    const dayAvailability = teacher.availability?.find(a => a.dayOfWeek === lessonDayOfWeek);
                    if (!dayAvailability) return false;

                    const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
                    const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
                    if (lessonHour < startHour || lessonHour >= endHour) return false;

                    const isBooked = mockLessons.some(l => 
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
        
        return affected.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    }, [mockLessons, users]);

    const handleAssignSubstitute = (lessonId: string, newTeacherId: string) => {
        const lesson = lessonsNeedingSub.find(l => l.id === lessonId);
        const student = lesson?.student;
        const newTeacher = users.find(u => u.id === newTeacherId);

        if(!lesson || !student || !newTeacher) {
            toast({ variant: 'destructive', title: 'שגיאה בשיבוץ' });
            return;
        }

        assignSubstitute(lessonId, newTeacherId);
        
        toast({
            title: 'מורה מחליף שובץ בהצלחה!',
            description: `${newTeacher.name} שובץ/ה לשיעור של ${student.name}.`,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>שיעורים הדורשים שיבוץ מחליף</CardTitle>
                <CardDescription>
                    {lessonsNeedingSub.length > 0
                        ? `נמצאו ${lessonsNeedingSub.length} שיעורים מבוטלים שניתן לשבץ להם מורה מחליף.`
                        : 'אין כרגע שיעורים מבוטלים הדורשים שיבוץ מורה מחליף.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>מועד השיעור</TableHead>
                            <TableHead>תלמיד</TableHead>
                            <TableHead>כלי</TableHead>
                            <TableHead>מורה מקורי</TableHead>
                            <TableHead className="w-[300px]">שבץ מחליף</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lessonsNeedingSub.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    כל הכבוד, אין שיעורים פתוחים!
                                </TableCell>
                            </TableRow>
                        ) : (
                            lessonsNeedingSub.map(lesson => (
                                <TableRow key={lesson.id}>
                                    <TableCell>{format(new Date(lesson.startTime), "EEEE, dd/MM, HH:mm", { locale: he })}</TableCell>
                                    <TableCell>{lesson.student?.name}</TableCell>
                                    <TableCell>{lesson.instrument}</TableCell>
                                    <TableCell>{lesson.originalTeacher?.name}</TableCell>
                                    <TableCell>
                                        {lesson.availableSubstitutes.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <Select dir="rtl" onValueChange={(teacherId) => handleAssignSubstitute(lesson.id, teacherId)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="בחר מורה מחליף..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {lesson.availableSubstitutes.map(sub => (
                                                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">אין מורים פנויים</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
