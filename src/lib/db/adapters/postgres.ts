import { spawnSync } from 'node:child_process';
import type {
  Conservatorium,
  EventProduction,
  FormSubmission,
  FormStatus,
  LessonSlot,
  PayrollSummary,
  Room,
  SlotStatus,
  User,
  UserRole,
} from '@/lib/types';
import { buildDefaultSeed, MemoryDatabaseAdapter, type MemorySeed } from './shared';

type RawConservatorium = {
  id: string;
  name: string;
  name_en: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  established_year: number | null;
};

type RawUser = {
  id: string;
  conservatorium_id: string | null;
  conservatorium_name: string | null;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  phone: string | null;
  city: string | null;
  gender: string | null;
  is_active: boolean;
  created_at: string;
};

type RawLesson = {
  id: string;
  conservatorium_id: string;
  student_id: string;
  teacher_id: string;
  room_id: string | null;
  instrument: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
};

type RawForm = {
  id: string;
  conservatorium_id: string;
  conservatorium_name: string;
  type: string;
  student_id: string | null;
  student_name: string;
  status: string;
  submitted_at: string;
  form_data: string;
};

type RawRoom = {
  id: string;
  conservatorium_id: string;
  branch_id: string | null;
  name: string;
  capacity: number | null;
  instrument_equipment: string | null;
};

type RawEvent = {
  id: string;
  conservatorium_id: string;
  name: string;
  venue: string | null;
  event_date: string;
  event_time: string | null;
  status: string;
};

type RawPayroll = {
  id: string;
  conservatorium_id: string;
  teacher_id: string;
  teacher_name: string;
  period_year: number;
  period_month: number;
  total_minutes: number;
  generated_at: string;
};

const TIER_CYCLE: Conservatorium['tier'][] = ['A', 'B', 'C'];

function runPsqlJson<T>(connectionString: string, sql: string): T[] {
  const wrappedSql = `SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (${sql}) t;`;
  const result = spawnSync(
    'psql',
    [
      '--no-psqlrc',
      '--tuples-only',
      '--no-align',
      '--quiet',
      '--dbname',
      connectionString,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      wrappedSql,
    ],
    {
      encoding: 'utf8'
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || `psql exited with code ${result.status}`);
  }

  const output = (result.stdout || '').trim().split(/\r?\n/).filter(Boolean).pop() ?? '[]';
  return JSON.parse(output) as T[];
}

function mapRole(role: string): UserRole {
  switch (role) {
    case 'SITE_ADMIN':
      return 'site_admin';
    case 'CONSERVATORIUM_ADMIN':
    case 'DELEGATED_ADMIN':
      return 'conservatorium_admin';
    case 'TEACHER':
      return 'teacher';
    case 'PARENT':
      return 'parent';
    case 'STUDENT_OVER_13':
    case 'STUDENT_UNDER_13':
      return 'student';
    default:
      return 'student';
  }
}

function mapLessonStatus(status: string): SlotStatus {
  switch (status) {
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED_STUDENT_NOTICED';
    default:
      return 'SCHEDULED';
  }
}

function mapFormStatus(status: string): FormStatus {
  switch (status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'PENDING':
      return 'PENDING_ADMIN';
    case 'REVISION_REQUIRED':
      return 'REVISION_REQUIRED';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'PENDING_ADMIN';
  }
}

function mapEventStatus(status: string): EventProduction['status'] {
  if (status === 'draft') {
    return 'PLANNING';
  }
  if (status === 'completed') {
    return 'COMPLETED';
  }
  return 'OPEN_REGISTRATION';
}

function toDuration(value: number): 30 | 45 | 60 {
  if (value === 30 || value === 45 || value === 60) {
    return value;
  }
  return 45;
}

function mapConservatoriums(rows: RawConservatorium[]): Conservatorium[] {
  return rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    tier: TIER_CYCLE[index % TIER_CYCLE.length],
    foundedYear: row.established_year ?? undefined,
    email: row.email ?? undefined,
    tel: row.phone ?? undefined,
    officialSite: row.website_url ?? undefined,
    location: {
      city: row.city ?? '',
      address: row.address ?? undefined,
    },
  }));
}

