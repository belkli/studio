'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { ExamPrepTracker } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Award, Calendar, ChevronDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { useTranslations } from 'next-intl';

const REPERTOIRE_TEMPLATES = {
    'MINISTRY_LEVEL_1': [
        { category: 'SCALES', description: '2 סולמות מז\'ור ומינור (עד 2 פמול/דיאז)' },
        { category: 'PIECES', description: 'יצירה תקופת הבארוק (למשל: באך אנה מגדלנה)' },
        { category: 'PIECES', description: 'פרק סונטינה ראשון' },
        { category: 'SIGHT_READING', description: 'קריאה מהדף ברמת מתחילים' }
    ],
    'MINISTRY_LEVEL_2': [
        { category: 'SCALES', description: 'סולמות מז\'ור ומינור (עד 4 פמול/דיאז)' },
        { category: 'PIECES', description: 'פרלוד ופוגה / המצאה ב-2 קולות' },
        { category: 'PIECES', description: 'פרק סונטה שלמה' },
        { category: 'PIECES', description: 'יצירה מתקופה רומנטית / מודרנית' },
        { category: 'SIGHT_READING', description: 'קריאה מהדף מתקדמת' }
    ],
    'BAGRUT': [
        { category: 'PIECES', description: 'רסיטל בגרות 5 יח"ל - תוכנית מלאה (45 דקות)' },
        { category: 'THEORY', description: 'ניתוח תיאורטי של התוכנית ליחידה הראשונה' }
    ],
    'OTHER': [
        { category: 'PIECES', description: 'דרישה אישית להתאמה' },
    ]
};

const MOCK_TRACKERS: ExamPrepTracker[] = [
    {
        id: 'exam-1',
        conservatoriumId: 'c-1',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        instrument: 'Piano',
        examType: 'MINISTRY_LEVEL_1',
        targetExamDate: '2026-06-15T09:00:00Z',
        overallReadinessPercent: 40,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedPieces: [],
        requirements: [
            { category: 'SCALES', description: '2 סולמות מז\'ור ומינור', status: 'READY' },
            { category: 'PIECES', description: 'יצירה תקופת הבארוק (באך אינוונציה 1)', status: 'IN_PROGRESS', teacherAssessment: 'צריך לעבוד על הדינמיקה ביד שמאל' },
            { category: 'PIECES', description: 'פרק סונטינה קלמנטי', status: 'NOT_STARTED' },
            { category: 'SIGHT_READING', description: 'קריאה מהדף קלה', status: 'READY' }
        ]
    }
];

