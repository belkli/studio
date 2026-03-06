/**
 * @fileoverview Comprehensive FormSubmission upsert schema for actions.ts.
 * Based on Security team's schema spec (Security-Zod-fixes.md section 1).
 *
 * This covers the FULL FormSubmission type for upsert operations.
 * For the form creation flow (student-facing), use the simpler
 * FormSubmissionSchema in validation/forms.ts instead.
 */
import { z } from 'zod';

const CompositionSchema = z.object({
  id: z.string().optional(),
  composer: z.string().min(1),
  composerId: z.string().optional(),
  title: z.string().min(1),
  duration: z.string(),
  genre: z.string().min(1),
  instrument: z.string().optional(),
  approved: z.boolean().optional(),
});

const FormStatusSchema = z.enum([
  'DRAFT', 'PENDING_TEACHER', 'PENDING_ADMIN',
  'APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'FINAL_APPROVED',
]);

export const FormSubmissionUpsertSchema = z.object({
  id: z.string().min(1),
  formType: z.string().min(1),
  academicYear: z.string().optional(),
  grade: z.string().optional(),
  conservatoriumName: z.string().optional(),
  conservatoriumManagerName: z.string().optional(),
  conservatoriumManagerPhone: z.string().optional(),
  conservatoriumManagerEmail: z.string().email().optional().or(z.literal('')),
  conservatoriumId: z.string().optional(),

  studentId: z.string().min(1),
  studentName: z.string().min(1),

  applicantDetails: z.object({
    gender: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
  }).optional(),

  schoolDetails: z.object({
    schoolName: z.string().optional(),
    schoolSymbol: z.string().optional(),
    hasMusicMajor: z.boolean().optional(),
    isMajorParticipant: z.boolean().optional(),
    plansTheoryExam: z.boolean().optional(),
    schoolEmail: z.string().email().optional().or(z.literal('')),
  }).optional(),

  instrumentDetails: z.object({
    instrument: z.string().optional(),
    yearsOfStudy: z.number().int().min(0).max(30).optional(),
    recitalField: z.string().optional(),
    previousOrOtherInstrument: z.string().optional(),
  }).optional(),

  teacherDetails: z.object({
    name: z.string().optional(),
    idNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    yearsWithTeacher: z.number().int().min(0).max(30).optional(),
  }).optional(),

  additionalMusicDetails: z.object({
    ensembleParticipation: z.string().optional(),
    theoryStudyYears: z.number().int().min(0).max(20).optional(),
    orchestraParticipation: z.string().optional(),
  }).optional(),

  previousRepertoire: z.array(z.object({
    piece: z.string(),
    composer: z.string(),
    scope: z.string(),
    performedByHeart: z.boolean(),
  })).optional(),

  status: FormStatusSchema,
  submissionDate: z.string(),
  submittedBy: z.string().optional(),
  totalDuration: z.string(),
  repertoire: z.array(CompositionSchema),

  teacherId: z.string().optional(),
  adminId: z.string().optional(),
  teacherComment: z.string().max(2000).optional(),
  adminComment: z.string().max(2000).optional(),
  ministryComment: z.string().max(2000).optional(),
  managerNotes: z.string().max(2000).optional(),
  calculatedPrice: z.number().min(0).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'waived']).optional(),

  signatureUrl: z.string().optional(),
  signedBy: z.string().optional(),
  signedAt: z.string().optional(),

  formData: z.record(z.string(), z.unknown()).optional(),
  formTemplateId: z.string().optional(),

  // Ministry approval fields
  requiresMinistryApproval: z.boolean().optional(),
  ministryReviewedAt: z.string().optional(),
  ministryReviewedByDirectorId: z.string().optional(),
  ministryDirectorComment: z.string().max(2000).optional(),
  ministryExportedAt: z.string().optional(),
  ministryReferenceNumber: z.string().optional(),

  // Exam Registration fields
  examLevel: z.string().optional(),
  examType: z.string().optional(),
  preferredExamDateRange: z.string().optional(),
  teacherDeclaration: z.boolean().optional(),
  instrument: z.string().optional(),
  eventName: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  conductor: z.string().optional(),
  accompanist: z.string().optional(),
  numParticipants: z.number().int().min(0).optional(),
});

export type FormSubmissionUpsertInput = z.infer<typeof FormSubmissionUpsertSchema>;
