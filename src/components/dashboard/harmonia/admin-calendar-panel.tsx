'use client';
import { useState } from 'react';
import type { ClosureDate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, DownloadCloud, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const INITIAL_CLOSURES: ClosureDate[] = [
    {
        id: 'c-1',
        date: '2026-09-11',
        type: 'NATIONAL_HOLIDAY',
        name: 'Rosh Hashana',
        nameHe: 'ראש השנה',
        affectsAllTeachers: true,
        isRecurring: true,
        jewishCalendarRef: '1_TISHRI',
    },
    {
        id: 'c-2',
        date: '2026-09-12',
        type: 'NATIONAL_HOLIDAY',
        name: 'Rosh Hashana II',
        nameHe: 'ראש השנה ב\'',
        affectsAllTeachers: true,
        isRecurring: true,
        jewishCalendarRef: '2_TISHRI',
    },
    {
        id: 'c-3',
        date: '2026-09-20',
        type: 'NATIONAL_HOLIDAY',
        name: 'Yom Kippur',
        nameHe: 'יום כיפור',
        affectsAllTeachers: true,
        isRecurring: true,
        jewishCalendarRef: '10_TISHRI',
    }
];

const typeLabels: Record<string, string> = {
    'NATIONAL_HOLIDAY': 'חג לאומי',
    'CONSERVATORIUM_CLOSURE': 'חופשת קונסרבטוריון',
    'EXAM_PERIOD': 'תקופת בגרויות',
    'OTHER': 'אחר',
};

export function AdminCalendarPanel() {
    const [closures, setClosures] = useState<ClosureDate[]>(INITIAL_CLOSURES);
    const { toast } = useToast();

    const handleImportHebcal = () => {
        // Mocking the Hebcal API import process
        toast({ title: 'מייבא חגי ישראל (Hebcal)...' });
        setTimeout(() => {
            const newClosures: ClosureDate[] = [
                {
                    id: `c-${Date.now()}-1`,
                    date: '2027-04-21',
                    type: 'NATIONAL_HOLIDAY',
                    name: 'Passover',
                    nameHe: 'פסח',
                    affectsAllTeachers: true,
                    isRecurring: true,
                    jewishCalendarRef: '15_NISAN',
                },
                {
                    id: `c-${Date.now()}-2`,
                    date: '2027-05-12',
                    type: 'NATIONAL_HOLIDAY',
                    name: 'Yom HaAtzmaut',
                    nameHe: 'יום העצמאות',
                    affectsAllTeachers: true,
                    isRecurring: false,
                }
            ];

            // Only add ones that don't already exist by date
            const existingDates = new Set(closures.map(c => c.date));
            const filteredNew = newClosures.filter(c => !existingDates.has(c.date));

            setClosures(prev => [...prev, ...filteredNew].sort((a, b) => a.date.localeCompare(b.date)));

            toast({ title: `יובאו ${filteredNew.length} חגים בהצלחה.` });
        }, 1500);
    };

    const handleDelete = (id: string) => {
        setClosures(prev => prev.filter(c => c.id !== id));
        toast({ title: 'המועד נמחק מהיומן' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 shadow-sm"><CalendarDays className="h-5 w-5 text-primary" /> חופשות וחגים ({closures.length})</CardTitle>
                    <CardDescription>תאריכים בהם יומן השיבוצים חסום ולא ניתן לקבוע שיעורים חדשים.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportHebcal}>
                        <DownloadCloud className="me-2 h-4 w-4" /> ייבוא מ־Hebcal
                    </Button>
                    <Button>
                        <Plus className="me-2 h-4 w-4" /> מועד חופשה חדש
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>תאריך</TableHead>
                            <TableHead>שם החג/המועד</TableHead>
                            <TableHead>סוג</TableHead>
                            <TableHead>רלוונטיות</TableHead>
                            <TableHead className="text-left">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {closures.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">לא הוגדרו חופשות במערכת.</TableCell></TableRow>
                        ) : (
                            closures.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{format(new Date(c.date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                                    <TableCell>{c.nameHe}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.type === 'NATIONAL_HOLIDAY' ? 'default' : 'secondary'}>
                                            {typeLabels[c.type] || c.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{c.affectsAllTeachers ? 'כלל הקונסרבטוריון' : 'חלק מהמורים'}</TableCell>
                                    <TableCell className="text-left">
                                        <Button variant="ghost" size="icon" onClick={() => c.id && handleDelete(c.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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
