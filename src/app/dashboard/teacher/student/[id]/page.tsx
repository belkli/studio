'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Music, Pencil, Activity } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { User, PracticeLog, AssignedRepertoire, RepertoireStatus, LessonNote } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function TeacherStudentProfilePage() {
    const params = useParams();
    const studentId = params.id as string;
    const { user: teacher, users, mockPracticeLogs, mockAssignedRepertoire, compositions, mockLessonNotes, updateRepertoireStatus, addLessonNote } = useAuth();
    const router = useRouter();

    const student = useMemo(() => users.find(u => u.id === studentId), [users, studentId]);

    if (!student) {
        notFound();
    }
    
    if (!teacher || teacher.role !== 'teacher' || !teacher.students?.includes(studentId)) {
        router.push('/dashboard');
        return null;
    }

    const studentLogs = mockPracticeLogs.filter(log => log.studentId === studentId);
    const studentRepertoire = mockAssignedRepertoire.filter(rep => rep.studentId === studentId);
    const studentNotes = mockLessonNotes.filter(note => note.studentId === studentId);

    const [newNote, setNewNote] = useState('');

    const weeklyPracticeData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return {
                date: d.toISOString().split('T')[0],
                name: d.toLocaleDateString('he-IL', { weekday: 'short' }),
                minutes: 0,
            };
        }).reverse();

        studentLogs.forEach(log => {
            const logDate = log.date.split('T')[0];
            const dayData = last7Days.find(d => d.date === logDate);
            if (dayData) {
                dayData.minutes += log.durationMinutes;
            }
        });
        return last7Days;
    }, [studentLogs]);

    const handleAddNote = () => {
        if(newNote.trim() === '') return;
        addLessonNote({
            studentId: student.id,
            teacherId: teacher.id,
            summary: newNote,
        });
        setNewNote('');
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/teacher">
                        <ArrowLeft className="ms-2 h-4 w-4" />
                        חזרה לתלמידים
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{student.name}</CardTitle>
                        <CardDescription>{student.instruments?.map(i => i.instrument).join(', ')} • כיתה {student.grade}</CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Music /> רפרטואר</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>יצירה</TableHead>
                                    <TableHead>סטטוס</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentRepertoire.map(rep => {
                                    const composition = compositions.find(c => c.id === rep.compositionId);
                                    return (
                                        <TableRow key={rep.id}>
                                            <TableCell>
                                                <p className="font-medium">{composition?.title}</p>
                                                <p className="text-xs text-muted-foreground">{composition?.composer}</p>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                 <Select 
                                                    value={rep.status} 
                                                    onValueChange={(newStatus: RepertoireStatus) => updateRepertoireStatus(rep.id, newStatus)}
                                                    dir="rtl"
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="LEARNING">למידה</SelectItem>
                                                        <SelectItem value="POLISHING">ליטוש</SelectItem>
                                                        <SelectItem value="PERFORMANCE_READY">מוכן להופעה</SelectItem>
                                                        <SelectItem value="COMPLETED">הושלם</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity /> פעילות אימונים (7 ימים אחרונים)</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyPracticeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ד'`}/>
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: 'rtl' }}
                                    formatter={(value: number) => [`${value} דקות`, 'זמן אימון']}
                                />
                                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Pencil /> הערות שיעור</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {studentNotes.map(note => (
                            <div key={note.id} className="border-b pb-2">
                                <p className="text-sm">{note.summary}</p>
                                <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString('he-IL')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Textarea placeholder="כתוב הערה חדשה..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                        <Button onClick={handleAddNote}>הוסף</Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
