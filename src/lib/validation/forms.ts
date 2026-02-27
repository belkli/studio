/**
 * @fileoverview Zod validation schemas for form submissions and signatures.
 * SDD-P5 (Ministry) and SDD-P7 (Security) require strict validation
 * on all form data, especially exam registrations and forms requiring
 * digital signatures.
 */
import { z } from 'zod';

// ── Dynamic Form Submission ──────────────────────────────────
export const FormSubmissionSchema = z.object({
    formType: z.string().min(1, 'Form type is required'),
    formTemplateId: z.string().optional(),
    conservatoriumId: z.string().min(1),
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    academicYear: z.string().optional(),
    grade: z.enum(['י', 'יא', 'יב']).optional(),

    // Dynamic fields from form template
    formData: z.record(z.string(), z.any()).optional(),

    // Repertoire (for recital/exam forms)
    repertoire: z.array(z.object({
        id: z.string(),
        composer: z.string(),
        title: z.string(),
        duration: z.string(),
        genre: z.string(),
        instrument: z.string().optional(),
    })).optional(),

    totalDuration: z.string().optional(),

    // Exam Registration
    examLevel: z.string().optional(),
    examType: z.string().optional(),
    preferredExamDateRange: z.string().optional(),
    teacherDeclaration: z.boolean().optional(),
    instrument: z.string().optional(),
});

export type FormSubmissionInput = z.infer<typeof FormSubmissionSchema>;

// ── Digital Signature ────────────────────────────────────────
export const SignatureSubmissionSchema = z.object({
    formSubmissionId: z.string().min(1),
    signatureDataUrl: z.string()
        .startsWith('data:image/', 'Signature must be a data URL image')
        .max(500_000, 'Signature data too large'), // ~375KB base64
    signerId: z.string().min(1),
    signerRole: z.enum(['student', 'teacher', 'parent', 'conservatorium_admin', 'site_admin', 'ministry_director']),
});

export type SignatureSubmissionInput = z.infer<typeof SignatureSubmissionSchema>;

// ── Attendance Marking ───────────────────────────────────────
export const AttendanceMarkSchema = z.object({
    slotId: z.string().min(1),
    action: z.enum(['MARK_PRESENT', 'MARK_NO_SHOW_STUDENT', 'MARK_ABSENT_NOTICED', 'MARK_VIRTUAL']),
    teacherNote: z.string().max(500).optional(),
});

export type AttendanceMarkInput = z.infer<typeof AttendanceMarkSchema>;

// ── Sick Leave Request ───────────────────────────────────────
export const SickLeaveRequestSchema = z.object({
    teacherId: z.string().min(1),
    conservatoriumId: z.string().min(1),
    dateRange: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).refine(
        (range) => new Date(range.from) <= new Date(range.to),
        { message: 'From date must be before or equal to To date' }
    ),
    note: z.string().max(500).optional(),
});

export type SickLeaveRequestInput = z.infer<typeof SickLeaveRequestSchema>;