function mapUsers(rows: RawUser[]): User[] {
  return rows.map((row) => {
    const mappedRole = mapRole(row.role);
    const isDelegated = row.role === 'DELEGATED_ADMIN';
    const isConservatoriumAdmin = row.role === 'CONSERVATORIUM_ADMIN';

    return {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      role: mappedRole,
      conservatoriumId: row.conservatorium_id ?? 'global',
      conservatoriumName: row.conservatorium_name ?? 'Harmonia',
      idNumber: row.national_id ?? undefined,
      phone: row.phone ?? undefined,
      city: row.city ?? undefined,
      gender: row.gender === 'female' ? 'נקבה' : row.gender === 'male' ? 'זכר' : undefined,
      approved: row.is_active,
      createdAt: row.created_at,
      achievements: [],
      notifications: [],
      isDelegatedAdmin: isDelegated,
      isPrimaryConservatoriumAdmin: isConservatoriumAdmin,
    };
  });
}

function mapLessons(rows: RawLesson[]): LessonSlot[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    teacherId: row.teacher_id,
    studentId: row.student_id,
    instrument: row.instrument || 'כלי נגינה',
    startTime: new Date(row.scheduled_at).toISOString(),
    durationMinutes: toDuration(row.duration_minutes),
    type: row.status === 'makeup' ? 'MAKEUP' : 'RECURRING',
    bookingSource: 'ADMIN',
    roomId: row.room_id ?? undefined,
    isVirtual: false,
    isCreditConsumed: false,
    status: mapLessonStatus(row.status),
    createdAt: new Date(row.scheduled_at).toISOString(),
    updatedAt: new Date(row.scheduled_at).toISOString(),
  }));
}

function mapForms(rows: RawForm[]): FormSubmission[] {
  return rows.map((row) => {
    let parsedData: Record<string, unknown> = {};
    try {
      parsedData = JSON.parse(row.form_data || '{}') as Record<string, unknown>;
    } catch (error) {
      parsedData = {};
    }

    return {
      id: row.id,
      formType: row.type,
      conservatoriumId: row.conservatorium_id,
      conservatoriumName: row.conservatorium_name,
      studentId: row.student_id ?? 'unknown-student',
      studentName: row.student_name || 'Student',
      status: mapFormStatus(row.status),
      submissionDate: new Date(row.submitted_at).toISOString().slice(0, 10),
      totalDuration: '00:00',
      repertoire: [],
      formData: parsedData,
    };
  });
}

function mapRooms(rows: RawRoom[]): Room[] {
  return rows.map((row) => {
    let equipment: string[] = [];
    try {
      const parsed = JSON.parse(row.instrument_equipment || '[]') as Array<{ instrumentId?: string; notes?: string }>;
      equipment = parsed.map((item) => [item.instrumentId, item.notes].filter(Boolean).join(' - ')).filter(Boolean);
    } catch (error) {
      equipment = [];
    }

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      branchId: row.branch_id ?? undefined,
      name: row.name,
      capacity: row.capacity ?? undefined,
      equipment,
    };
  });
}

function mapEvents(rows: RawEvent[]): EventProduction[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    name: row.name,
    type: 'CONCERT',
    venue: row.venue ?? '',
    eventDate: row.event_date,
    startTime: row.event_time?.slice(0, 5) ?? '18:00',
    status: mapEventStatus(row.status),
    program: [],
  }));
}

function mapPayroll(rows: RawPayroll[]): PayrollSummary[] {
  return rows.map((row) => {
    const month = String(row.period_month).padStart(2, '0');
    const periodStart = `${row.period_year}-${month}-01`;
    const endOfMonth = new Date(Date.UTC(row.period_year, row.period_month, 0)).toISOString().slice(0, 10);
    const grossPay = Number(row.total_minutes ?? 0);

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      periodStart,
      periodEnd: endOfMonth,
      completedLessons: [],
      totalHours: Number((Number(row.total_minutes ?? 0) / 60).toFixed(2)),
      grossPay,
      totalAmount: grossPay,
      status: 'APPROVED',
      paymentDate: new Date(row.generated_at).toISOString(),
    };
  });
}

