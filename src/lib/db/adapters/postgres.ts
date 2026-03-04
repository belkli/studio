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
  logo_url: string | null;
  opening_hours: unknown;
  established_year: number | null;
  description: unknown;
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
  avatar_url: string | null;
  bio_json: unknown;
  education: unknown;
  video_url: string | null;
  available_for_new_students: boolean | null;
  lesson_durations: unknown;
  instrument_ids: unknown;
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

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string');
    }
  } catch {
    return [];
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'number') as number[];
  }
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'number');
    }
  } catch {
    return [];
  }
  return [];
}

function pickLocalizedText(
  value: unknown,
  preferredLocale: 'he' | 'en' | 'ar' | 'ru' = 'he'
): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const lookupOrder: Array<'he' | 'en' | 'ar' | 'ru'> = [
    preferredLocale,
    'he',
    'en',
    'ar',
    'ru',
  ];

  for (const locale of lookupOrder) {
    const candidate = record[locale];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

function pickLocalizedStringArray(
  value: unknown,
  preferredLocale: 'he' | 'en' | 'ar' | 'ru' = 'he'
): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const lookupOrder: Array<'he' | 'en' | 'ar' | 'ru'> = [
    preferredLocale,
    'he',
    'en',
    'ar',
    'ru',
  ];

  for (const locale of lookupOrder) {
    const candidate = record[locale];
    if (Array.isArray(candidate)) {
      return candidate.filter((item) => typeof item === 'string') as string[];
    }
  }

  return [];
}

