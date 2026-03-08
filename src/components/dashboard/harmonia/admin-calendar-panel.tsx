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
import { useTranslations, useLocale } from 'next-intl';
import { useDateLocale } from '@/hooks/use-date-locale';

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

export function AdminCalendarPanel() {
    const [closures, setClosures] = useState<ClosureDate[]>(INITIAL_CLOSURES);
    const { toast } = useToast();
    const t = useTranslations('AdminCalendarPanel');
    const locale = useLocale();
    const dateLocale = useDateLocale();
    const isHe = locale === 'he';

    const typeLabels: Record<string, string> = {
        'NATIONAL_HOLIDAY': t('typeNationalHoliday'),
        'CONSERVATORIUM_CLOSURE': t('typeConservatoriumClosure'),
        'EXAM_PERIOD': t('typeExamPeriod'),
        'OTHER': t('typeOther'),
    };

    const handleImportHebcal = () => {
        // Mocking the Hebcal API import process
        toast({ title: t('importingHebcal') });
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

            toast({ title: t('importedSuccess', { count: filteredNew.length }) });
        }, 1500);
    };

    const handleDelete = (id: string) => {
        setClosures(prev => prev.filter(c => c.id !== id));
        toast({ title: t('holidayRemoved') });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 shadow-sm"><CalendarDays className="h-5 w-5 text-primary" /> {t('panelTitle', { count: closures.length })}</CardTitle>
                    <CardDescription>{t('panelDescription')}</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportHebcal}>
                        <DownloadCloud className="me-2 h-4 w-4" /> {t('importHebcalBtn')}
                    </Button>
                    <Button>
                        <Plus className="me-2 h-4 w-4" /> {t('newHolidayBtn')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-start">{t('colDate')}</TableHead>
                            <TableHead className="text-start">{t('colName')}</TableHead>
                            <TableHead className="text-start">{t('colType')}</TableHead>
                            <TableHead className="text-start">{t('colRelevance')}</TableHead>
                            <TableHead className="text-end">{t('colActions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {closures.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('noHolidays')}</TableCell></TableRow>
                        ) : (
                            closures.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium text-start">
                                        {format(new Date(c.date), 'dd/MM/yyyy', { locale: dateLocale })}
                                    </TableCell>
                                    <TableCell className="text-start">{isHe ? c.nameHe : c.name}</TableCell>
                                    <TableCell className="text-start">
                                        <Badge variant={c.type === 'NATIONAL_HOLIDAY' ? 'default' : 'secondary'}>
                                            {typeLabels[c.type] || c.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-start">{c.affectsAllTeachers ? t('relevanceAll') : t('relevanceSome')}</TableCell>
                                    <TableCell className="text-end">
                                        <Button variant="ghost" size="icon" onClick={() => c.id && handleDelete(c.id)} aria-label={t('deleteHoliday')}>
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
