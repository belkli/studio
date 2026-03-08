import { spawnSync } from 'node:child_process';
import type {
  Alumnus,
  Branch,
  Conservatorium,
  ConservatoriumInstrument,
  DonationCause,
  DonationRecord,
  EventProduction,
  Announcement,
  FormSubmission,
  FormStatus,
  Invoice,
  LessonPackage,
  LessonSlot,
  Masterclass,
  PayrollSummary,
  Room,
  SlotStatus,
  ScholarshipApplication,
  User,
  UserRole,
} from '@/lib/types';
import { buildDefaultSeed, MemoryDatabaseAdapter, type MemorySeed } from './shared';
import { attachPostgresWriteThrough } from './postgres-write-through';
import type { RepertoireEntry } from '@/lib/db/types';

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
  teacher_rating_avg: number | null;
  teacher_rating_count: number | null;
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

type RawBranch = {
  id: string;
  conservatorium_id: string;
  name: string;
  address: string | null;
  phone: string | null;
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

type RawConservatoriumInstrument = {
  id: string;
  conservatorium_id: string;
  instrument_catalog_id: string | null;
  names: unknown;
  is_active: boolean;
  available_for_registration: boolean;
  available_for_rental: boolean;
  teacher_count: number;
};

type RawLessonPackage = {
  id: string;
  conservatorium_id: string;
  names: unknown;
  type: string;
  lesson_count: number | null;
  duration_minutes: number;
  price_ils: number | string;
  is_active: boolean;
  normalized_conservatorium_instruments: unknown;
  normalized_catalog_instruments: unknown;
};

type RawComposition = {
  id: string;
  composer_names: unknown;
  titles: unknown;
  genre: string | null;
  instrument_names: unknown;
};

type RawAlumnus = {
  user_id: string;
  conservatorium_id: string;
  display_name: string;
  graduation_year: number | null;
  primary_instrument: string | null;
  current_occupation: string | null;
  bio: unknown;
  profile_photo_url: string | null;
  is_public: boolean;
  achievements: unknown;
  social_links: unknown;
  available_for_master_classes: boolean;
};

type RawMasterClass = {
  id: string;
  conservatorium_id: string;
  title: unknown;
  description: unknown;
  instructor_id: string;
  instructor_name: string;
  instrument: string | null;
  max_participants: number | null;
  target_audience: string | null;
  event_date: string;
  start_time: string;
  duration_minutes: number | null;
  location: string | null;
  is_online: boolean;
  stream_url: string | null;
  included_in_package: boolean;
  price_ils: number | string | null;
  status: string | null;
  instructor_photo_url: string | null;
};

type RawDonationCause = {
  id: string;
  conservatorium_id: string;
  names: unknown;
  descriptions: unknown;
  category: string | null;
  priority: number | null;
  is_active: boolean;
  target_amount_ils: number | string | null;
  raised_amount_ils: number | string | null;
  image_url: string | null;
};

type RawDonationRecord = {
  id: string;
  conservatorium_id: string;
  cause_id: string;
  amount_ils: number | string;
  frequency: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_user_id: string | null;
  status: string;
  created_at: string;
};

type RawAnnouncement = {
  id: string;
  conservatorium_id: string;
  title: string;
  body: string;
  target_audience: string;
  channels: unknown;
  sent_at: string;
};

type RawScholarship = {
  id: string;
  conservatorium_id: string;
  student_id: string;
  student_name: string;
  status: string;
  submitted_at: string;
  approved_at: string | null;
  paid_at: string | null;
};

type RawRental = {
  id: string;
  conservatorium_id: string;
  instrument_name: string | null;
  student_id: string;
  parent_id: string | null;
  rental_model: string;
  deposit_amount_ils: number | string | null;
  monthly_fee_ils: number | string | null;
  purchase_price_ils: number | string | null;
  start_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  status: string;
  condition: string | null;
  notes: string | null;
  created_at: string;
};

type RawInvoice = {
  id: string;
  conservatorium_id: string;
  invoice_number: string;
  payer_id: string;
  line_items: unknown;
  total: number | string;
  status: string;
  due_date: string;
  paid_at: string | null;
};
const TIER_CYCLE: Conservatorium['tier'][] = ['A', 'B', 'C'];

function runPsqlJson<T>(connectionString: string, sql: string): T[] {
  const wrappedSql = `SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM (${sql}) t;`;
  const psqlBinary = process.env.PSQL_BIN || 'psql';
  const result = spawnSync(
    psqlBinary,
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
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
    }
  );

  if (result.error) {
    throw new Error(`psql execution failed (${psqlBinary}): ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const signal = result.signal ? ` (signal ${result.signal})` : '';
    throw new Error(stderr || `psql exited with code ${result.status}${signal}`);
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
      // Keep modern dashboard nav enabled in DB mode unless explicitly disabled.
      newFeaturesEnabled:
        typeof (description as Record<string, unknown>).newFeaturesEnabled === 'boolean'
          ? ((description as Record<string, unknown>).newFeaturesEnabled as boolean)
          : true,
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
      teacherRatingAvg:
        mappedRole === 'teacher' && typeof row.teacher_rating_avg === 'number'
          ? Number(row.teacher_rating_avg)
          : undefined,
      teacherRatingCount:
        mappedRole === 'teacher' && typeof row.teacher_rating_count === 'number'
          ? Number(row.teacher_rating_count)
          : undefined,
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
    durationMinutes: toDuration(row.duration_minutes ?? 60),
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

function mapBranches(rows: RawBranch[], idMap: Map<string, string>): Branch[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
    name: row.name,
    address: row.address || row.phone || '',
  }));
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


function mapConservatoriumInstruments(
  rows: RawConservatoriumInstrument[],
  idMap: Map<string, string>
): ConservatoriumInstrument[] {
  return rows.map((row) => {
    const localizedNames = parseJsonObject(row.names);
    const fallbackName =
      pickLocalizedText(localizedNames, 'he') ||
      pickLocalizedText(localizedNames, 'en') ||
      row.instrument_catalog_id ||
      'Instrument';

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      instrumentCatalogId: row.instrument_catalog_id || undefined,
      names: {
        he: (localizedNames.he as string) || fallbackName,
        en: (localizedNames.en as string) || fallbackName,
        ru: (localizedNames.ru as string) || undefined,
        ar: (localizedNames.ar as string) || undefined,
      },
      isActive: row.is_active,
      teacherCount: Number(row.teacher_count || 0),
      availableForRegistration: row.available_for_registration,
      availableForRental: row.available_for_rental,
    };
  });
}

function mapPackageType(value: string): LessonPackage['type'] {
  if (value === 'monthly' || value === 'semester' || value === 'annual' || value === 'single') {
    return value;
  }
  return 'single';
}

function mapLessonPackages(rows: RawLessonPackage[], idMap: Map<string, string>): LessonPackage[] {
  return rows.map((row) => {
    const localizedNames = parseJsonObject(row.names);
    const fallbackName =
      pickLocalizedText(localizedNames, 'he') ||
      pickLocalizedText(localizedNames, 'en') ||
      'Package';

    const normalizedConservatoriumInstruments = parseStringArray(row.normalized_conservatorium_instruments);
    const normalizedCatalogInstruments = parseStringArray(row.normalized_catalog_instruments);
    const instruments = normalizedCatalogInstruments;

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      names: {
        he: (localizedNames.he as string) || fallbackName,
        en: (localizedNames.en as string) || fallbackName,
        ru: (localizedNames.ru as string) || undefined,
        ar: (localizedNames.ar as string) || undefined,
      },
      type: mapPackageType(row.type),
      lessonCount: row.lesson_count,
      durationMinutes: toDuration(row.duration_minutes ?? 60),
      priceILS: Number(row.price_ils || 0),
      isActive: row.is_active,
      instruments,
      conservatoriumInstrumentIds: normalizedConservatoriumInstruments,
      instrumentCatalogIds: normalizedCatalogInstruments,
    };
  });
}

function mapCompositions(rows: RawComposition[]): RepertoireEntry[] {
  return rows.map((row) => {
    const composerNames = parseJsonObject(row.composer_names);
    const titles = parseJsonObject(row.titles);
    const instrumentNames = parseJsonObject(row.instrument_names);

    const composer =
      pickLocalizedText(composerNames, 'he') ||
      pickLocalizedText(composerNames, 'en') ||
      'Unknown Composer';

    const title =
      pickLocalizedText(titles, 'he') ||
      pickLocalizedText(titles, 'en') ||
      'Untitled';

    const instrument =
      pickLocalizedText(instrumentNames, 'he') ||
      pickLocalizedText(instrumentNames, 'en');

    const composerId = row.id;

    return {
      id: row.id,
      composer,
      composerId,
      composerNames: {
        he: (composerNames.he as string) || composer,
        en: (composerNames.en as string) || composer,
        ru: (composerNames.ru as string) || undefined,
        ar: (composerNames.ar as string) || undefined,
      },
      title,
      titles: {
        he: (titles.he as string) || title,
        en: (titles.en as string) || title,
        ru: (titles.ru as string) || undefined,
        ar: (titles.ar as string) || undefined,
      },
      duration: '00:00',
      genre: row.genre || 'classical',
      instrument,
      approved: true,
      source: 'seed',
    } as RepertoireEntry;
  });
}

function mapAlumni(rows: RawAlumnus[], idMap: Map<string, string>): Alumnus[] {
  return rows.map((row) => {
    const bio = parseJsonObject(row.bio);
    const socialLinks = parseJsonObject(row.social_links);
    const achievements = parseStringArray(row.achievements);

    return {
      id: row.user_id,
      userId: row.user_id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      displayName: row.display_name,
      graduationYear: row.graduation_year ?? new Date().getFullYear(),
      primaryInstrument: row.primary_instrument || 'General Music',
      currentOccupation: row.current_occupation || undefined,
      bio: {
        he: (bio.he as string) || undefined,
        en: (bio.en as string) || undefined,
        ru: (bio.ru as string) || undefined,
        ar: (bio.ar as string) || undefined,
      },
      profilePhotoUrl: row.profile_photo_url || undefined,
      isPublic: row.is_public,
      achievements: achievements.length ? achievements : undefined,
      socialLinks: {
        website: (socialLinks.website as string) || undefined,
        youtube: (socialLinks.youtube as string) || undefined,
        spotify: (socialLinks.spotify as string) || undefined,
        instagram: (socialLinks.instagram as string) || undefined,
      },
      availableForMasterClasses: row.available_for_master_classes,
    };
  });
}

function mapMasterClasses(rows: RawMasterClass[], idMap: Map<string, string>): Masterclass[] {
  return rows.map((row) => {
    const title = parseJsonObject(row.title);
    const description = parseJsonObject(row.description);
    const mappedStatus: Masterclass['status'] =
      row.status === 'published' || row.status === 'completed' || row.status === 'cancelled' || row.status === 'draft'
        ? row.status
        : 'draft';
    const targetAudience: Masterclass['targetAudience'] =
      row.target_audience === 'beginners' ||
      row.target_audience === 'intermediate' ||
      row.target_audience === 'advanced' ||
      row.target_audience === 'all'
        ? row.target_audience
        : 'all';

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      title: {
        he: (title.he as string) || (title.en as string) || 'מאסטרקלאס',
        en: (title.en as string) || (title.he as string) || 'Master Class',
        ru: (title.ru as string) || undefined,
        ar: (title.ar as string) || undefined,
      },
      description: {
        he: (description.he as string) || (description.en as string) || '',
        en: (description.en as string) || (description.he as string) || '',
        ru: (description.ru as string) || undefined,
        ar: (description.ar as string) || undefined,
      },
      instructor: {
        userId: row.instructor_id,
        displayName: row.instructor_name,
        instrument: row.instrument || 'General Music',
        photoUrl: row.instructor_photo_url || undefined,
      },
      instrument: row.instrument || 'General Music',
      maxParticipants: row.max_participants ?? 20,
      targetAudience,
      date: row.event_date,
      startTime: row.start_time.slice(0, 5),
      durationMinutes: toDuration(row.duration_minutes ?? 60),
      location: row.location || 'Main Hall',
      isOnline: row.is_online,
      streamUrl: row.stream_url || undefined,
      includedInPackage: row.included_in_package,
      priceILS: row.price_ils == null ? undefined : Number(row.price_ils),
      status: mappedStatus,
      registrations: [],
    };
  });
}

function mapDonationCauses(rows: RawDonationCause[], idMap: Map<string, string>): DonationCause[] {
  return rows.map((row) => {
    const names = parseJsonObject(row.names);
    const descriptions = parseJsonObject(row.descriptions);
    const fallbackName = pickLocalizedText(names, 'he') || pickLocalizedText(names, 'en') || 'Donation Cause';
    const fallbackDescription = pickLocalizedText(descriptions, 'he') || pickLocalizedText(descriptions, 'en') || '';

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      names: {
        he: (names.he as string) || fallbackName,
        en: (names.en as string) || fallbackName,
        ru: (names.ru as string) || undefined,
        ar: (names.ar as string) || undefined,
      },
      descriptions: {
        he: (descriptions.he as string) || fallbackDescription,
        en: (descriptions.en as string) || fallbackDescription,
      },
      category: (row.category as DonationCause['category']) || 'general',
      priority: typeof row.priority === 'number' ? row.priority : 99,
      isActive: row.is_active,
      targetAmountILS: row.target_amount_ils == null ? undefined : Number(row.target_amount_ils),
      raisedAmountILS: row.raised_amount_ils == null ? 0 : Number(row.raised_amount_ils),
      imageUrl: row.image_url || undefined,
    };
  });
}

function mapDonationRecords(rows: RawDonationRecord[], idMap: Map<string, string>): DonationRecord[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
    causeId: row.cause_id,
    amountILS: Number(row.amount_ils || 0),
    frequency: row.frequency === 'monthly' || row.frequency === 'yearly' ? row.frequency : 'once',
    donorName: row.donor_name || undefined,
    donorEmail: row.donor_email || undefined,
    donorId: row.donor_user_id || undefined,
    status: row.status === 'PAID' || row.status === 'FAILED' ? row.status : 'INITIATED',
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
function mapAnnouncements(rows: RawAnnouncement[], idMap: Map<string, string>) {
  return rows.map((row) => {
    const channels: Announcement['channels'] = parseStringArray(row.channels).filter(
      (value): value is 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' =>
        value === 'IN_APP' || value === 'EMAIL' || value === 'SMS' || value === 'WHATSAPP'
    );

    const targetAudience: Announcement['targetAudience'] =
      row.target_audience === 'STUDENTS' ||
      row.target_audience === 'PARENTS' ||
      row.target_audience === 'TEACHERS'
        ? row.target_audience
        : 'ALL';

    const normalizedChannels: Announcement['channels'] = channels.length ? channels : ['IN_APP'];

    return {
      id: row.id,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      title: row.title,
      body: row.body,
      targetAudience,
      channels: normalizedChannels,
      sentAt: new Date(row.sent_at).toISOString(),
    };
  });
}
function mapRentals(rows: RawRental[], idMap: Map<string, string>) {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
    instrumentName: row.instrument_name || undefined,
    studentId: row.student_id,
    parentId: row.parent_id || undefined,
    rentalModel: row.rental_model,
    depositAmountILS: row.deposit_amount_ils == null ? undefined : Number(row.deposit_amount_ils),
    monthlyFeeILS: row.monthly_fee_ils == null ? undefined : Number(row.monthly_fee_ils),
    purchasePriceILS: row.purchase_price_ils == null ? undefined : Number(row.purchase_price_ils),
    startDate: row.start_date,
    expectedReturnDate: row.expected_return_date || undefined,
    actualReturnDate: row.actual_return_date || undefined,
    status: row.status,
    condition: row.condition || undefined,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
function mapPayments(rows: RawInvoice[], idMap: Map<string, string>): Invoice[] {
  return rows.map((row) => {
    const parsedItems = Array.isArray(row.line_items)
      ? row.line_items
      : (() => {
          try {
            return JSON.parse(String(row.line_items || '[]'));
          } catch {
            return [];
          }
        })();

    const lineItems = Array.isArray(parsedItems)
      ? parsedItems.map((item: unknown) => ({
          description: String((item as Record<string, unknown>)?.description || ''),
          total: Number((item as Record<string, unknown>)?.total || 0),
        }))
      : [];

    const status: Invoice['status'] =
      row.status === 'DRAFT' || row.status === 'SENT' || row.status === 'PAID' || row.status === 'OVERDUE' || row.status === 'CANCELLED'
        ? row.status
        : 'SENT';

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      payerId: row.payer_id,
      lineItems,
      total: Number(row.total || 0),
      status,
      dueDate: row.due_date,
      paidAt: row.paid_at || undefined,
    };
  });
}
function mapScholarships(rows: RawScholarship[], idMap: Map<string, string>) {
  return rows.map((row) => {
    const status: ScholarshipApplication['status'] =
      row.status === 'APPROVED'
        ? 'APPROVED'
        : row.status === 'REJECTED'
          ? 'REJECTED'
          : 'SUBMITTED';
    const paymentStatus: ScholarshipApplication['paymentStatus'] = row.paid_at ? 'PAID' : 'UNPAID';

    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name || 'Student',
      instrument: 'Instrument',
      conservatoriumId: idMap.get(row.conservatorium_id) || row.conservatorium_id,
      academicYear: '2025/2026',
      status,
      submittedAt: new Date(row.submitted_at).toISOString(),
      priorityScore: 0,
      approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
      paymentStatus,
      paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : undefined,
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
        nti.instrument_ids AS instrument_ids,
        tr.avg_rating AS teacher_rating_avg,
        tr.rating_count AS teacher_rating_count
      FROM users u
      LEFT JOIN conservatoriums c ON c.id = u.conservatorium_id
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(
            json_agg(DISTINCT ci.instrument_catalog_id)
              FILTER (WHERE ci.instrument_catalog_id IS NOT NULL),
            '[]'::json
          ) AS instrument_ids
        FROM teacher_profile_instruments tpi
        JOIN conservatorium_instruments ci ON ci.id = tpi.conservatorium_instrument_id
        WHERE tpi.teacher_user_id = u.id
      ) nti ON TRUE
      LEFT JOIN (
        SELECT
          teacher_id,
          ROUND(AVG(rating)::numeric, 2) AS avg_rating,
          COUNT(*)::int AS rating_count
        FROM teacher_ratings
        GROUP BY teacher_id
      ) tr ON tr.teacher_id = u.id
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

  const conservatoriumInstrumentRows = runPsqlJson<RawConservatoriumInstrument>(
    connectionString,
    `
      SELECT
        ci.id::text,
        ci.conservatorium_id::text,
        ci.instrument_catalog_id,
        ci.names,
        ci.is_active,
        ci.available_for_registration,
        ci.available_for_rental,
        COUNT(DISTINCT tpi.teacher_user_id)::int AS teacher_count
      FROM conservatorium_instruments ci
      LEFT JOIN teacher_profile_instruments tpi ON tpi.conservatorium_instrument_id = ci.id
      GROUP BY
        ci.id,
        ci.conservatorium_id,
        ci.instrument_catalog_id,
        ci.names,
        ci.is_active,
        ci.available_for_registration,
        ci.available_for_rental
      ORDER BY ci.created_at ASC
    `
  );

  const lessonPackageRows = runPsqlJson<RawLessonPackage>(
    connectionString,
    `
      SELECT
        lp.id::text,
        lp.conservatorium_id::text,
        lp.names,
        lp.type,
        lp.lesson_count,
        lp.duration_minutes,
        lp.price_ils,
        lp.is_active,
        COALESCE(
          json_agg(DISTINCT ci.id::text)
            FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) AS normalized_conservatorium_instruments,
        COALESCE(
          json_agg(DISTINCT ci.instrument_catalog_id)
            FILTER (WHERE ci.instrument_catalog_id IS NOT NULL),
          '[]'::json
        ) AS normalized_catalog_instruments
      FROM lesson_packages lp
      LEFT JOIN lesson_package_instruments lpi ON lpi.lesson_package_id = lp.id
      LEFT JOIN conservatorium_instruments ci ON ci.id = lpi.conservatorium_instrument_id
      GROUP BY
        lp.id,
        lp.conservatorium_id,
        lp.names,
        lp.type,
        lp.lesson_count,
        lp.duration_minutes,
        lp.price_ils,
        lp.is_active
      ORDER BY lp.created_at ASC
    `
  );

  const compositionRows = runPsqlJson<RawComposition>(
    connectionString,
    `
      SELECT
        rl.id::text,
        rl.composer_names,
        rl.titles,
        rl.genre,
        rl.instrument_names
      FROM repertoire_library rl
      ORDER BY rl.created_at ASC
    `
  );

  let alumnusRows: RawAlumnus[] = [];
  try {
    alumnusRows = runPsqlJson<RawAlumnus>(
      connectionString,
      `
        SELECT
          ap.user_id::text,
          ap.conservatorium_id::text,
          COALESCE(u.first_name || ' ' || u.last_name, 'Alumnus') AS display_name,
          ap.graduation_year,
          ap.primary_instrument,
          ap.current_occupation,
          ap.bio,
          ap.profile_photo_url,
          ap.is_public,
          to_json(ap.achievements) AS achievements,
          ap.social_links,
          ap.available_for_master_classes
        FROM alumni_profiles ap
        LEFT JOIN users u ON u.id = ap.user_id
        ORDER BY ap.created_at DESC
      `
    );
  } catch {
    alumnusRows = [];
  }

  let masterClassRows: RawMasterClass[] = [];
  try {
    masterClassRows = runPsqlJson<RawMasterClass>(
      connectionString,
      `
        SELECT
          mc.id::text,
          mc.conservatorium_id::text,
          mc.title,
          mc.description,
          mc.instructor_id::text,
          COALESCE(u.first_name || ' ' || u.last_name, 'Instructor') AS instructor_name,
          mc.instrument,
          mc.max_participants,
          mc.target_audience,
          mc.event_date::text,
          mc.start_time::text,
          mc.duration_minutes,
          mc.location,
          mc.is_online,
          mc.stream_url,
          mc.included_in_package,
          mc.price_ils,
          mc.status,
          u.avatar_url AS instructor_photo_url
        FROM master_classes mc
        LEFT JOIN users u ON u.id = mc.instructor_id
        ORDER BY mc.event_date DESC, mc.start_time DESC
      `
    );
  } catch {
    masterClassRows = [];
  }

  const donationCauseRows = runPsqlJson<RawDonationCause>(
    connectionString,
    `
      SELECT
        dc.id::text,
        dc.conservatorium_id::text,
        dc.names,
        dc.descriptions,
        dc.category,
        dc.priority,
        dc.is_active,
        dc.target_amount_ils,
        dc.raised_amount_ils,
        dc.image_url
      FROM donation_causes dc
      ORDER BY dc.priority ASC, dc.created_at ASC
    `
  );

  let donationRecordRows: RawDonationRecord[] = [];
  try {
    donationRecordRows = runPsqlJson<RawDonationRecord>(
      connectionString,
      `
        SELECT
          dr.id::text,
          dr.conservatorium_id::text,
          dr.cause_id::text,
          dr.amount_ils,
          dr.frequency,
          dr.donor_name,
          dr.donor_email,
          dr.donor_user_id::text,
          dr.status,
          dr.created_at::text
        FROM donation_records dr
        ORDER BY dr.created_at DESC
      `
    );
  } catch {
    donationRecordRows = [];
  }

  let announcementRows: RawAnnouncement[] = [];
  try {
    announcementRows = runPsqlJson<RawAnnouncement>(
      connectionString,
      `
        SELECT
          a.id::text,
          a.conservatorium_id::text,
          a.title,
          a.body,
          a.target_audience,
          to_json(a.channels) AS channels,
          a.sent_at::text
        FROM announcements a
        ORDER BY a.sent_at DESC
      `
    );
  } catch {
    announcementRows = [];
  }

  let scholarshipRows: RawScholarship[] = [];
  try {
    scholarshipRows = runPsqlJson<RawScholarship>(
      connectionString,
      `
        SELECT
          sa.id::text,
          sa.conservatorium_id::text,
          sa.student_id::text,
          COALESCE(u.first_name || ' ' || u.last_name, 'Student') AS student_name,
          sa.status,
          sa.created_at::text AS submitted_at,
          sa.created_at::text AS approved_at,
          sa.paid_at::text
        FROM scholarship_applications sa
        LEFT JOIN users u ON u.id = sa.student_id
        ORDER BY sa.created_at DESC
      `
    );
  } catch {
    scholarshipRows = [];
  }

  let rentalRows: RawRental[] = [];
  try {
    rentalRows = runPsqlJson<RawRental>(
      connectionString,
      `
        SELECT
          ir.id::text,
          ir.conservatorium_id::text,
          ir.instrument_name,
          ir.student_id::text,
          ir.parent_id::text,
          ir.rental_model,
          ir.deposit_amount_ils,
          ir.monthly_fee_ils,
          ir.purchase_price_ils,
          ir.start_date::text,
          ir.expected_return_date::text,
          ir.actual_return_date::text,
          ir.status,
          ir.condition,
          ir.notes,
          ir.created_at::text
        FROM instrument_rentals ir
        ORDER BY ir.created_at DESC
      `
    );
  } catch {
    rentalRows = [];
  }
  let invoiceRows: RawInvoice[] = [];
  try {
    invoiceRows = runPsqlJson<RawInvoice>(
      connectionString,
      `
        SELECT
          i.id::text,
          i.conservatorium_id::text,
          i.invoice_number,
          i.payer_id::text,
          i.line_items,
          i.total,
          i.status,
          i.due_date::text,
          i.paid_at::text
        FROM invoices i
        ORDER BY i.created_at DESC
      `
    );
  } catch {
    invoiceRows = [];
  }
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

  const branchRows = runPsqlJson<RawBranch>(
    connectionString,
    `
      SELECT
        b.id::text,
        b.conservatorium_id::text,
        b.name,
        b.address,
        b.phone
      FROM branches b
      ORDER BY b.created_at ASC
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
    conservatoriumInstruments: mapConservatoriumInstruments(conservatoriumInstrumentRows, idMap),
    lessonPackages: mapLessonPackages(lessonPackageRows, idMap),
    lessons: mapLessons(lessonRows, idMap),
    branches: mapBranches(branchRows, idMap),
    rooms: mapRooms(roomRows, idMap),
    events: mapEvents(eventRows, idMap),
    forms: mapForms(formRows, idMap, nameMap),
    scholarships: mapScholarships(scholarshipRows, idMap),
    rentals: mapRentals(rentalRows, idMap),
    payments: mapPayments(invoiceRows, idMap),
    payrolls: mapPayroll(payrollRows, idMap),
    announcements: mapAnnouncements(announcementRows, idMap),
    alumni: mapAlumni(alumnusRows, idMap),
    masterClasses: mapMasterClasses(masterClassRows, idMap),
    repertoire: mapCompositions(compositionRows),
    donationCauses: mapDonationCauses(donationCauseRows, idMap),
    donations: mapDonationRecords(donationRecordRows, idMap),
    makeupCredits: [],
    practiceLogs: [],
    notifications: [],
    roomLocks: [],
    teacherExceptions: [],
    consentRecords: [],
    complianceLogs: [],
    waitlist: [],
    achievements: [],
  };
}

export class PostgresAdapter extends MemoryDatabaseAdapter {
  readonly connectionString: string;
  readonly source: 'postgres' | 'fallback';
  readonly fallbackReason?: string;

  constructor(connectionString: string) {
    const allowFallback = process.env.ALLOW_DB_FALLBACK_TO_MOCK === '1';

    const { seed, source, fallbackReason } = (() => {
      try {
        return {
          seed: loadSeedFromPostgres(connectionString),
          source: 'postgres' as const,
          fallbackReason: undefined,
        };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        if (!allowFallback) {
          throw new Error('[db/postgres] Failed to load from Postgres and fallback is disabled: ' + reason);
        }

        console.error('[db/postgres] Falling back to default in-memory seed (ALLOW_DB_FALLBACK_TO_MOCK=1):', error);
        return {
          seed: buildDefaultSeed(),
          source: 'fallback' as const,
          fallbackReason: reason,
        };
      }
    })();

    super(seed);
    this.connectionString = connectionString;
    this.source = source;
    this.fallbackReason = fallbackReason;

    if (this.source === 'postgres') {
      attachPostgresWriteThrough(this, this.connectionString);
    }
  }
}




















