'use client';
import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { Users, UserX, CalendarClock, CreditCard, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, isAfter, subMinutes, isFuture, addDays, getDay, isSameDay, setHours } from 'date-fns';
import { useDateLocale } from './use-date-locale';
import type { EmptySlot, DayOfWeek, User } from '@/lib/types';


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

import { useTranslations } from 'next-intl';

export function useAdminAlerts(): AdminAlert[] {
    const t = useTranslations('AdminAlerts');
    const { users, lessons, practiceLogs, invoices } = useAuth();
    const dateLocale = useDateLocale();

    // Helper to get demand pattern
    const getDemandLevel = (lessons: any[], date: Date) => {
        const dayName = format(date, 'EEEE', { locale: dateLocale }).toUpperCase();
        const sameDayLessons = lessons.filter(l => format(new Date(l.startTime), 'EEEE', { locale: dateLocale }).toUpperCase() === dayName);
        const count = sameDayLessons.length;
        if (count >= 8) return 'CRITICAL';
        if (count >= 5) return 'HIGH';
        if (count >= 3) return 'MODERATE';
        return 'LOW';
    };

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
                        title: t('teacherCapacityTitle', { name: teacher.name }),
                        description: t('teacherCapacityDesc', { percent: (capacity * 100).toFixed(0) }),
                        actionLink: `/dashboard/users`,
                        actionLabel: t('manageTeachers')
                    });
                }
            }
        });

        // Alert 2: Student disengaged
        students.forEach(student => {
            const thirtyDaysAgo = subDays(new Date(), 30);
            const noShows = lessons.filter(l =>
                l.studentId === student.id &&
                l.status === 'NO_SHOW_STUDENT' &&
                l.attendanceMarkedAt &&
                new Date(l.attendanceMarkedAt) > thirtyDaysAgo
            ).length;

            const hasPracticed = practiceLogs.some(p => p.studentId === student.id && new Date(p.date) > thirtyDaysAgo);

            if (noShows >= 2 && !hasPracticed) {
                allAlerts.push({
                    id: `student-disengaged-${student.id}`,
                    severity: 'critical',
                    icon: UserX,
                    title: t('studentDisengagedTitle', { name: student.name }),
                    description: t('studentDisengagedDesc', { count: noShows }),
                    actionLink: `/dashboard/teacher/student/${student.id}`,
                    actionLabel: t('viewProfile')
                });
            }
        });

        // Alert 3: Makeup backlog
        students.forEach(student => {
            const grantedCredits = lessons.filter(l => l.studentId === student.id && (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM')).length;
            const usedCredits = lessons.filter(l => l.studentId === student.id && l.type === 'MAKEUP').length;
            const balance = grantedCredits - usedCredits;

            if (balance > 3) {
                allAlerts.push({
                    id: `makeup-backlog-${student.id}`,
                    severity: 'info',
                    icon: CalendarClock,
                    title: t('makeupBacklogTitle', { name: student.name }),
                    description: t('makeupBacklogDesc', { count: balance }),
                    actionLink: `/dashboard/admin/makeups`,
                    actionLabel: t('viewMakeups')
                });
            }
        });

        // Alert 4: Payment failure spike
        const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
        if (overdueInvoices.length > 0) {
            allAlerts.push({
                id: `payment-spike`,
                severity: 'critical',
                icon: CreditCard,
                title: t('paymentSpikeTitle'),
                description: t('paymentSpikeDesc', { count: overdueInvoices.length }),
                actionLink: `/dashboard/billing`,
                actionLabel: t('goToBilling')
            });
        }

        // Alert 5: Substitute Needed
        const lessonsNeedingSub = lessons.filter(l => l.status === 'CANCELLED_TEACHER' && isFuture(new Date(l.startTime)));
        if (lessonsNeedingSub.length > 0) {
            allAlerts.push({
                id: 'substitute-needed',
                severity: 'critical',
                icon: UserX,
                title: t('substituteNeededTitle'),
                description: t('substituteNeededDesc', { count: lessonsNeedingSub.length }),
                actionLink: '/dashboard/admin/substitute',
                actionLabel: t('assignSubstitutes'),
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

                    const isBooked = lessons.some(l =>
                        l.teacherId === teacher.id &&
                        isSameDay(new Date(l.startTime), date) &&
                        new Date(l.startTime).getHours() === hour
                    );

                    if (!isBooked) {
                        const demandString = getDemandLevel(lessons, slotTime);
                        if (demandString === 'CRITICAL' || demandString === 'HIGH') {
                            potentialSlots.push({
                                id: `${teacher.id}-${date.toISOString()}-${hour}`,
                                teacher: teacher,
                                instrument: teacherInstruments[0] || 'שיעור',
                                startTime: slotTime,
                                durationMinutes: 45,
                                basePrice: 120,
                                promotionalPrice: 100,
                                discount: 15,
                                urgency: isSameDay(date, today) ? 'SAME_DAY' : 'TOMORROW',
                                demandLevel: demandString === 'CRITICAL' ? 'HIGH_DEMAND' : 'MEDIUM_DEMAND',
                            });
                        }
                    }
                }
            });
        });

        const slotToPromote = potentialSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

        if (slotToPromote) {
            allAlerts.push({
                id: `promote-slot-${slotToPromote.id}`,
                severity: 'info',
                icon: TrendingUp,
                title: t('promoteSlotTitle'),
                description: t('promoteSlotDesc', {
                    instrument: slotToPromote.instrument,
                    name: slotToPromote.teacher.name,
                    day: format(slotToPromote.startTime, 'EEEE', { locale: dateLocale })
                }),
                actionLink: '#promote-slot',
                actionLabel: t('promoteSlot'),
                data: slotToPromote,
            });
        }


        return allAlerts;
    }, [users, lessons, practiceLogs, invoices, dateLocale, t]);

    return alerts;
}
