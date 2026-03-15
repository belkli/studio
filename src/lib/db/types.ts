import type {
  Achievement,
  Alumnus,
  Announcement,
  Branch,
  ComplianceLog,
  ConsentRecord,
  Conservatorium,
  ConservatoriumInstrument,
  EventProduction,
  FormSubmission,
  Invoice,
  LessonPackage,
  LessonSlot,
  Composition,
  DonationCause,
  DonationRecord,
  MakeupCredit,
  Masterclass,
  Notification,
  PayrollSummary,
  PracticeLog,
  Room,
  RoomLock,
  ScholarshipApplication,
  TeacherException,
  User,
  WaitlistEntry,
} from '@/lib/types';

export type DbEntity = {
  id: string;
  conservatoriumId?: string | null;
};

export type RentalRecord = DbEntity & Record<string, unknown>;
export type RepertoireEntry = Omit<Composition, 'id'> & DbEntity;

export interface ScopedRepository<T extends DbEntity> {
  findById(id: string): Promise<T | null>;
  findByConservatorium(conservatoriumId: string): Promise<T[]>;
  list(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export type CreateUserInput = Partial<User> & {
  email: string;
  name: string;
  role: User['role'];
  conservatoriumId: string;
  conservatoriumName: string;
};

export interface UserRepository extends ScopedRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  search(query: string, conservatoriumId?: string): Promise<User[]>;
}

export interface ConservatoriumRepository extends ScopedRepository<Conservatorium> {}
export interface ConservatoriumInstrumentRepository extends ScopedRepository<ConservatoriumInstrument> {}
export interface LessonPackageRepository extends ScopedRepository<LessonPackage> {}
export interface LessonRepository extends ScopedRepository<LessonSlot> {}
export interface RoomRepository extends ScopedRepository<Room> {}
export interface BranchRepository extends ScopedRepository<Branch> {}
export interface EventRepository extends ScopedRepository<EventProduction> {}
export interface FormRepository extends ScopedRepository<FormSubmission> {}

export interface ApprovalRepository extends ScopedRepository<FormSubmission> {
  findPending(conservatoriumId?: string): Promise<FormSubmission[]>;
}

export interface ScholarshipRepository extends ScopedRepository<ScholarshipApplication> {}
export interface RentalRepository extends ScopedRepository<RentalRecord> {}
export interface PaymentRepository extends ScopedRepository<Invoice> {}
export interface PayrollRepository extends ScopedRepository<PayrollSummary> {}
export interface AnnouncementRepository extends ScopedRepository<Announcement> {}
export interface AlumniRepository extends ScopedRepository<Alumnus> {}
export interface MasterClassRepository extends ScopedRepository<Masterclass> {}
export interface RepertoireRepository extends ScopedRepository<RepertoireEntry> {}
export interface DonationCauseRepository extends ScopedRepository<DonationCause> {}
export interface DonationRepository extends ScopedRepository<DonationRecord> {}

// ── New repositories (DBA gap analysis) ──────────────────────

export interface MakeupCreditRepository extends ScopedRepository<MakeupCredit> {}
export interface PracticeLogRepository extends ScopedRepository<PracticeLog> {}
export interface NotificationRepository extends ScopedRepository<Notification> {
  findByUser(userId: string, conservatoriumId?: string): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
}
export interface RoomLockRepository extends ScopedRepository<RoomLock> {}
export interface TeacherExceptionRepository extends ScopedRepository<TeacherException> {}
export interface ConsentRecordRepository extends ScopedRepository<ConsentRecord> {}
export interface ComplianceLogRepository extends ScopedRepository<ComplianceLog> {}

export interface WaitlistEntryRepository {
  findByConservatorium(conservatoriumId: string): Promise<WaitlistEntry[]>;
  findById(entryId: string): Promise<WaitlistEntry | null>;
  update(entryId: string, data: Partial<WaitlistEntry>): Promise<void>;
  /**
   * Atomic compare-and-swap acceptance (BLOCKING-SEC-02).
   *
   * Transitions status from OFFERED -> ACCEPTED only if:
   *   - The entry currently has status === 'OFFERED'
   *   - The offer has not expired (offerExpiresAt > now)
   *
   * Uses an optimistic-locking / mutex pattern to prevent double-booking
   * when concurrent requests attempt to accept the same offer simultaneously.
   *
   * @throws Error('CONFLICT')     — entry is not in OFFERED state
   * @throws Error('OFFER_EXPIRED') — offerExpiresAt has passed
   * @throws Error('NOT_FOUND')    — entryId does not exist
   */
  acceptOffer(entryId: string): Promise<WaitlistEntry>;
}

export interface AchievementRepository {
  create(data: Omit<Achievement, 'id'>): Promise<Achievement>;
  findByStudentId(studentId: string): Promise<Achievement[]>;
}

export interface DatabaseAdapter {
  users: UserRepository;
  conservatoriums: ConservatoriumRepository;
  conservatoriumInstruments: ConservatoriumInstrumentRepository;
  lessonPackages: LessonPackageRepository;
  lessons: LessonRepository;
  branches: BranchRepository;
  rooms: RoomRepository;
  events: EventRepository;
  forms: FormRepository;
  approvals: ApprovalRepository;
  scholarships: ScholarshipRepository;
  rentals: RentalRepository;
  payments: PaymentRepository;
  payrolls: PayrollRepository;
  announcements: AnnouncementRepository;
  alumni: AlumniRepository;
  masterClasses: MasterClassRepository;
  repertoire: RepertoireRepository;
  donationCauses: DonationCauseRepository;
  donations: DonationRepository;

  // New repositories (DBA gap analysis — 7 missing collections)
  makeupCredits: MakeupCreditRepository;       // /conservatoriums/{cid}/makeupCredits — write:false (Cloud Functions only)
  practiceLogs: PracticeLogRepository;          // /conservatoriums/{cid}/practiceLogs — student create, teacher comment
  notifications: NotificationRepository;        // /conservatoriums/{cid}/notifications — Cloud Functions create, user reads own
  roomLocks: RoomLockRepository;                // /conservatoriums/{cid}/roomLocks — write:false (transactional Cloud Functions only)
  teacherExceptions: TeacherExceptionRepository; // /conservatoriums/{cid}/teacherExceptions — teacher creates own
  consentRecords: ConsentRecordRepository;      // /consentRecords/{id} — TOP-LEVEL, immutable after creation
  complianceLogs: ComplianceLogRepository;      // /conservatoriums/{cid}/complianceLogs — write:false (append-only Cloud Functions)
  waitlist: WaitlistEntryRepository;              // /conservatoriums/{cid}/waitlist
  achievements: AchievementRepository;            // /conservatoriums/{cid}/achievements
}



