import { buildDefaultMemorySeed } from '@/lib/db/default-memory-seed';
import type {
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
} from '@/lib/types';
import type {
  AlumniRepository,
  AnnouncementRepository,
  ApprovalRepository,
  BranchRepository,
  ComplianceLogRepository,
  ConsentRecordRepository,
  ConservatoriumRepository,
  ConservatoriumInstrumentRepository,
  DatabaseAdapter,
  EventRepository,
  FormRepository,
  LessonPackageRepository,
  LessonRepository,
  MakeupCreditRepository,
  MasterClassRepository,
  NotificationRepository,
  PracticeLogRepository,
  RepertoireEntry,
  RepertoireRepository,
  DonationCauseRepository,
  DonationRepository,
  PaymentRepository,
  PayrollRepository,
  RentalRecord,
  RentalRepository,
  RoomLockRepository,
  RoomRepository,
  ScholarshipRepository,
  ScopedRepository,
  TeacherExceptionRepository,
  UserRepository,
} from '@/lib/db/types';

type Entity = { id: string; conservatoriumId?: string | null };

export type MemorySeed = {
  users: User[];
  conservatoriums: Conservatorium[];
  conservatoriumInstruments: ConservatoriumInstrument[];
  lessonPackages: LessonPackage[];
  lessons: LessonSlot[];
  branches: Branch[];
  rooms: Room[];
  events: EventProduction[];
  forms: FormSubmission[];
  scholarships: ScholarshipApplication[];
  rentals: RentalRecord[];
  payments: Invoice[];
  payrolls: PayrollSummary[];
  announcements: Announcement[];
  alumni: Alumnus[];
  masterClasses: Masterclass[];
  repertoire: RepertoireEntry[];
  donationCauses: DonationCause[];
  donations: DonationRecord[];
  makeupCredits: MakeupCredit[];
  practiceLogs: PracticeLog[];
  notifications: Notification[];
  roomLocks: RoomLock[];
  teacherExceptions: TeacherException[];
  consentRecords: ConsentRecord[];
  complianceLogs: ComplianceLog[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createId(prefix = 'rec'): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function hasConservatoriumId(value: unknown): value is { conservatoriumId?: string | null } {
  return typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, 'conservatoriumId');
}

function createScopedRepository<T extends Entity>(
  initial: T[],
  idPrefix: string
): ScopedRepository<T> {
  const state = clone(initial);

  return {
    async findById(id: string): Promise<T | null> {
      const found = state.find((item) => item.id === id);
      return found ? clone(found) : null;
    },
    async findByConservatorium(conservatoriumId: string): Promise<T[]> {
      return clone(
        state.filter((item) => hasConservatoriumId(item) && item.conservatoriumId === conservatoriumId)
      );
    },
    async list(): Promise<T[]> {
      return clone(state);
    },
    async create(data: Partial<T>): Promise<T> {
      const record = { ...data, id: data.id ?? createId(idPrefix) } as T;
      state.push(clone(record));
      return clone(record);
    },
    async update(id: string, data: Partial<T>): Promise<T> {
      const index = state.findIndex((item) => item.id === id);
      if (index < 0) {
        throw new Error(`${idPrefix} not found: ${id}`);
      }
      state[index] = { ...state[index], ...clone(data) };
      return clone(state[index]);
    },
    async delete(id: string): Promise<void> {
      const index = state.findIndex((item) => item.id === id);
      if (index < 0) {
        return;
      }
      state.splice(index, 1);
    },
  };
}

function createUserRepository(initial: User[]): UserRepository {
  const repo = createScopedRepository<User>(initial, 'usr');

  return {
    ...repo,
    async findByEmail(email: string): Promise<User | null> {
      const users = await repo.list();
      const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      return found ?? null;
    },
    async search(query: string, conservatoriumId?: string): Promise<User[]> {
      const users = await repo.list();
      const normalized = query.trim().toLowerCase();

      return users.filter((user) => {
        if (conservatoriumId && user.conservatoriumId !== conservatoriumId) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return (
          user.name.toLowerCase().includes(normalized) ||
          user.email.toLowerCase().includes(normalized)
        );
      });
    },
  };
}

function createConservatoriumRepository(initial: Conservatorium[]): ConservatoriumRepository {
  const state = clone(initial);

  return {
    async findById(id: string): Promise<Conservatorium | null> {
      const found = state.find((item) => item.id === id);
      return found ? clone(found) : null;
    },
    async findByConservatorium(conservatoriumId: string): Promise<Conservatorium[]> {
      return clone(state.filter((item) => item.id === conservatoriumId));
    },
    async list(): Promise<Conservatorium[]> {
      return clone(state);
    },
    async create(data: Partial<Conservatorium>): Promise<Conservatorium> {
      const record = { ...data, id: data.id ?? createId('cons') } as Conservatorium;
      state.push(clone(record));
      return clone(record);
    },
    async update(id: string, data: Partial<Conservatorium>): Promise<Conservatorium> {
      const index = state.findIndex((item) => item.id === id);
      if (index < 0) {
        throw new Error(`conservatorium not found: ${id}`);
      }
      state[index] = { ...state[index], ...clone(data) };
      return clone(state[index]);
    },
    async delete(id: string): Promise<void> {
      const index = state.findIndex((item) => item.id === id);
      if (index < 0) {
        return;
      }
      state.splice(index, 1);
    },
  };
}

function createFormRepositories(
  initial: FormSubmission[]
): { forms: FormRepository; approvals: ApprovalRepository } {
  const forms = createScopedRepository<FormSubmission>(initial, 'form');

  const approvals: ApprovalRepository = {
    ...forms,
    async findPending(conservatoriumId?: string): Promise<FormSubmission[]> {
      const pendingStatuses = new Set(['PENDING', 'PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED']);
      const all = await forms.list();
      return all.filter((form) => {
        if (conservatoriumId && form.conservatoriumId !== conservatoriumId) {
          return false;
        }
        return pendingStatuses.has(form.status);
      });
    },
  };

  return { forms, approvals };
}

export class MemoryDatabaseAdapter implements DatabaseAdapter {
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
  makeupCredits: MakeupCreditRepository;
  practiceLogs: PracticeLogRepository;
  notifications: NotificationRepository;
  roomLocks: RoomLockRepository;
  teacherExceptions: TeacherExceptionRepository;
  consentRecords: ConsentRecordRepository;
  complianceLogs: ComplianceLogRepository;

  constructor(seed: MemorySeed) {
    this.users = createUserRepository(seed.users);
    this.conservatoriums = createConservatoriumRepository(seed.conservatoriums);
    this.conservatoriumInstruments = createScopedRepository<ConservatoriumInstrument>(seed.conservatoriumInstruments, 'cinst');
    this.lessonPackages = createScopedRepository<LessonPackage>(seed.lessonPackages, 'lpkg');
    this.lessons = createScopedRepository<LessonSlot>(seed.lessons, 'lesson');
    this.branches = createScopedRepository<Branch>(seed.branches, 'branch');
    this.rooms = createScopedRepository<Room>(seed.rooms, 'room');
    this.events = createScopedRepository<EventProduction>(seed.events, 'event');

    const formRepos = createFormRepositories(seed.forms);
    this.forms = formRepos.forms;
    this.approvals = formRepos.approvals;

    this.scholarships = createScopedRepository<ScholarshipApplication>(seed.scholarships, 'scholar');
    this.rentals = createScopedRepository<RentalRecord>(seed.rentals, 'rental');
    this.payments = createScopedRepository<Invoice>(seed.payments, 'payment');
    this.payrolls = createScopedRepository<PayrollSummary>(seed.payrolls, 'payroll');
    this.announcements = createScopedRepository<Announcement>(seed.announcements, 'announce');
    this.alumni = createScopedRepository<Alumnus>(seed.alumni, 'alumni');
    this.masterClasses = createScopedRepository<Masterclass>(seed.masterClasses, 'mc');
    this.repertoire = createScopedRepository<RepertoireEntry>(seed.repertoire, 'repr');
    this.donationCauses = createScopedRepository<DonationCause>(seed.donationCauses, 'dcause');
    this.donations = createScopedRepository<DonationRecord>(seed.donations, 'donation');

    // New repositories (DBA gap analysis)
    this.makeupCredits = createScopedRepository<MakeupCredit>(seed.makeupCredits, 'mkup');
    this.practiceLogs = createScopedRepository<PracticeLog>(seed.practiceLogs, 'plog');
    this.roomLocks = createScopedRepository<RoomLock>(seed.roomLocks, 'rlock');
    this.teacherExceptions = createScopedRepository<TeacherException>(seed.teacherExceptions, 'texc');
    this.consentRecords = createScopedRepository<ConsentRecord>(seed.consentRecords, 'consent');
    this.complianceLogs = createScopedRepository<ComplianceLog>(seed.complianceLogs, 'clog');

    // NotificationRepository has extra methods
    const notifBase = createScopedRepository<Notification>(seed.notifications, 'notif');
    this.notifications = {
      ...notifBase,
      async findByUser(userId: string, conservatoriumId?: string): Promise<Notification[]> {
        const all = await notifBase.list();
        return all.filter(n => {
          if (n.userId !== userId) return false;
          if (conservatoriumId && hasConservatoriumId(n) && n.conservatoriumId !== conservatoriumId) return false;
          return true;
        });
      },
      async markRead(id: string): Promise<void> {
        await notifBase.update(id, { read: true } as Partial<Notification>);
      },
    };
  }
}

export function buildDefaultSeed(): MemorySeed {
  return buildDefaultMemorySeed();
}




