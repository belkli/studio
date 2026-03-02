import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import type { FormStatus, FormSubmission, User } from '@/lib/types';
import { isThisWeek, isToday } from 'date-fns';

export function useLiveStats() {
    const { user, users, mockFormSubmissions, mockPayrolls } = useAuth();

    const stats = useMemo(() => {
        if (!user) {
            return {
                pendingUsers: 0,
                pendingForms: 0,
                draftPayrolls: 0,
                approvedFormsThisWeek: 0,
                paidOutThisWeek: 0,
                activeStudents: 0,
                newStudentsToday: 0,
                activeTeachers: 0,
                newTeachersToday: 0,
                formsPendingTeacher: 0,
                formsPendingAdmin: 0,
                formsInRevision: 0,
                totalForms: 0,
                totalPaidOut: 0,
            };
        }

        const conservatoriumId = user.conservatoriumId;

        // Filter data for the current conservatorium
        const conservatoriumUsers = users.filter(u => u.conservatoriumId === conservatoriumId);
        const conservatoriumForms = mockFormSubmissions.filter(f => f.conservatoriumId === conservatoriumId);
        const conservatoriumPayrolls = mockPayrolls.filter(p => p.conservatoriumId === conservatoriumId);

        // User stats
        const pendingUsers = conservatoriumUsers.filter(u => !u.approved).length;
        const activeStudents = conservatoriumUsers.filter(u => u.role === 'student' && u.approved).length;
        const newStudentsToday = conservatoriumUsers.filter(u => u.role === 'student' && u.approved && u.createdAt && isToday(new Date(u.createdAt))).length;
        const activeTeachers = conservatoriumUsers.filter(u => u.role === 'teacher' && u.approved).length;
        const newTeachersToday = conservatoriumUsers.filter(u => u.role === 'teacher' && u.approved && u.createdAt && isToday(new Date(u.createdAt))).length;

        // Form stats
        const formStatusCounts = conservatoriumForms.reduce((acc, form) => {
            acc[form.status] = (acc[form.status] || 0) + 1;
            return acc;
        }, {} as Record<FormStatus, number>);

        const pendingForms = conservatoriumForms.filter(f => 
            f.status === 'PENDING_TEACHER' || f.status === 'PENDING_ADMIN'
        ).length;
        
        const approvedFormsThisWeek = conservatoriumForms.filter(f => 
            (f.status === 'APPROVED' || f.status === 'FINAL_APPROVED') && f.signedAt && isThisWeek(new Date(f.signedAt))
        ).length;

        // Payroll stats
        const draftPayrolls = conservatoriumPayrolls.filter(p => p.status === 'DRAFT').length;
        const paidOutThisWeek = conservatoriumPayrolls.reduce((acc, p) => {
            if (p.status === 'PAID' && p.paymentDate && isThisWeek(new Date(p.paymentDate))) {
                return acc + p.totalAmount;
            }
            return acc;
        }, 0);
        const totalPaidOut = conservatoriumPayrolls.reduce((acc, p) => {
            if (p.status === 'PAID' && p.paymentDate) {
                return acc + p.totalAmount;
            }
            return acc;
        }, 0);


        return {
            pendingUsers,
            pendingForms,
            draftPayrolls,
            approvedFormsThisWeek,
            paidOutThisWeek,
            activeStudents,
            newStudentsToday,
            activeTeachers,
            newTeachersToday,
            formsPendingTeacher: formStatusCounts['PENDING_TEACHER'] || 0,
            formsPendingAdmin: formStatusCounts['PENDING_ADMIN'] || 0,
            formsInRevision: formStatusCounts['REVISION_REQUIRED'] || 0,
            totalForms: conservatoriumForms.length,
            totalPaidOut
        };
    }, [user, users, mockFormSubmissions, mockPayrolls]);

    return stats;
}
