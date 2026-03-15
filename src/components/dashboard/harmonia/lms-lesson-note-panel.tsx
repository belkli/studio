'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, Mic, FileText } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function LmsLessonNotePanel({ lessonId, studentId }: { lessonId: string, studentId: string }) {
    const { lessonNotes, addLessonNote, users } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('LessonManagement');
    const locale = useLocale();
    const isRtl = locale === 'he' || locale === 'ar';

    const [publicSummary, setPublicSummary] = useState('');
    const [homeworkDesc, setHomeworkDesc] = useState('');
    const [homeworkPieces, setHomeworkPieces] = useState('');
    const [privateNote, setPrivateNote] = useState('');
    const [mood, setMood] = useState('PRODUCTIVE');
    const [flags, setFlags] = useState<string[]>([]);

    const student = users.find(u => u.id === studentId);

    const existingNote = lessonNotes.find(n => n.slotId === lessonId || n.lessonSlotId === lessonId);

    useEffect(() => {
        if (existingNote) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

        toast({ title: t('noteSavedSuccess') });
    };

    const toggleFlag = (flag: string) => {
        setFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);
    };

    const technicalOptions = [
        { value: 'POSTURE', label: t('posture') },
        { value: 'TONE', label: t('toneProduction') },
        { value: 'RHYTHM', label: t('rhythm') },
        { value: 'THEORY_GAP', label: t('theoryGap') },
        { value: 'MOTIVATION', label: t('motivation') },
        { value: 'TECHNIQUE', label: t('technique') },
    ];

    return (
        <Card className="max-w-4xl border-t-4 border-t-primary" dir={isRtl ? 'rtl' : 'ltr'}>
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="flex justify-between items-center">
                    <span>{t('lessonNoteStudent', { name: student?.name || '' })}</span>
                    <Badge variant={existingNote ? 'default' : 'secondary'}>
                        {existingNote ? t('previouslyEdited') : t('newDraft')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Public Section */}
                    <div className="space-y-4 border-s ps-6">
                        <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                            <FileText className="w-5 h-5" />
                            <span>{t('publicSummaryTasks')}</span>
                            <span className="text-xs font-normal text-muted-foreground">{t('visibleToStudentParent')}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('whatDidWeLearn')}</Label>
                            <Textarea
                                placeholder={t('whatDidWeLearnPlaceholder')}
                                value={publicSummary}
                                onChange={(e) => setPublicSummary(e.target.value)}
                                className="h-24"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('homeworkPieces')}</Label>
                            <Input
                                placeholder={t('homeworkPiecesPlaceholder')}
                                value={homeworkPieces}
                                onChange={(e) => setHomeworkPieces(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('additionalPracticeNote')}</Label>
                            <Textarea
                                placeholder={t('additionalPracticeNotePlaceholder')}
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
                            <span>{t('personalPedagogicalLog')}</span>
                            <span className="text-xs font-normal text-muted-foreground">{t('forYourEyesOnly')}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('studioImpressions')}</Label>
                            <Textarea
                                placeholder={t('studioImpressionsPlaceholder')}
                                value={privateNote}
                                onChange={(e) => setPrivateNote(e.target.value)}
                                className="h-32 bg-purple-50/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('technicalFlagsTracked')}</Label>
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
                            <Label>{t('lessonMood')}</Label>
                            <Select dir={isRtl ? 'rtl' : 'ltr'} value={mood} onValueChange={setMood}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectMood')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GREAT_SESSION">{t('moodExcellent')}</SelectItem>
                                    <SelectItem value="PRODUCTIVE">{t('moodProductive')}</SelectItem>
                                    <SelectItem value="CHALLENGING">{t('moodChallenging')}</SelectItem>
                                    <SelectItem value="CONCERN">{t('moodConcerning')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-between pt-4">
                <Button variant="outline"><Mic className="w-4 h-4 me-2" /> {t('addVoiceFeedback')}</Button>
                <Button onClick={handleSave} className="w-32"><Save className="w-4 h-4 me-2" /> {t('saveNote')}</Button>
            </CardFooter>
        </Card>
    );
}
