
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Briefcase, GraduationCap, Link as LinkIcon, Mic, Music } from 'lucide-react';
import { useTranslations } from 'next-intl';

const mockAlumni = [
    {
        id: 'alumni-1',
        name: 'דניאל כהן',
        avatarUrl: 'https://i.pravatar.cc/150?u=alumni1',
        graduationYear: 2018,
        instrument: 'פסנתר',
        currentRole: 'פסנתרן קונצרטים',
        achievements: 'זוכה תחרות פנינה זלצמן 2021'
    },
    {
        id: 'alumni-2',
        name: 'מאיה לוי',
        avatarUrl: 'https://i.pravatar.cc/150?u=alumni2',
        graduationYear: 2020,
        instrument: 'כינור',
        currentRole: 'נגנית בתזמורת הפילהרמונית הישראלית',
        achievements: 'בוגרת תואר שני בג\'וליארד'
    },
    {
        id: 'alumni-3',
        name: 'יונתן אגמון',
        avatarUrl: 'https://i.pravatar.cc/150?u=alumni3',
        graduationYear: 2019,
        instrument: 'שירה קלאסית',
        currentRole: 'סולן באופרה הישראלית',
        achievements: 'השתתף בכיתת אמן עם פלסידו דומינגו'
    }
];

const mockMasterclasses = [
    {
        id: 'mc-1',
        title: 'טכניקות מתקדמות לפסנתר',
        instructor: 'דניאל כהן',
        date: '2024-08-15',
        price: 250,
    },
    {
        id: 'mc-2',
        title: 'הכנה לאודישנים לתזמורת',
        instructor: 'מאיה לוי',
        date: '2024-09-05',
        price: 300,
    }
];


export function AlumniPortal() {
    const t = useTranslations('AlumniPage');

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('directoryTitle')}</CardTitle>
                    <CardDescription>{t('directorySubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockAlumni.map(alumnus => (
                        <Card key={alumnus.id} className="text-center">
                            <CardContent className="pt-6 flex flex-col items-center">
                                <Avatar className="w-24 h-24 mb-4">
                                    <AvatarImage src={alumnus.avatarUrl} />
                                    <AvatarFallback>{alumnus.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-lg">{alumnus.name}</h3>
                                <p className="text-sm text-muted-foreground">{t('graduated', { year: alumnus.graduationYear, instrument: alumnus.instrument })}</p>
                                <Badge variant="secondary" className="mt-2">{alumnus.currentRole}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('masterclassesTitle')}</CardTitle>
                    <CardDescription>{t('masterclassesSubtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mockMasterclasses.map(mc => (
                        <div key={mc.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="font-semibold">{mc.title}</h3>
                                <p className="text-sm text-muted-foreground">{t('instructor', { name: mc.instructor })}</p>
                                <p className="text-sm text-muted-foreground">{t('date', { date: new Date(mc.date) })}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">₪{mc.price}</span>
                                <Button>{t('registerButton')}</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