function loadSeedFromPostgres(connectionString: string): MemorySeed {
  const conservatoriumRows = runPsqlJson<RawConservatorium>(
    connectionString,
    `
      SELECT
        c.id::text,
        COALESCE(c.name->>'he', c.name->>'en', 'Conservatorium') AS name,
        COALESCE(c.name->>'en', c.name->>'he', 'Conservatorium') AS name_en,
        c.city,
        c.address,
        c.phone,
        c.email,
        c.website_url,
        c.established_year
      FROM conservatoriums c
      ORDER BY c.created_at ASC
    `
  );

  const userRows = runPsqlJson<RawUser>(
    connectionString,
    `
      SELECT
        u.id::text,
        u.conservatorium_id::text,
        COALESCE(c.name->>'he', c.name->>'en', 'Harmonia') AS conservatorium_name,
        u.email,
        u.role::text,
        u.first_name,
        u.last_name,
        u.national_id,
        u.phone,
        u.city,
        u.gender,
        u.is_active,
        u.created_at::text
      FROM users u
      LEFT JOIN conservatoriums c ON c.id = u.conservatorium_id
      ORDER BY u.created_at ASC
    `
  );

  const lessonRows = runPsqlJson<RawLesson>(
    connectionString,
    `
      SELECT
        l.id::text,
        l.conservatorium_id::text,
        l.student_id::text,
        l.teacher_id::text,
        l.room_id::text,
        COALESCE(ci.names->>'he', ci.names->>'en', '') AS instrument,
        l.scheduled_at::text,
        l.duration_minutes,
        l.status::text
      FROM lessons l
      LEFT JOIN conservatorium_instruments ci ON ci.id = l.instrument_id
      ORDER BY l.scheduled_at ASC
    `
  );

  const formRows = runPsqlJson<RawForm>(
    connectionString,
    `
      SELECT
        f.id::text,
        f.conservatorium_id::text,
        COALESCE(c.name->>'he', c.name->>'en', 'Conservatorium') AS conservatorium_name,
        f.type,
        f.student_id::text,
        COALESCE(u.first_name || ' ' || u.last_name, 'Student') AS student_name,
        f.status::text,
        f.submitted_at::text,
        f.form_data::text
      FROM forms f
      LEFT JOIN users u ON u.id = f.student_id
      LEFT JOIN conservatoriums c ON c.id = f.conservatorium_id
      ORDER BY f.submitted_at DESC
    `
  );

  const roomRows = runPsqlJson<RawRoom>(
    connectionString,
    `
      SELECT
        r.id::text,
        r.conservatorium_id::text,
        r.branch_id::text,
        r.name,
        r.capacity,
        r.instrument_equipment::text
      FROM rooms r
      ORDER BY r.created_at ASC
    `
  );

  const eventRows = runPsqlJson<RawEvent>(
    connectionString,
    `
      SELECT
        e.id::text,
        e.conservatorium_id::text,
        COALESCE(e.title->>'he', e.title->>'en', 'Event') AS name,
        COALESCE(e.venue->>'he', e.venue->>'en', '') AS venue,
        e.event_date::text,
        e.event_time::text,
        e.status
      FROM events e
      ORDER BY e.event_date ASC
    `
  );

  const payrollRows = runPsqlJson<RawPayroll>(
    connectionString,
    `
      SELECT
        p.id::text,
        p.conservatorium_id::text,
        p.teacher_id::text,
        COALESCE(u.first_name || ' ' || u.last_name, 'Teacher') AS teacher_name,
        p.period_year,
        p.period_month,
        p.total_minutes,
        p.generated_at::text
      FROM payroll_snapshots p
      LEFT JOIN users u ON u.id = p.teacher_id
      ORDER BY p.period_year DESC, p.period_month DESC
    `
  );

  return {
    users: mapUsers(userRows),
    conservatoriums: mapConservatoriums(conservatoriumRows),
    lessons: mapLessons(lessonRows),
    rooms: mapRooms(roomRows),
    events: mapEvents(eventRows),
    forms: mapForms(formRows),
    scholarships: [],
    rentals: [],
    payments: [],
    payrolls: mapPayroll(payrollRows),
    announcements: [],
    alumni: [],
    masterClasses: [],
  };
}

export class PostgresAdapter extends MemoryDatabaseAdapter {
  readonly connectionString: string;

  constructor(connectionString: string) {
    const seed = (() => {
      try {
        return loadSeedFromPostgres(connectionString);
      } catch (error) {
        console.error('[db/postgres] Falling back to default in-memory seed:', error);
        return buildDefaultSeed();
      }
    })();

    super(seed);
    this.connectionString = connectionString;
  }
}
