import {
  compositions,
  conservatoriums,
  mockAlumni,
  mockAnnouncements,
  mockAuditLog,
  mockBranches,
  mockConservatoriumInstruments,
  mockDonationCauses,
  mockDonations,
  mockEvents,
  mockFormSubmissions,
  mockFormTemplates,
  mockInstrumentInventory,
  mockInvoices,
  mockLessonNotes,
  mockLessonPackages,
  mockLessons,
  mockMakeupCredits,
  mockMasterclasses,
  mockMessageThreads,
  mockOpenDayAppointments,
  mockOpenDayEvents,
  mockPackages,
  mockPayrolls,
  mockPerformanceBookings,
  mockPracticeLogs,
  mockPracticeVideos,
  mockProgressReports,
  mockRooms,
  mockScholarshipApplications,
  mockUsers,
  mockWaitlist,
  mockAssignedRepertoire,
} from '@/lib/data';
import type { RepertoireEntry } from '@/lib/db/types';
import type { MemorySeed } from '@/lib/db/adapters/shared';

export type MockBootstrapExtras = {
  packages: unknown[];
  invoices: unknown[];
  practiceLogs: unknown[];
  assignedRepertoire: unknown[];
  lessonNotes: unknown[];
  messageThreads: unknown[];
  progressReports: unknown[];
  formTemplates: unknown[];
  auditLog: unknown[];
  instrumentInventory: unknown[];
  performanceBookings: unknown[];
  openDayEvents: unknown[];
  openDayAppointments: unknown[];
  practiceVideos: unknown[];
  waitlist: unknown[];
  makeupCredits: unknown[];
  playingSchoolInvoices: unknown[];
  masterClassAllowances: unknown[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildDefaultMemorySeed(): MemorySeed {
  return {
    users: clone(mockUsers),
    conservatoriums: clone(conservatoriums),
    conservatoriumInstruments: clone(mockConservatoriumInstruments || []),
    lessonPackages: clone(mockLessonPackages || []),
    lessons: clone(mockLessons),
    branches: clone(mockBranches || []),
    rooms: clone(mockRooms),
    events: clone(mockEvents),
    forms: clone(mockFormSubmissions),
    scholarships: clone(mockScholarshipApplications || []),
    rentals: [],
    payments: clone(mockInvoices),
    payrolls: clone(mockPayrolls),
    announcements: clone(mockAnnouncements),
    alumni: clone(mockAlumni),
    masterClasses: clone(mockMasterclasses),
    repertoire: clone(compositions).map((item, index) => ({
      ...item,
      id: item.id ?? `comp-${index + 1}`,
    })) as RepertoireEntry[],
    donationCauses: clone(mockDonationCauses || []),
    donations: clone(mockDonations || []),
    makeupCredits: [],
    practiceLogs: [],
    notifications: [],
    roomLocks: [],
    teacherExceptions: [],
    consentRecords: [],
    complianceLogs: [],
  };
}

export function getMockBootstrapExtras(): MockBootstrapExtras {
  return {
    packages: clone(mockPackages || []),
    invoices: clone(mockInvoices || []),
    practiceLogs: clone(mockPracticeLogs || []),
    assignedRepertoire: clone(mockAssignedRepertoire || []),
    lessonNotes: clone(mockLessonNotes || []),
    messageThreads: clone(mockMessageThreads || []),
    progressReports: clone(mockProgressReports || []),
    formTemplates: clone(mockFormTemplates || []),
    auditLog: clone(mockAuditLog || []),
    instrumentInventory: clone(mockInstrumentInventory || []),
    performanceBookings: clone(mockPerformanceBookings || []),
    openDayEvents: clone(mockOpenDayEvents || []),
    openDayAppointments: clone(mockOpenDayAppointments || []),
    practiceVideos: clone(mockPracticeVideos || []),
    waitlist: clone(mockWaitlist || []),
    makeupCredits: clone(mockMakeupCredits || []),
    playingSchoolInvoices: [],
    masterClassAllowances: [],
  };
}
