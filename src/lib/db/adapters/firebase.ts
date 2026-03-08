/**
 * @fileoverview Production Firestore adapter implementing the full DatabaseAdapter interface.
 *
 * Collection path mapping:
 *   Root collections:
 *     - users → /users/{id}
 *     - conservatoriums → /conservatoriums/{id}
 *
 *   Per-conservatorium sub-collections (under /conservatoriums/{cid}/):
 *     - lessons → lessonSlots/{id}
 *     - rooms → rooms/{id}
 *     - branches → branches/{id}  (also root-queryable via collectionGroup)
 *     - events → events/{id}
 *     - forms → formSubmissions/{id}
 *     - scholarships → scholarshipApplications/{id}
 *     - rentals → instrumentCheckouts/{id}
 *     - payments → invoices/{id}
 *     - payrolls → payrollPeriods/{id}
 *     - announcements → announcements/{id}
 *     - alumni → alumni/{id}
 *     - masterClasses → masterclasses/{id}
 *     - repertoire → assignedRepertoire/{id}
 *     - donationCauses → donationCauses/{id}
 *     - donations → donationRecords/{id}
 *     - conservatoriumInstruments → conservatoriumInstruments/{id}
 *     - lessonPackages → lessonPackages/{id}
 *     - packages → packages/{id}
 *     - makeupCredits → makeupCredits/{id}
 *     - practiceLogs → practiceLogs/{id}
 *
 * When FIREBASE_SERVICE_ACCOUNT_KEY is not set, falls back to MemoryDatabaseAdapter
 * with a console warning. This enables local development without Firebase credentials.
 */
import { getAdminFirestore } from '@/lib/firebase-admin';
import { buildDefaultSeed, MemoryDatabaseAdapter } from './shared';
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
  DbEntity,
  EventRepository,
  FormRepository,
  LessonPackageRepository,
  LessonRepository,
  MakeupCreditRepository,
  MasterClassRepository,
  NotificationRepository,
  PaymentRepository,
  PayrollRepository,
  PracticeLogRepository,
  RentalRecord,
  RentalRepository,
  RepertoireEntry,
  RepertoireRepository,
  RoomLockRepository,
  RoomRepository,
  ScholarshipRepository,
  ScopedRepository,
  TeacherExceptionRepository,
  DonationCauseRepository,
  DonationRepository,
  UserRepository,
} from '@/lib/db/types';
import type { Firestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

/** Convert Firestore Timestamps to ISO strings recursively. */
function normalizeDoc<T>(data: Record<string, unknown>, id: string): T {
  const result: Record<string, unknown> = { ...data, id };
  for (const [key, value] of Object.entries(result)) {
    if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    }
  }
  return result as T;
}

/** Strip `undefined` values from an object before writing to Firestore. */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Generic repository for ROOT-level collections (users, conservatoriums)
// ---------------------------------------------------------------------------

function createRootRepository<T extends DbEntity>(
  db: Firestore,
  collectionName: string,
): ScopedRepository<T> {
  const col = () => db.collection(collectionName);

  return {
    async findById(id: string): Promise<T | null> {
      const snap = await col().doc(id).get();
      if (!snap.exists) return null;
      return normalizeDoc<T>(snap.data()!, snap.id);
    },

    async findByConservatorium(conservatoriumId: string): Promise<T[]> {
      const snap = await col().where('conservatoriumId', '==', conservatoriumId).get();
      return snap.docs.map((d) => normalizeDoc<T>(d.data(), d.id));
    },

    async list(): Promise<T[]> {
      const snap = await col().get();
      return snap.docs.map((d) => normalizeDoc<T>(d.data(), d.id));
    },

    async create(data: Partial<T>): Promise<T> {
      const ref = data.id ? col().doc(data.id as string) : col().doc();
      const record = stripUndefined({ ...data, id: ref.id } as Record<string, unknown>);
      await ref.set(record);
      return { ...record, id: ref.id } as T;
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const ref = col().doc(id);
      const cleaned = stripUndefined(data as Record<string, unknown>);
      delete cleaned.id; // never overwrite the document ID field
      await ref.update(cleaned);
      const updated = await ref.get();
      if (!updated.exists) throw new Error(`${collectionName} not found: ${id}`);
      return normalizeDoc<T>(updated.data()!, updated.id);
    },

    async delete(id: string): Promise<void> {
      await col().doc(id).delete();
    },
  };
}

