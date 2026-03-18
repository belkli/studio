/**
 * @fileoverview Zod validation schema for User upsert operations.
 * Based on Security team's schema spec (Security-Zod-fixes.md section 2).
 *
 * SECURITY: The withAuth() HOC calls verifyAuth() for authentication.
 * Each action must also call requireRole() for authorization.
 * The schema uses .passthrough() for system-managed fields (notifications, etc.).
 * Fields like role, approved, isDelegatedAdmin, isPrimaryConservatoriumAdmin
 * are accepted by the schema but can only be changed by admin-level actions
 * guarded by requireRole().
 */
import { z } from 'zod';

const UserRoleSchema = z.enum([
  'student', 'teacher', 'parent', 'conservatorium_admin',
  'delegated_admin', 'site_admin', 'ministry_director',
  'admin', 'superadmin', 'school_coordinator',
]);

const InstrumentInfoSchema = z.object({
  instrument: z.string().min(1),
  teacherName: z.string(),
  yearsOfStudy: z.number().int().min(0).max(30),
}).passthrough();

const WeeklyAvailabilityBlockSchema = z.object({
  dayOfWeek: z.enum(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const UserUpsertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  idNumber: z.string().max(20).optional(),
  role: UserRoleSchema,
  conservatoriumId: z.string().min(1),
  conservatoriumName: z.string().min(1),
  branchId: z.string().optional(),
  conservatoriumStudyYears: z.number().int().min(0).max(30).optional(),
  instruments: z.array(InstrumentInfoSchema).optional(),
  avatarUrl: z.string().optional(),
  schoolName: z.string().optional(),
  schoolSymbol: z.string().optional(),
  birthDate: z.string().optional(),
  enrollmentDate: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  approved: z.boolean(),
  rejectionReason: z.string().max(1000).optional(),
  dateOfBirth: z.string().optional(),
  parentId: z.string().optional(),
  childIds: z.array(z.string()).optional(),
  students: z.array(z.string()).optional(),
  grade: z.string().optional(),

  // Teacher-specific fields
  bio: z.string().max(5000).optional(),
  videoUrl: z.string().optional(),
  education: z.array(z.string()).optional(),
  performanceCredits: z.array(z.string()).optional(),
  teachingPhilosophy: z.object({
    he: z.string().optional(),
    en: z.string().optional(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }).optional(),
  availableForNewStudents: z.boolean().optional(),
  lessonDurationsOffered: z.array(z.number().int().min(15).max(180)).optional(),
  specialties: z.array(z.enum([
    'EXAM_PREP', 'EARLY_CHILDHOOD', 'PERFORMANCE', 'JAZZ',
    'THEORY', 'SPECIAL_NEEDS', 'BEGINNER_ADULTS', 'COMPETITION', 'ENSEMBLE',
  ])).optional(),
  teachingLanguages: z.array(z.enum(['HE', 'EN', 'AR', 'RU'])).optional(),
  availability: z.array(WeeklyAvailabilityBlockSchema).optional(),
  maxStudents: z.number().int().min(0).max(200).optional(),
  teacherRatingAvg: z.number().min(0).max(5).optional(),
  teacherRatingCount: z.number().int().min(0).optional(),
  employmentType: z.enum(['EMPLOYEE', 'FREELANCE']).optional(),
  ratePerDuration: z.object({
    '30': z.number().min(0),
    '45': z.number().min(0),
    '60': z.number().min(0),
  }).optional(),

  // Student-specific fields
  weeklyPracticeGoal: z.number().int().min(0).max(600).optional(),
  packageId: z.string().optional(),
  hasSeenWalkthrough: z.boolean().optional(),
  isRegistered: z.boolean().optional(),

  accountType: z.enum(['FULL', 'PLAYING_SCHOOL', 'TRIAL']).optional(),
  isDelegatedAdmin: z.boolean().optional(),
  delegatedAdminPermissions: z.array(z.string()).optional(),
  isPrimaryConservatoriumAdmin: z.boolean().optional(),
  registrationSource: z.enum(['email', 'google', 'microsoft', 'admin_created']).optional(),
  status: z.enum(['active', 'graduated', 'inactive']).optional(),
  graduationYear: z.number().int().min(1900).max(2100).optional(),

  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
}).passthrough();
// .passthrough() allows system-managed fields (notifications, achievements, gamification, etc.)

export type UserUpsertInput = z.infer<typeof UserUpsertSchema>;