function mapRole(role: string): UserRole {
  switch (role) {
    case 'SITE_ADMIN':
      return 'site_admin';
    case 'CONSERVATORIUM_ADMIN':
      return 'conservatorium_admin';
    case 'DELEGATED_ADMIN':
      return 'delegated_admin';
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

function mapConservatoriums(rows: RawConservatorium[]): {
  conservatoriums: Conservatorium[];
  idMap: Map<string, string>;
  nameMap: Map<string, string>;
} {
  const idMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  const conservatoriums = rows.map((row, index) => {
    const description = parseJsonObject(row.description);
    const sourceIdValue = description.sourceId;
    const sourceId =
      typeof sourceIdValue === 'number'
        ? sourceIdValue
        : typeof sourceIdValue === 'string' && /^\d+$/.test(sourceIdValue)
          ? Number(sourceIdValue)
          : null;

    const appId = Number.isFinite(sourceId) ? 'cons-' + sourceId : row.id;
    idMap.set(row.id, appId);

    const about =
      pickLocalizedText(description.about, 'he') ??
      pickLocalizedText(description.aboutText, 'he');

    const openingHoursText =
      pickLocalizedText(description.openingHours, 'he') ??
      (typeof row.opening_hours === 'string' ? row.opening_hours : undefined);

    const managerRecord =
      description.manager && typeof description.manager === 'object'
        ? (description.manager as Record<string, unknown>)
        : undefined;

    const locationRecord =
      description.location && typeof description.location === 'object'
        ? (description.location as Record<string, unknown>)
        : undefined;

    const translated = parseJsonObject(description.translations);
    const translations = (() => {
      const out: Conservatorium['translations'] = {};
      (['en', 'ar', 'ru'] as const).forEach((locale) => {
        const raw = translated[locale];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
        out[locale] = raw as NonNullable<Conservatorium['translations']>[typeof locale];
      });
      return Object.keys(out).length ? out : undefined;
    })();

    const photoUrls = Array.isArray(description.photoUrls)
      ? (description.photoUrls.filter((item) => typeof item === 'string') as string[])
      : row.logo_url
        ? [row.logo_url]
        : [];

    const mapped: Conservatorium = {
      id: appId,
      name: row.name,
      nameEn: row.name_en ?? undefined,
      tier: TIER_CYCLE[index % TIER_CYCLE.length],
      foundedYear: row.established_year ?? undefined,
      about: about || undefined,
      email: row.email ?? undefined,
      tel: row.phone ?? undefined,
      officialSite: row.website_url ?? undefined,
      openingHours: openingHoursText,
      location: {
        city: pickLocalizedText(locationRecord?.city, 'he') || row.city || '',
        cityEn:
          pickLocalizedText(locationRecord?.city, 'en') ||
          pickLocalizedText(description.cityEn, 'en') ||
          undefined,
        address: pickLocalizedText(locationRecord?.address, 'he') || row.address || undefined,
        coordinates:
          locationRecord?.coordinates && typeof locationRecord.coordinates === 'object'
            ? (locationRecord.coordinates as { lat: number; lng: number })
            : undefined,
        googleMapsUrl: pickLocalizedText(locationRecord?.googleMapsUrl, 'en'),
      },
      manager: managerRecord
        ? {
            name: pickLocalizedText(managerRecord.name, 'he') || '',
            role: pickLocalizedText(managerRecord.role, 'he'),
            bio: pickLocalizedText(managerRecord.bio, 'he'),
            photoUrl:
              pickLocalizedText(managerRecord.photoUrl, 'en') ||
              pickLocalizedText(managerRecord.photo_url, 'en'),
          }
        : undefined,
      leadingTeam: Array.isArray(description.leadingTeam)
        ? (description.leadingTeam as Array<Record<string, unknown>>)
            .map((member) => ({
              name: pickLocalizedText(member.name, 'he') || '',
              role: pickLocalizedText(member.role, 'he'),
              bio: pickLocalizedText(member.bio, 'he'),
              photoUrl:
                pickLocalizedText(member.photoUrl, 'en') ||
                pickLocalizedText(member.photo_url, 'en'),
            }))
            .filter((member) => member.name)
        : undefined,
      departments: Array.isArray(description.departments)
        ? (description.departments as Array<Record<string, unknown>>)
            .map((department) => ({
              name: pickLocalizedText(department.name, 'he') || '',
              nameEn: pickLocalizedText(department.name, 'en'),
              headTeacher:
                pickLocalizedText(department.headTeacher, 'he') ||
                pickLocalizedText(department.head_teacher, 'he'),
              photoUrl:
                pickLocalizedText(department.photoUrl, 'en') ||
                pickLocalizedText(department.photo_url, 'en'),
            }))
            .filter((department) => department.name)
        : undefined,
      branchesInfo: Array.isArray(description.branchesInfo)
        ? (description.branchesInfo as Array<Record<string, unknown>>)
            .map((branch) => ({
              name: pickLocalizedText(branch.name, 'he') || '',
              address: pickLocalizedText(branch.address, 'he'),
              tel: pickLocalizedText(branch.tel, 'en'),
              email: pickLocalizedText(branch.email, 'en'),
              manager: pickLocalizedText(branch.manager, 'he'),
            }))
            .filter((branch) => branch.name)
        : undefined,
      teachers: Array.isArray(description.teachers)
        ? (description.teachers as Array<Record<string, unknown>>)
            .map((teacher, teacherIndex) => ({
              id: pickLocalizedText(teacher.id, 'en') || appId + '-teacher-' + (teacherIndex + 1),
              name: pickLocalizedText(teacher.name, 'he') || '',
              role: pickLocalizedText(teacher.role, 'he'),
              bio: pickLocalizedText(teacher.bio, 'he'),
              photoUrl:
                pickLocalizedText(teacher.photoUrl, 'en') ||
                pickLocalizedText(teacher.photo_url, 'en'),
              instruments: parseStringArray(teacher.instruments),
            }))
            .filter((teacher) => teacher.name)
        : undefined,
      programs: pickLocalizedStringArray(description.programs, 'he') || undefined,
      socialMedia:
        description.socialMedia && typeof description.socialMedia === 'object'
          ? {
              facebook: (description.socialMedia as Record<string, unknown>).facebook as string,
              instagram: (description.socialMedia as Record<string, unknown>).instagram as string,
              youtube: (description.socialMedia as Record<string, unknown>).youtube as string,
              tiktok: (description.socialMedia as Record<string, unknown>).tiktok as string,
              whatsapp: (description.socialMedia as Record<string, unknown>).whatsapp as string,
            }
          : undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      translations,
    };

    nameMap.set(mapped.id, mapped.name);
    return mapped;
  });

  return {
    conservatoriums,
    idMap,
    nameMap,
  };
}

function mapUsers(rows: RawUser[], idMap: Map<string, string>, nameMap: Map<string, string>): User[] {
  return rows.map((row) => {
    const mappedRole = mapRole(row.role);
    const bio = parseJsonObject(row.bio_json);
    const lessonDurations = parseNumberArray(row.lesson_durations)
      .filter((value) => value === 30 || value === 45 || value === 60) as Array<30 | 45 | 60>;
    const instrumentIds = parseStringArray(row.instrument_ids);
    const displayName = row.first_name + ' ' + row.last_name;
    const conservatoriumId = row.conservatorium_id
      ? idMap.get(row.conservatorium_id) || row.conservatorium_id
      : 'global';

    return {
      id: row.id,
      name: displayName.trim(),
      email: row.email,
      role: mappedRole,
      conservatoriumId,
      conservatoriumName:
        conservatoriumId === 'global'
          ? 'Harmonia'
          : nameMap.get(conservatoriumId) || row.conservatorium_name || 'Harmonia',
      idNumber: row.national_id ?? undefined,
      phone: row.phone ?? undefined,
      city: row.city ?? undefined,
      gender: row.gender === 'female' ? 'female' : row.gender === 'male' ? 'male' : undefined,
      approved: row.is_active,
      createdAt: row.created_at,
      achievements: [],
      notifications: [],
      avatarUrl: row.avatar_url ?? undefined,
      bio: (bio.he as string) || (bio.en as string) || undefined,
      education: parseStringArray(row.education),
      videoUrl: row.video_url ?? undefined,
      availableForNewStudents: row.available_for_new_students ?? undefined,
      lessonDurationsOffered: lessonDurations.length ? lessonDurations : undefined,
      instruments: instrumentIds.map((instrumentId) => ({
        instrument: instrumentId,
        teacherName: displayName.trim(),
        yearsOfStudy: 0,
      })),
      translations: {
        en: bio.en ? { bio: String(bio.en) } : undefined,
        ru: bio.ru ? { bio: String(bio.ru) } : undefined,
        ar: bio.ar ? { bio: String(bio.ar) } : undefined,
      },
      isDelegatedAdmin: row.role === 'DELEGATED_ADMIN',
      isPrimaryConservatoriumAdmin: row.role === 'CONSERVATORIUM_ADMIN',
    };
  });
}

function mapLessons(rows: RawLesson[], idMap: Map<string, string>): LessonSlot[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
    teacherId: row.teacher_id,
    studentId: row.student_id,
    instrument: row.instrument || 'Instrument',
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

function mapForms(rows: RawForm[], idMap: Map<string, string>, nameMap: Map<string, string>): FormSubmission[] {
  return rows.map((row) => {
    let parsedData: Record<string, unknown> = {};
    try {
      parsedData = JSON.parse(row.form_data || '{}') as Record<string, unknown>;
    } catch {
      parsedData = {};
    }

    const conservatoriumId = idMap.get(row.conservatorium_id) || row.conservatorium_id;

    return {
      id: row.id,
      formType: row.type,
      conservatoriumId,
      conservatoriumName: nameMap.get(conservatoriumId) || row.conservatorium_name,
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

function mapRooms(rows: RawRoom[], idMap: Map<string, string>): Room[] {
  return rows.map((row) => {
    let instrumentEquipment: Room['instrumentEquipment'] = [];
    try {
      const parsed = JSON.parse(row.instrument_equipment || '[]') as Array<{ instrumentId?: string; quantity?: number; notes?: string }>;
      instrumentEquipment = parsed
        .filter((item) => Boolean(item.instrumentId))
        .map((item) => ({
          instrumentId: item.instrumentId as string,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          notes: item.notes || undefined,
        }));
    } catch {
      instrumentEquipment = [];
    }

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      branchId: row.branch_id ?? 'branch-1',
      name: row.name,
      capacity: row.capacity ?? 1,
      instrumentEquipment,
      blocks: [],
      isActive: true,
      equipment: instrumentEquipment.map((item) => [item.instrumentId, item.notes].filter(Boolean).join(' - ')),
    };
  });
}

function mapEvents(rows: RawEvent[], idMap: Map<string, string>): EventProduction[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
    name: row.name,
    type: 'CONCERT',
    venue: row.venue ?? '',
    eventDate: row.event_date,
    startTime: row.event_time?.slice(0, 5) ?? '18:00',
    status: mapEventStatus(row.status),
    program: [],
  }));
}

function mapPayroll(rows: RawPayroll[], idMap: Map<string, string>): PayrollSummary[] {
  return rows.map((row) => {
    const month = String(row.period_month).padStart(2, '0');
    const periodStart = `${row.period_year}-${month}-01`;
    const endOfMonth = new Date(Date.UTC(row.period_year, row.period_month, 0)).toISOString().slice(0, 10);
    const grossPay = Number(row.total_minutes ?? 0);

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
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
        COALESCE(c.name->>'he', c.name->>'en', 'Conservatory') AS name,
        COALESCE(c.name->>'en', c.name->>'he', 'Conservatory') AS name_en,
        c.city,
        c.address,
        c.phone,
        c.email,
        c.website_url,
        c.logo_url,
        c.opening_hours,
        c.established_year,
        c.description
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
        u.created_at::text,
        u.avatar_url,
        tp.bio AS bio_json,
        tp.education,
        tp.video_url,
        tp.available_for_new_students,
        tp.lesson_durations,
        tp.instruments AS instrument_ids
      FROM users u
      LEFT JOIN conservatoriums c ON c.id = u.conservatorium_id
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
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
        COALESCE(c.name->>'he', c.name->>'en', 'Conservatory') AS conservatorium_name,
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

  const mappedConservatoriums = mapConservatoriums(conservatoriumRows);
  const { conservatoriums: conservatoriumSeed, idMap, nameMap } = mappedConservatoriums;

  return {
    users: mapUsers(userRows, idMap, nameMap),
    conservatoriums: conservatoriumSeed,
    lessons: mapLessons(lessonRows, idMap),
    rooms: mapRooms(roomRows, idMap),
    events: mapEvents(eventRows, idMap),
    forms: mapForms(formRows, idMap, nameMap),
    scholarships: [],
    rentals: [],
    payments: [],
    payrolls: mapPayroll(payrollRows, idMap),
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