// ---------------------------------------------------------------------------
// Generic repository for PER-CONSERVATORIUM sub-collections
// ---------------------------------------------------------------------------

function createSubCollectionRepository<T extends DbEntity>(
  db: Firestore,
  subCollectionName: string,
): ScopedRepository<T> {
  const parentCol = 'conservatoriums';

  function subCol(cid: string) {
    return db.collection(parentCol).doc(cid).collection(subCollectionName);
  }

  return {
    async findById(id: string): Promise<T | null> {
      // Sub-collection docs require knowing the parent conservatoriumId.
      // Use collectionGroup query to find by ID across all conservatoriums.
      const snap = await db.collectionGroup(subCollectionName)
        .where('id', '==', id)
        .limit(1)
        .get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return normalizeDoc<T>(doc.data(), doc.id);
    },

    async findByConservatorium(conservatoriumId: string): Promise<T[]> {
      const snap = await subCol(conservatoriumId).get();
      return snap.docs.map((d) => normalizeDoc<T>(d.data(), d.id));
    },

    async list(): Promise<T[]> {
      // Collection group query across ALL conservatoriums
      const snap = await db.collectionGroup(subCollectionName).get();
      return snap.docs.map((d) => normalizeDoc<T>(d.data(), d.id));
    },

    async create(data: Partial<T>): Promise<T> {
      const cid = (data as Partial<DbEntity>).conservatoriumId;
      if (!cid) {
        throw new Error(`Cannot create ${subCollectionName} without conservatoriumId`);
      }
      const col = subCol(cid);
      const ref = data.id ? col.doc(data.id as string) : col.doc();
      const record = stripUndefined({ ...data, id: ref.id } as Record<string, unknown>);
      await ref.set(record);
      return { ...record, id: ref.id } as T;
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      // Find the document first to get its conservatoriumId
      const existing = await this.findById(id);
      if (!existing) throw new Error(`${subCollectionName} not found: ${id}`);
      const cid = (existing as DbEntity).conservatoriumId;
      if (!cid) throw new Error(`${subCollectionName} ${id} has no conservatoriumId`);
      const ref = subCol(cid).doc(id);
      const cleaned = stripUndefined(data as Record<string, unknown>);
      delete cleaned.id;
      await ref.update(cleaned);
      const updated = await ref.get();
      return normalizeDoc<T>(updated.data()!, updated.id);
    },

    async delete(id: string): Promise<void> {
      const existing = await this.findById(id);
      if (!existing) return;
      const cid = (existing as DbEntity).conservatoriumId;
      if (!cid) return;
      await subCol(cid).doc(id).delete();
    },
  };
}

// ---------------------------------------------------------------------------
// Specialized repositories
// ---------------------------------------------------------------------------

function createFirestoreUserRepository(db: Firestore): UserRepository {
  const base = createRootRepository<User>(db, 'users');

  return {
    ...base,

    async findByEmail(email: string): Promise<User | null> {
      const snap = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return normalizeDoc<User>(doc.data(), doc.id);
    },

    async search(query: string, conservatoriumId?: string): Promise<User[]> {
      // Firestore doesn't support full-text search natively.
      // For production, this should use Algolia/Typesense or a Cloud Function.
      // Fallback: fetch by conservatorium and filter in-memory.
      let users: User[];
      if (conservatoriumId) {
        users = await base.findByConservatorium(conservatoriumId);
      } else {
        users = await base.list();
      }
      if (!query.trim()) return users;
      const normalized = query.trim().toLowerCase();
      return users.filter(
        (u) =>
          u.name.toLowerCase().includes(normalized) ||
          u.email.toLowerCase().includes(normalized),
      );
    },
  };
}

