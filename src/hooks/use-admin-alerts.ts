'use client';
import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { Users, UserX, CalendarClock, CreditCard, TrendingUp } from "lucide-react";
import { subDays, isFuture, addDays, getDay, isSameDay, setHours, isAfter } from 'date-fns';
import type { EmptySlot, DayOfWeek, User } from '@/lib/types';
import { format } from 'date-fns';


export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AdminAlert {
    id: string;
    severity: AlertSeverity;
    icon: React.ElementType;
    title: string;
    description: string;
    actionLink: string;
    actionLabel: string;
    data?: any;
}

function getDemandLevel(date: Date): 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND' {
    const hour = date.getHours();
    const day = date.getDay(); // Sunday - 0, Saturday - 6

    if (hour >= 15 && hour < 19 && day >= 0 && day <= 4) { // Sun-Thu afternoon
        return 'HIGH_DEMAND';
    }
    if (day === 5 || hour < 13) { // Friday or mornings
        return 'LOW_DEMAND';
    }
    return 'MEDIUM_DEMAND';
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
        
        // Alert 6: Smart Slot Filling
        const availableTeachers = users.filter(u => u.role === 'teacher' && u.availability);
        const today = new Date();
        const tomorrow = addDays(today, 1);
        const potentialSlots: EmptySlot[] = [];

        availableTeachers.forEach(teacher => {
            const teacherInstruments = teacher.instruments?.map(i => i.instrument) || [];
            [today, tomorrow].forEach(date => {
                const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][getDay(date)] as DayOfWeek;
                const availability = teacher.availability?.find(a => a.dayOfWeek === dayOfWeek);
                if (!availability) return;

                for (let hour = parseInt(availability.startTime); hour < parseInt(availability.endTime); hour++) {
                    const slotTime = setHours(date, hour);
                    if (!isAfter(slotTime, new Date())) continue;

                    const isBooked = mockLessons.some(l => 
                        l.teacherId === teacher.id && 
                        isSameDay(new Date(l.startTime), date) && 
                        new Date(l.startTime).getHours() === hour
                    );

                    if (!isBooked) {
                        const demandLevel = getDemandLevel(slotTime);
                        if (demandLevel === 'HIGH_DEMAND') {
                             potentialSlots.push({
                                id: `${teacher.id}-${date.toISOString()}-${hour}`,
                                teacher: teacher,
                                instrument: teacherInstruments[0] || 'שיעור', // Fallback
                                startTime: slotTime,
                                durationMinutes: 45, // default
                                basePrice: 120, // mock
                                promotionalPrice: 100, // mock
                                discount: 15, // mock
                                urgency: isSameDay(date, today) ? 'SAME_DAY' : 'TOMORROW',
                                demandLevel,
                            });
                        }
                    }
                }
            });
        });
        
        const slotToPromote = potentialSlots.sort((a,b) => a.startTime.getTime() - b.startTime.getTime())[0];
        
        if (slotToPromote) {
             allAlerts.push({
                id: `promote-slot-${slotToPromote.id}`,
                severity: 'info',
                icon: TrendingUp,
                title: `הזדמנות למילוי חלון פנוי`,
                description: `שיעור ${slotToPromote.instrument} עם ${slotToPromote.teacher.name} ביום ${format(slotToPromote.startTime, 'EEEE')} פנוי.`,
                actionLink: '#promote-slot',
                actionLabel: 'קדם שיעור',
                data: slotToPromote,
            });
        }


        return allAlerts;
    }, [users, mockLessons, mockPracticeLogs, mockInvoices]);

    return alerts;
}

