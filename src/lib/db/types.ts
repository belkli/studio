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

export type DbEntity = {
  id: string;
  conservatoriumId?: string | null;
};

export type RentalRecord = DbEntity & Record<string, unknown>;

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
export interface LessonRepository extends ScopedRepository<LessonSlot> {}
export interface RoomRepository extends ScopedRepository<Room> {}
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

export interface DatabaseAdapter {
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
}