function createFirestoreConservatoriumRepository(db: Firestore): ConservatoriumRepository {
  const col = () => db.collection('conservatoriums');

  return {
    async findById(id: string): Promise<Conservatorium | null> {
      const snap = await col().doc(id).get();
      if (!snap.exists) return null;
      return normalizeDoc<Conservatorium>(snap.data()!, snap.id);
    },

    async findByConservatorium(conservatoriumId: string): Promise<Conservatorium[]> {
      // A conservatorium "finds itself"
      const result = await this.findById(conservatoriumId);
      return result ? [result] : [];
    },

    async list(): Promise<Conservatorium[]> {
      const snap = await col().get();
      return snap.docs.map((d) => normalizeDoc<Conservatorium>(d.data(), d.id));
    },

    async create(data: Partial<Conservatorium>): Promise<Conservatorium> {
      const ref = data.id ? col().doc(data.id) : col().doc();
      const record = stripUndefined({ ...data, id: ref.id } as Record<string, unknown>);
      await ref.set(record);
      return { ...record, id: ref.id } as Conservatorium;
    },

    async update(id: string, data: Partial<Conservatorium>): Promise<Conservatorium> {
      const ref = col().doc(id);
      const cleaned = stripUndefined(data as Record<string, unknown>);
      delete cleaned.id;
      await ref.update(cleaned);
      const updated = await ref.get();
      if (!updated.exists) throw new Error(`conservatorium not found: ${id}`);
      return normalizeDoc<Conservatorium>(updated.data()!, updated.id);
    },

    async delete(id: string): Promise<void> {
      await col().doc(id).delete();
    },
  };
}

function createFirestoreFormRepositories(
  db: Firestore,
): { forms: FormRepository; approvals: ApprovalRepository } {
  const forms = createSubCollectionRepository<FormSubmission>(db, 'formSubmissions');

  const approvals: ApprovalRepository = {
    ...forms,

    async findPending(conservatoriumId?: string): Promise<FormSubmission[]> {
      const pendingStatuses = ['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'];

      if (conservatoriumId) {
        const col = db.collection('conservatoriums').doc(conservatoriumId)
          .collection('formSubmissions');
        const snap = await col.where('status', 'in', pendingStatuses).get();
        return snap.docs.map((d) => normalizeDoc<FormSubmission>(d.data(), d.id));
      }

      // Cross-conservatorium: collection group query
      const snap = await db.collectionGroup('formSubmissions')
        .where('status', 'in', pendingStatuses)
        .get();
      return snap.docs.map((d) => normalizeDoc<FormSubmission>(d.data(), d.id));
    },
  };

  return { forms, approvals };
}

// ---------------------------------------------------------------------------
// FirebaseAdapter — main export
// ---------------------------------------------------------------------------

export class FirebaseAdapter implements DatabaseAdapter {
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

  /** Indicates whether this adapter is backed by real Firestore or a memory fallback. */
  readonly source: 'firestore' | 'memory-fallback';
  readonly fallbackReason: string;

