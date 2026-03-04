import {
  conservatoriums,
  mockAlumni,
  mockAnnouncements,
  mockEvents,
  mockFormSubmissions,
  mockInvoices,
  mockLessons,
  mockMasterclasses,
  mockPayrolls,
  mockRooms,
  mockScholarshipApplications,
  mockUsers,
} from '@/lib/data';
import type {
  Alumnus,
  Announcement,
  Conservatorium,
  EventProduction,
  FormSubmission,
  Invoice,
  LessonSlot,
  Masterclass,
  PayrollSummary,
  Room,
  ScholarshipApplication,
  User,
} from '@/lib/types';
import type {
  AlumniRepository,
  AnnouncementRepository,
  ApprovalRepository,
  ConservatoriumRepository,
  DatabaseAdapter,
  EventRepository,
  FormRepository,
  LessonRepository,
  MasterClassRepository,
  PaymentRepository,
  PayrollRepository,
  RentalRecord,
  RentalRepository,
  RoomRepository,
  ScholarshipRepository,
  ScopedRepository,
  UserRepository,
} from '@/lib/db/types';

type Entity = { id: string; conservatoriumId?: string | null };

export type MemorySeed = {
  users: User[];
  conservatoriums: Conservatorium[];
  lessons: LessonSlot[];
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
  lessons: LessonRepository;
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

  constructor(seed: MemorySeed) {
    this.users = createUserRepository(seed.users);
    this.conservatoriums = createConservatoriumRepository(seed.conservatoriums);
    this.lessons = createScopedRepository<LessonSlot>(seed.lessons, 'lesson');
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
  }
}

export function buildDefaultSeed(): MemorySeed {
  return {
    users: clone(mockUsers),
    conservatoriums: clone(conservatoriums),
    lessons: clone(mockLessons),
    rooms: clone(mockRooms),
    events: clone(mockEvents),
    forms: clone(mockFormSubmissions),
    scholarships: clone(mockScholarshipApplications as ScholarshipApplication[]),
    rentals: [],
    payments: clone(mockInvoices),
    payrolls: clone(mockPayrolls),
    announcements: clone(mockAnnouncements),
    alumni: clone(mockAlumni),
    masterClasses: clone(mockMasterclasses),
  };
}
