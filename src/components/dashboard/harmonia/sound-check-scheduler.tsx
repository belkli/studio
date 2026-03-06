
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format, add, set } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Send, Sparkles } from 'lucide-react';
import type { EventProduction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SoundCheckSchedulerProps {
    event: EventProduction;
    onUpdate: (updatedEvent: EventProduction) => void;
}

export function SoundCheckScheduler({ event, onUpdate }: SoundCheckSchedulerProps) {
    const { toast } = useToast();
    const dateLocale = useDateLocale();

    const handleTimeChange = (performanceId: string, time: string) => {
        const updatedSchedule = event.soundCheckSchedule?.map(slot =>
            slot.performanceId === performanceId ? { ...slot, startTime: time } : slot
        ) || [];
        onUpdate({ ...event, soundCheckSchedule: updatedSchedule });
    };

    const autoGenerateSchedule = () => {
        let currentTime = set(new Date(event.dressRehearsalDate || event.eventDate), { hours: 17, minutes: 0 });
        const newSchedule = event.program.map(perf => {
            const slot = {
                performanceId: perf.id,
                startTime: format(currentTime, 'HH:mm'),
                durationMinutes: 10,
            };
            currentTime = add(currentTime, { minutes: 15 }); // 10 min slot + 5 min buffer
            return slot;
        });
        onUpdate({ ...event, soundCheckSchedule: newSchedule });
        toast({ title: "לו\"ז חזרות נוצר בהצלחה" });
    };

    const handleSendSchedule = () => {
        toast({
            title: "לוח הזמנים נשלח!",
            description: "הודעות נשלחו לכל המבצעים עם שעת ההגעה שלהם.",
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>לוח חזרות וסאונד-צ&apos;ק</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {event.dressRehearsalDate && (
                    <p className="text-sm">
                        <span className="font-semibold">חזרה גנרלית:</span> {format(new Date(event.dressRehearsalDate), 'EEEE, dd/MM/yyyy', { locale: dateLocale })}
                    </p>
                )}
                <Button variant="outline" size="sm" onClick={autoGenerateSchedule} className="w-full">
                    <Sparkles className="me-2 h-4 w-4 text-yellow-500" />
                    צור לוח זמנים אוטומטי
                </Button>
                <div className="max-h-80 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>מבצע/ת</TableHead>
                                <TableHead>שעה</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.program.map(perf => {
                                const slot = event.soundCheckSchedule?.find(s => s.performanceId === perf.id);
                                return (
                                    <TableRow key={perf.id}>
                                        <TableCell className="font-medium">{perf.studentName}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="time"
                                                value={slot?.startTime || ''}
                                                onChange={(e) => handleTimeChange(perf.id, e.target.value)}
                                                className="h-8 w-24"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {event.program.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24">
                                        שבץ מבצעים כדי ליצור לו&quot;ז חזרות.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSendSchedule} disabled={!event.soundCheckSchedule || event.soundCheckSchedule.length === 0}>
                    <Send className="me-2 h-4 w-4" />
                    שלח לו&quot;ז למבצעים
                </Button>
            </CardFooter>
        </Card>
    );
}
