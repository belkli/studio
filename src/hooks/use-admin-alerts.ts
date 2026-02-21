'use client';
import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { Users, UserX, CalendarClock, CreditCard } from "lucide-react";
import { subDays, isFuture } from 'date-fns';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AdminAlert {
    id: string;
    severity: AlertSeverity;
    icon: React.ElementType;
    title: string;
    description: string;
    actionLink: string;
    actionLabel: string;
}

export function useAdminAlerts(): AdminAlert[] {
    const { users, mockLessons, mockPracticeLogs, mockInvoices } = useAuth();

    const alerts = useMemo(() => {
        const allAlerts: AdminAlert[] = [];
        const teachers = users.filter(u => u.role === 'teacher');
        const students = users.filter(u => u.role === 'student' && u.approved);

        // Alert 1: Teacher capacity full
        teachers.forEach(teacher => {
            if (teacher.students && teacher.maxStudents) {
                const capacity = (teacher.students.length / teacher.maxStudents);
                if (capacity > 0.9) {
                    allAlerts.push({
                        id: `teacher-cap-${teacher.id}`,
                        severity: 'warning',
                        icon: Users,
                        title: `קיבולת מורה גבוהה: ${teacher.name}`,
                        description: `המורה בתפוסה של ${(capacity * 100).toFixed(0)}%. יש לשקול סגירת הרשמה.`,
                        actionLink: `/dashboard/users`,
                        actionLabel: 'נהל מורים'
                    });
                }
            }
        });
        
        // Alert 2: Student disengaged
        students.forEach(student => {
            const thirtyDaysAgo = subDays(new Date(), 30);
            const noShows = mockLessons.filter(l => 
                l.studentId === student.id &&
                l.status === 'NO_SHOW_STUDENT' &&
                l.attendanceMarkedAt &&
                new Date(l.attendanceMarkedAt) > thirtyDaysAgo
            ).length;

            const hasPracticed = mockPracticeLogs.some(p => p.studentId === student.id && new Date(p.date) > thirtyDaysAgo);

            if (noShows >= 2 && !hasPracticed) {
                 allAlerts.push({
                    id: `student-disengaged-${student.id}`,
                    severity: 'critical',
                    icon: UserX,
                    title: `תלמיד/ה בסיכון נשירה: ${student.name}`,
                    description: `לא נרשם אימון ב-30 הימים האחרונים וסומנו ${noShows} היעדרויות.`,
                    actionLink: `/dashboard/teacher/student/${student.id}`,
                    actionLabel: 'צפה בפרופיל'
                });
            }
        });

        // Alert 3: Makeup backlog
        students.forEach(student => {
            const grantedCredits = mockLessons.filter(l => l.studentId === student.id && (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM')).length;
            const usedCredits = mockLessons.filter(l => l.studentId === student.id && l.type === 'MAKEUP').length;
            const balance = grantedCredits - usedCredits;

            if (balance > 3) {
                 allAlerts.push({
                    id: `makeup-backlog-${student.id}`,
                    severity: 'info',
                    icon: CalendarClock,
                    title: `יתרת שיעורי השלמה גבוהה: ${student.name}`,
                    description: `לתלמיד/ה יתרה של ${balance} שיעורי השלמה. יש לעודד קביעת שיעורים.`,
                    actionLink: `/dashboard/admin/makeups`,
                    actionLabel: 'צפה בלוח ההשלמות'
                });
            }
        });
        
        // Alert 4: Payment failure spike
        const overdueInvoices = mockInvoices.filter(inv => inv.status === 'OVERDUE');
        if (overdueInvoices.length > 0) {
             allAlerts.push({
                id: `payment-spike`,
                severity: 'critical',
                icon: CreditCard,
                title: `ריבוי חיובים בפיגור`,
                description: `קיימות ${overdueInvoices.length} חשבוניות שלא שולמו בזמן. יש לבצע מעקב.`,
                actionLink: `/dashboard/billing`,
                actionLabel: 'עבור לחיובים'
            });
        }
        
        // Alert 5: Substitute Needed
        const lessonsNeedingSub = mockLessons.filter(l => l.status === 'CANCELLED_TEACHER' && isFuture(new Date(l.startTime)));
        if (lessonsNeedingSub.length > 0) {
            allAlerts.push({
                id: 'substitute-needed',
                severity: 'critical',
                icon: UserX,
                title: 'דרוש שיבוץ מחליף/ה',
                description: `${lessonsNeedingSub.length} שיעורים בוטלו עקב היעדרות מורה ודורשים שיבוץ מורה מחליף.`,
                actionLink: '/dashboard/admin/substitute',
                actionLabel: 'שבץ מורים מחליפים',
            });
        }


        return allAlerts;
    }, [users, mockLessons, mockPracticeLogs, mockInvoices]);

    return alerts;
}