export function ExamTrackerPanel() {
    const { user, users } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('ExamTracker');
    const dateLocale = useDateLocale();

    // For a real app, trackersState would come from context/context state.
    const [trackers, setTrackers] = useState<ExamPrepTracker[]>(MOCK_TRACKERS);

    // Students of this teacher
    const myStudents = useMemo(() => {
        return users.filter(u => u.role === 'student'); // simplistic map for demo
    }, [users]);

    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedExamType, setSelectedExamType] = useState('MINISTRY_LEVEL_1');
    const [instrument, setInstrument] = useState('Piano');

    const [showNewForm, setShowNewForm] = useState(false);

    const handleCreateTracker = () => {
        if (!selectedStudent || !user) return;

        const template = REPERTOIRE_TEMPLATES[selectedExamType as keyof typeof REPERTOIRE_TEMPLATES] || REPERTOIRE_TEMPLATES['OTHER'];

        const newTracker: ExamPrepTracker = {
            id: `exam-${Date.now()}`,
            conservatoriumId: 'c-1',
            studentId: selectedStudent,
            teacherId: user.id || 'teacher-1',
            instrument,
            examType: selectedExamType as any,
            targetExamDate: '2026-06-30T09:00:00Z',
            overallReadinessPercent: 0,
            assignedPieces: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            requirements: template.map(t => ({
                category: t.category as any,
                description: t.description,
                status: 'NOT_STARTED'
            }))
        };

        setTrackers(prev => [...prev, newTracker]);
        setShowNewForm(false);
        toast({ title: t('trackerCreated') });
    };

    const updateRequirementStatus = (trackerId: string, reqIndex: number, newStatus: string) => {
        setTrackers(prev => prev.map(t => {
            if (t.id === trackerId) {
                const updatedReqs = [...t.requirements];
                updatedReqs[reqIndex].status = newStatus as any;

                // Auto-calc readiness based on req statuses
                const readyCount = updatedReqs.filter(r => r.status === 'READY' || r.status === 'EXAM_PASSED').length;
                const percent = Math.round((readyCount / updatedReqs.length) * 100);

                return {
                    ...t,
                    requirements: updatedReqs,
                    overallReadinessPercent: percent,
                    updatedAt: new Date().toISOString()
                };
            }
            return t;
        }));
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'NOT_STARTED': return <Badge variant="outline" className="text-gray-500 bg-gray-50"><Clock className="w-3 h-3 mr-1" /> {t('statusNotStarted')}</Badge>;
            case 'IN_PROGRESS': return <Badge variant="secondary" className="text-blue-700 bg-blue-100"><Clock className="w-3 h-3 mr-1" /> {t('statusInProgress')}</Badge>;
            case 'READY': return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> {t('statusReady')}</Badge>;
            case 'EXAM_PASSED': return <Badge variant="default" className="bg-purple-600"><Award className="w-3 h-3 mr-1" /> {t('statusPassed')}</Badge>;
            default: return null;
        }
    };

    const getTrackerStudentName = (t: ExamPrepTracker) => {
        const student = users.find(u => u.id === t.studentId);
        return student?.name || 'תלמיד/ה (' + t.studentId + ')';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={() => setShowNewForm(!showNewForm)}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {showNewForm ? t('cancelCreation') : t('createNewTracker')}
                </Button>
            </div>

            {showNewForm && (
                <Card className="border-t-4 border-t-primary shadow-sm bg-muted/20">
                    <CardHeader>
                        <CardTitle>{t('createTrackerTitle')}</CardTitle>
                        <CardDescription>{t('createTrackerDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>{t('selectStudent')}</Label>
                            <Select dir="rtl" value={selectedStudent} onValueChange={setSelectedStudent}>
                                <SelectTrigger><SelectValue placeholder={t('selectStudentPlaceholder')} /></SelectTrigger>
                                <SelectContent>
                                    {myStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('instrumentLabel')}</Label>
                            <Input value={instrument} onChange={e => setInstrument(e.target.value)} placeholder={t('instrumentPlaceholder')} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('examTypeLabel')}</Label>
                            <Select dir="rtl" value={selectedExamType} onValueChange={setSelectedExamType}>
                                <SelectTrigger><SelectValue placeholder={t('examTypePlaceholder')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MINISTRY_LEVEL_1">{t('ministryLevel1')}</SelectItem>
                                    <SelectItem value="MINISTRY_LEVEL_2">{t('ministryLevel2')}</SelectItem>
                                    <SelectItem value="BAGRUT">{t('bagrut')}</SelectItem>
                                    <SelectItem value="OTHER">{t('customExam')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreateTracker} disabled={!selectedStudent}>{t('createPlanBtn')}</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                {trackers.map(tracker => (
                    <Card key={tracker.id} className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {getTrackerStudentName(tracker)}
                                        <Badge variant="outline">{tracker.instrument}</Badge>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none">
                                            {tracker.examType.replace(/_/g, ' ')}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('estimatedTargetDate')} {tracker.targetExamDate ? format(new Date(tracker.targetExamDate), 'PP', { locale: dateLocale }) : t('notSet')}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm text-muted-foreground mr-1">{t('examReadiness')}</span>
                                    <Badge variant="outline" className={`px-3 py-1 text-sm ${tracker.overallReadinessPercent >= 80 ? 'bg-green-100 text-green-800 border-green-300' :
                                        tracker.overallReadinessPercent >= 40 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                            'bg-red-100 text-red-800 border-red-300'
                                        }`}>
                                        {tracker.overallReadinessPercent}{t('percentReady')}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('colCategory')}</TableHead>
                                        <TableHead className="w-1/2">{t('colPieceTaskDetails')}</TableHead>
                                        <TableHead>{t('colMasteryStatus')}</TableHead>
                                        <TableHead>{t('colTeacherNotes')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tracker.requirements.map((req, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Badge variant="outline">{req.category === 'PIECES' ? t('categoryPiece') : req.category === 'SCALES' ? t('categoryScales') : req.category === 'THEORY' ? t('categoryTheory') : t('categorySightReading')}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{req.description}</TableCell>
                                            <TableCell>
                                                <Select dir="rtl" value={req.status} onValueChange={(val) => updateRequirementStatus(tracker.id!, idx, val)}>
                                                    <SelectTrigger className="border-0 bg-transparent h-8 w-fit space-x-2">
                                                        {renderStatusBadge(req.status)}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NOT_STARTED">{t('valNotStarted')}</SelectItem>
                                                        <SelectItem value="IN_PROGRESS">{t('valInProgress')}</SelectItem>
                                                        <SelectItem value="READY">{t('valReady')}</SelectItem>
                                                        <SelectItem value="EXAM_PASSED">{t('valPassed')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{req.teacherAssessment || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

                {trackers.length === 0 && !showNewForm && (
                    <div className="text-center p-12 bg-muted/10 border rounded-xl border-dashed">
                        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">{t('noActiveTrackersTitle')}</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">{t('noActiveTrackersDesc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