  constructor() {
    const db = getAdminFirestore();

    if (!db) {
      // Graceful fallback: run with in-memory data when Firestore is not configured.
      // This allows `DB_BACKEND=firebase` to work in local dev without credentials.
      console.warn(
        '[FirebaseAdapter] Firestore not available (FIREBASE_SERVICE_ACCOUNT_KEY not set). ' +
        'Falling back to MemoryDatabaseAdapter with seed data. ' +
        'Set FIREBASE_SERVICE_ACCOUNT_KEY to use real Firestore.'
      );
      const fallback = new MemoryDatabaseAdapter(buildDefaultSeed());
      this.users = fallback.users;
      this.conservatoriums = fallback.conservatoriums;
      this.conservatoriumInstruments = fallback.conservatoriumInstruments;
      this.lessonPackages = fallback.lessonPackages;
      this.lessons = fallback.lessons;
      this.branches = fallback.branches;
      this.rooms = fallback.rooms;
      this.events = fallback.events;
      this.forms = fallback.forms;
      this.approvals = fallback.approvals;
      this.scholarships = fallback.scholarships;
      this.rentals = fallback.rentals;
      this.payments = fallback.payments;
      this.payrolls = fallback.payrolls;
      this.announcements = fallback.announcements;
      this.alumni = fallback.alumni;
      this.masterClasses = fallback.masterClasses;
      this.repertoire = fallback.repertoire;
      this.donationCauses = fallback.donationCauses;
      this.donations = fallback.donations;
      this.makeupCredits = fallback.makeupCredits;
      this.practiceLogs = fallback.practiceLogs;
      this.notifications = fallback.notifications;
      this.roomLocks = fallback.roomLocks;
      this.teacherExceptions = fallback.teacherExceptions;
      this.consentRecords = fallback.consentRecords;
      this.complianceLogs = fallback.complianceLogs;
      this.source = 'memory-fallback';
      this.fallbackReason = 'FIREBASE_SERVICE_ACCOUNT_KEY not set';
      return;
    }

    // ── Real Firestore implementation ──

    // Root collections
    this.users = createFirestoreUserRepository(db);
    this.conservatoriums = createFirestoreConservatoriumRepository(db);

    // Per-conservatorium sub-collections
    this.conservatoriumInstruments = createSubCollectionRepository<ConservatoriumInstrument>(db, 'conservatoriumInstruments');
    this.lessonPackages = createSubCollectionRepository<LessonPackage>(db, 'lessonPackages');
    this.lessons = createSubCollectionRepository<LessonSlot>(db, 'lessonSlots');
    this.branches = createSubCollectionRepository<Branch>(db, 'branches');
    this.rooms = createSubCollectionRepository<Room>(db, 'rooms');
    this.events = createSubCollectionRepository<EventProduction>(db, 'events');

    const formRepos = createFirestoreFormRepositories(db);
    this.forms = formRepos.forms;
    this.approvals = formRepos.approvals;

    this.scholarships = createSubCollectionRepository<ScholarshipApplication>(db, 'scholarshipApplications');
    this.rentals = createSubCollectionRepository<RentalRecord>(db, 'instrumentCheckouts');
    this.payments = createSubCollectionRepository<Invoice>(db, 'invoices');
    this.payrolls = createSubCollectionRepository<PayrollSummary>(db, 'payrollPeriods');
    this.announcements = createSubCollectionRepository<Announcement>(db, 'announcements');
    this.alumni = createSubCollectionRepository<Alumnus>(db, 'alumni');
    this.masterClasses = createSubCollectionRepository<Masterclass>(db, 'masterclasses');
    this.repertoire = createSubCollectionRepository<RepertoireEntry>(db, 'assignedRepertoire');
    this.donationCauses = createSubCollectionRepository<DonationCause>(db, 'donationCauses');
    this.donations = createSubCollectionRepository<DonationRecord>(db, 'donationRecords');

    // New repositories (DBA gap analysis)
    this.makeupCredits = createSubCollectionRepository<MakeupCredit>(db, 'makeupCredits');
    this.practiceLogs = createSubCollectionRepository<PracticeLog>(db, 'practiceLogs');
    this.roomLocks = createSubCollectionRepository<RoomLock>(db, 'roomLocks');
    this.teacherExceptions = createSubCollectionRepository<TeacherException>(db, 'teacherExceptions');
    this.complianceLogs = createSubCollectionRepository<ComplianceLog>(db, 'complianceLogs');

    // consentRecords is TOP-LEVEL (not per-conservatorium) — PDPPA immutable records
    this.consentRecords = createRootRepository<ConsentRecord>(db, 'consentRecords');

    // NotificationRepository has extra methods (findByUser, markRead)
    const notifBase = createSubCollectionRepository<Notification>(db, 'notifications');
    this.notifications = {
      ...notifBase,
      async findByUser(userId: string, conservatoriumId?: string): Promise<Notification[]> {
        if (conservatoriumId) {
          const col = db.collection('conservatoriums').doc(conservatoriumId).collection('notifications');
          const snap = await col.where('userId', '==', userId).get();
          return snap.docs.map((d) => normalizeDoc<Notification>(d.data(), d.id));
        }
        const snap = await db.collectionGroup('notifications')
          .where('userId', '==', userId)
          .get();
        return snap.docs.map((d) => normalizeDoc<Notification>(d.data(), d.id));
      },
      async markRead(id: string): Promise<void> {
        await notifBase.update(id, { read: true } as Partial<Notification>);
      },
    };

    this.source = 'firestore';
    this.fallbackReason = '';
  }
}
