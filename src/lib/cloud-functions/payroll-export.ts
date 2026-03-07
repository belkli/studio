/**
 * @fileoverview Cloud Function spec for payroll report generation.
 * SDD-P1 (Administrator) requires payroll export compatible with
 * Israeli payroll systems (Hilan, Merav Digital).
 */

import type { PayrollExportRow, LessonSlot, User, TeacherCompensation } from '@/lib/types';

/**
 * generatePayrollExport — Callable Cloud Function (admin only)
 * 
 * Generates Excel/CSV payroll data for a given period.
 * 
 * Steps:
 * 1. Validate caller is CONSERVATORIUM_ADMIN
 * 2. Query all COMPLETED lesson slots in the period
 * 3. Group by teacherId
 * 4. For each teacher:
 *    a. Look up TeacherCompensation rates
 *    b. Calculate per-lesson subtotals
 *    c. Include sick leave days (if compensation policy says FULL or PARTIAL)
 *    d. Include event participation hours
 * 5. Generate PayrollExportRow[] array
 * 6. Optionally upload as Excel to Firebase Storage
 * 7. Return the data or a download URL
 */
export interface GeneratePayrollExportSpec {
    input: {
        conservatoriumId: string;
        periodStart: string; // 'YYYY-MM-DD'
        periodEnd: string;
        format: 'CSV' | 'EXCEL';
        includeIdNumbers: boolean; // ת"ז — sensitive field
    };
    output: {
        rows: PayrollExportRow[];
        downloadUrl?: string;
        totalGross: number;
        teacherCount: number;
    };
}

/**
 * Generates a single PayrollExportRow from a completed lesson.
 */
export function buildPayrollRow(
    lesson: LessonSlot,
    teacher: User,
    compensation: TeacherCompensation,
    studentName: string
): PayrollExportRow {
    const durationKey = `duration${lesson.durationMinutes}` as
        | 'duration30'
        | 'duration45'
        | 'duration60';
    const rate = compensation.ratePerLesson[durationKey];

    return {
        employeeId: teacher.id,
        employeeName: teacher.name,
        idNumber: teacher.idNumber,
        employmentType: compensation.employmentType,
        periodStart: '',  // Filled by caller
        periodEnd: '',    // Filled by caller
        lessonDate: lesson.startTime.slice(0, 10),
        lessonStartTime: lesson.startTime.slice(11, 16),
        durationMinutes: lesson.durationMinutes,
        studentName,
        rateApplied: rate,
        lessonSubtotal: rate,
    };
}
