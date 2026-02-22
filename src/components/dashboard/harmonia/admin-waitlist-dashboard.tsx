'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { WaitlistEntry, WaitlistStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Send, Trash2, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState } from '@/components/ui/empty-state';

const statusConfig: Record<WaitlistStatus, { label: string; className: string }> = {
    WAITING: { label: 'ממתין', className: 'bg-blue-100 text-blue-800' },
    OFFERED: { label: 'הוצע מקום', className: 'bg-yellow-100 text-yellow-800' },
    ACCEPTED: { label: 'שובץ', className: 'bg-green-100 text-green-800' },
    DECLINED: { label: 'דחה הצעה', className: 'bg-gray-100 text-gray-800' },
    EXPIRED: { label: 'פג תוקף', className: 'bg-red-100 text-red-800' },
};


export function AdminWaitlistDashboard() {
    const { user, mockWaitlist, updateWaitlistStatus, users } = useAuth();
    const { toast } = useToast();

    const waitlist = useMemo(() => {
        if (!user) return [];
        return mockWaitlist.map(entry => {
            const student = users.find(u => u.id === entry.studentId);
            const teacher = users.find(u => u.id === entry.teacherId);
            return {
                ...entry,
                studentName: student?.name || 'לא ידוע',
                teacherName: teacher?.name || 'לא ידוע',
            }
        }).filter(entry => entry.status === 'WAITING' || entry.status === 'OFFERED')
          .sort((a,b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    }, [user, mockWaitlist, users]);
    
    const handleOffer = (entryId: string, studentName: string) => {
        updateWaitlistStatus(entryId, 'OFFERED');
        toast({
            title: 'הצעה נשלחה',
            description: `הודעת SMS נשלחה אל ${studentName} עם הצעה למקום פנוי.`,
        });
    }

    const handleRemove = (entryId: string) => {
        updateWaitlistStatus(entryId, 'DECLINED'); // Or a new "REMOVED" status
        toast({
            variant: "destructive",
            title: 'הוסר מרשימת ההמתנה',
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>רשימת ממתינים פעילה</CardTitle>
                <CardDescription>תלמידים הממתינים למקום פנוי, מסודרים לפי תאריך הצטרפות.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>תלמיד/ה</TableHead>
                            <TableHead>מורה מבוקש</TableHead>
                            <TableHead>כלי נגינה</TableHead>
                            <TableHead>תאריך הצטרפות</TableHead>
                            <TableHead>סטטוס</TableHead>
                            <TableHead className="text-left">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {waitlist.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                   <EmptyState
                                        icon={ListChecks}
                                        title="רשימת ההמתנה ריקה"
                                        description="אין כרגע תלמידים הממתינים לשיבוץ."
                                        className="py-12"
                                   />
                                </TableCell>
                            </TableRow>
                        ) : (
                            waitlist.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.studentName}</TableCell>
                                    <TableCell>{entry.teacherName}</TableCell>
                                    <TableCell>{entry.instrument}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{format(new Date(entry.joinedAt), 'dd/MM/yyyy')}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({formatDistanceToNow(new Date(entry.joinedAt), { locale: he, addSuffix: true })})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[entry.status].className}>
                                            {statusConfig[entry.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-left space-x-2 space-x-reverse">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            disabled={entry.status === 'OFFERED'}
                                            onClick={() => handleOffer(entry.id, entry.studentName)}
                                        >
                                            <Send className="ms-2 h-3 w-3" />
                                            שלח הצעה
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="ms-2 h-3 w-3" />
                                                    הסר
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>הסרת ממתין</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        האם להסיר את {entry.studentName} מרשימת ההמתנה? פעולה זו אינה הפיכה.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRemove(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                                        כן, הסר
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
