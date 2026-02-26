'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { LessonNote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, Music, Mic, FileText, CheckCircle2 } from 'lucide-react';

export function LmsLessonNotePanel({ lessonId, studentId }: { lessonId: string, studentId: string }) {
    const { mockLessonNotes, addLessonNote, users } = useAuth();
    const { toast } = useToast();

    const [publicSummary, setPublicSummary] = useState('');
    const [homeworkDesc, setHomeworkDesc] = useState('');
    const [homeworkPieces, setHomeworkPieces] = useState('');
    const [privateNote, setPrivateNote] = useState('');
    const [mood, setMood] = useState('PRODUCTIVE');
    const [flags, setFlags] = useState<string[]>([]);

    const student = users.find(u => u.id === studentId);

    const existingNote = mockLessonNotes.find(n => n.slotId === lessonId || n.lessonSlotId === lessonId);

    useEffect(() => {
        if (existingNote) {
            setPublicSummary(existingNote.lessonSummary || existingNote.summary || '');
            if (existingNote.homeworkAssignment) {
                setHomeworkDesc(existingNote.homeworkAssignment.description || '');
                setHomeworkPieces((existingNote.homeworkAssignment.pieces || []).join(', '));
            }
            setPrivateNote(existingNote.studioNote || '');
            setMood(existingNote.teacherMood || 'PRODUCTIVE');
            setFlags(existingNote.technicalFlags?.map(f => f.flag) || []);
        }
    }, [existingNote]);

    const handleSave = () => {
        const flagObjects = flags.map(f => ({ flag: f as any, detail: '' }));

        addLessonNote({
            slotId: lessonId,
            lessonSlotId: lessonId,
            studentId,
            lessonSummary: publicSummary,
            summary: publicSummary,
            homeworkAssignment: {
                description: homeworkDesc,
                pieces: homeworkPieces.split(',').map(p => p.trim()).filter(Boolean),
                specificFocusAreas: []
            },
            studioNote: privateNote,
            teacherMood: mood as any,
            technicalFlags: flagObjects,
            isSharedWithParent: true,
            isSharedWithStudent: true
        });

        toast({ title: 'סיכום השיעור נשמר בהצלחה.' });
    };

    const toggleFlag = (flag: string) => {
        setFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);
    };

    const technicalOptions = [
        { value: 'POSTURE', label: 'יציבה' },
        { value: 'TONE', label: 'הפקת צליל' },
        { value: 'RHYTHM', label: 'קצב' },
        { value: 'THEORY_GAP', label: 'פער תיאורטי' },
        { value: 'MOTIVATION', label: 'מוטיבציה' },
        { value: 'TECHNIQUE', label: 'טכניקה' },
    ];

    return (
        <Card className="max-w-4xl border-t-4 border-t-primary">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex justify-between items-center">
                    <span>סיכום שיעור - תלמיד/ה: {student?.name}</span>
                    <Badge variant={existingNote ? 'default' : 'secondary'}>
                        {existingNote ? 'נערך בעבר' : 'טיוטה חדשה'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Public Section */}
                    <div className="space-y-4 border-l pl-6">
                        <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                            <FileText className="w-5 h-5" />
                            <span>סיכום ומשימות ציבורי</span>
                            <span className="text-xs font-normal text-muted-foreground">(גלוי לתלמיד ולהורה)</span>
                        </div>

                        <div className="space-y-2">
                            <Label>מה למדנו היום?</Label>
                            <Textarea
                                placeholder="למשל: היום התמקדנו בסולמות ובטכניקת אצבוע..."
                                value={publicSummary}
                                onChange={(e) => setPublicSummary(e.target.value)}
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>שיעורי בית / יצירות לתרגול</Label>
                            <Input
                                placeholder="למשל: סונטה בדו מז'ור, סולם פה מינור"
                                value={homeworkPieces}
                                onChange={(e) => setHomeworkPieces(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>הערה נוספת לתרגול</Label>
                            <Textarea
                                placeholder="למשל: נא להקפיד על הדינמיקה בתיבות 15-20."
                                value={homeworkDesc}
                                onChange={(e) => setHomeworkDesc(e.target.value)}
                                className="h-20"
                            />
                        </div>
                    </div>

                    {/* Private Section (Studio Notes) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-lg text-purple-600">
                            <AlertTriangle className="w-5 h-5" />
                            <span>יומן פדגוגי אישי</span>
                            <span className="text-xs font-normal text-muted-foreground">(לעיונך בלבד)</span>
                        </div>

                        <div className="space-y-2">
                            <Label>רשמים והערות סטודיו</Label>
                            <Textarea
                                placeholder="רשמים אישיים, בעיות, תכנון לשיעור הבא..."
                                value={privateNote}
                                onChange={(e) => setPrivateNote(e.target.value)}
                                className="h-32 bg-purple-50/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>דגלים טכניים (במעקב)</Label>
                            <div className="flex flex-wrap gap-2">
                                {technicalOptions.map(opt => (
                                    <Badge
                                        key={opt.value}
                                        variant={flags.includes(opt.value) ? 'destructive' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => toggleFlag(opt.value)}
                                    >
                                        {opt.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>אווירת השיעור (Mood)</Label>
                            <Select dir="rtl" value={mood} onValueChange={setMood}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר אווירה..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GREAT_SESSION">מצוין - פוקוס מלא</SelectItem>
                                    <SelectItem value="PRODUCTIVE">פרודוקטיבי - התקדמות טובה</SelectItem>
                                    <SelectItem value="CHALLENGING">מאתגר - קשיי ריכוז/טכניקה</SelectItem>
                                    <SelectItem value="CONCERN">מדאיג - דורש שיחה עם ההורים</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-between pt-4">
                <Button variant="outline"><Mic className="w-4 h-4 me-2" /> הוסף פידבק קולי</Button>
                <Button onClick={handleSave} className="w-32"><Save className="w-4 h-4 me-2" /> שמור סיכום</Button>
            </CardFooter>
        </Card>
    );
}
