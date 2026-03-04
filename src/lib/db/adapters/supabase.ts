import type {
  Conservatorium,
  EventProduction,
  FormStatus,
  FormSubmission,
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
  name: { he?: string; en?: string } | string;
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
  scheduled_at: string;
  duration_minutes: number;
  status: string;
};

type RawForm = {
  id: string;
  conservatorium_id: string;
  type: string;
  student_id: string | null;
  status: string;
  submitted_at: string;
  form_data: Record<string, unknown>;
};

type RawRoom = {
  id: string;
  conservatorium_id: string;
  branch_id: string | null;
  name: string;
  capacity: number | null;
  instrument_equipment: Array<{ instrumentId?: string; quantity?: number; notes?: string }> | null;
};

type RawEvent = {
  id: string;
  conservatorium_id: string;
  title: { he?: string; en?: string } | string;
  venue: { he?: string; en?: string } | string | null;
  event_date: string;
  event_time: string | null;
  status: string;
};

type RawPayroll = {
  id: string;
  conservatorium_id: string;
  teacher_id: string;
  period_year: number;
  period_month: number;
  total_minutes: number;
  generated_at: string;
};

const TIER_CYCLE: Conservatorium['tier'][] = ['A', 'B', 'C'];

function readLocalized(value: { he?: string; en?: string } | string | null | undefined, locale: 'he' | 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.he || value.en || '';
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
  if (status === 'draft') return 'PLANNING';
  if (status === 'completed') return 'COMPLETED';
  return 'OPEN_REGISTRATION';
}

function toDuration(value: number): 30 | 45 | 60 {
  if (value === 30 || value === 45 || value === 60) return value;
  return 45;
}

function mapConservatoriums(rows: RawConservatorium[]): Conservatorium[] {
  return rows.map((row, index) => ({
    id: row.id,
    name: readLocalized(row.name, 'he'),
    nameEn: readLocalized(row.name, 'en') || undefined,
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

function mapUsers(rows: RawUser[], conservatoriumMap: Map<string, string>): User[] {
  return rows.map((row) => {
    const mappedRole = mapRole(row.role);
    return {
      id: row.id,
      name: (row.first_name + ' ' + row.last_name).trim(),
      email: row.email,
      role: mappedRole,
      conservatoriumId: row.conservatorium_id ?? 'global',
      conservatoriumName: (row.conservatorium_id && conservatoriumMap.get(row.conservatorium_id)) || 'Harmonia',
      idNumber: row.national_id ?? undefined,
      phone: row.phone ?? undefined,
      city: row.city ?? undefined,
      gender: row.gender === 'female' ? '????' : row.gender === 'male' ? '???' : undefined,
      approved: row.is_active,
      createdAt: row.created_at,
      achievements: [],
      notifications: [],
      isDelegatedAdmin: row.role === 'DELEGATED_ADMIN',
      isPrimaryConservatoriumAdmin: row.role === 'CONSERVATORIUM_ADMIN',
    };
  });
}

function mapLessons(rows: RawLesson[]): LessonSlot[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    teacherId: row.teacher_id,
    studentId: row.student_id,
    instrument: '??? ?????',
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

function mapForms(rows: RawForm[], conservatoriumMap: Map<string, string>, userMap: Map<string, string>): FormSubmission[] {
  return rows.map((row) => ({
    id: row.id,
    formType: row.type,
    conservatoriumId: row.conservatorium_id,
    conservatoriumName: conservatoriumMap.get(row.conservatorium_id) || 'Conservatorium',
    studentId: row.student_id ?? 'unknown-student',
    studentName: (row.student_id && userMap.get(row.student_id)) || 'Student',
    status: mapFormStatus(row.status),
    submissionDate: new Date(row.submitted_at).toISOString().slice(0, 10),
    totalDuration: '00:00',
    repertoire: [],
    formData: row.form_data || {},
  }));
}

function mapRooms(rows: RawRoom[]): Room[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    branchId: row.branch_id ?? 'branch-1',
    name: row.name,
    capacity: row.capacity ?? 1,
    instrumentEquipment: (row.instrument_equipment || [])
      .filter((item) => Boolean(item.instrumentId))
      .map((item) => ({
        instrumentId: item.instrumentId as string,
        quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        notes: item.notes || undefined,
      })),
    blocks: [],
    isActive: true,
    equipment: (row.instrument_equipment || [])
      .filter((item) => Boolean(item.instrumentId))
      .map((item) => [item.instrumentId, item.notes].filter(Boolean).join(' - ')),
  }));
}

function mapEvents(rows: RawEvent[]): EventProduction[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    name: readLocalized(row.title, 'he') || 'Event',
    type: 'CONCERT',
    venue: readLocalized(row.venue, 'he') || '',
    eventDate: row.event_date,
    startTime: row.event_time?.slice(0, 5) ?? '18:00',
    status: mapEventStatus(row.status),
    program: [],
  }));
}

function mapPayroll(rows: RawPayroll[], userMap: Map<string, string>): PayrollSummary[] {
  return rows.map((row) => {
    const month = String(row.period_month).padStart(2, '0');
    const periodStart = row.period_year + '-' + month + '-01';
    const periodEnd = new Date(Date.UTC(row.period_year, row.period_month, 0)).toISOString().slice(0, 10);
    const grossPay = Number(row.total_minutes ?? 0);

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      teacherId: row.teacher_id,
      teacherName: userMap.get(row.teacher_id) || 'Teacher',
      periodStart,
      periodEnd,
      completedLessons: [],
      totalHours: Number((Number(row.total_minutes ?? 0) / 60).toFixed(2)),
      grossPay,
      totalAmount: grossPay,
      status: 'APPROVED',
      paymentDate: new Date(row.generated_at).toISOString(),
    };
  });
}

async function fetchTable<T>(url: string, serviceKey: string, table: string, select: string): Promise<T[]> {
  const endpoint = url.replace(/\/$/, '') + '/rest/v1/' + table + '?select=' + encodeURIComponent(select);
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error('[db/supabase] ' + table + ' fetch failed (' + response.status + '): ' + body);
  }

  return (await response.json()) as T[];
}

async function loadSeedFromSupabase(url: string, serviceKey: string): Promise<MemorySeed> {
  const [conservatoriumRows, userRows, lessonRows, formRows, roomRows, eventRows, payrollRows] = await Promise.all([
    fetchTable<RawConservatorium>(url, serviceKey, 'conservatoriums', 'id,name,city,address,phone,email,website_url,established_year'),
    fetchTable<RawUser>(url, serviceKey, 'users', 'id,conservatorium_id,email,role,first_name,last_name,national_id,phone,city,gender,is_active,created_at'),
    fetchTable<RawLesson>(url, serviceKey, 'lessons', 'id,conservatorium_id,student_id,teacher_id,room_id,scheduled_at,duration_minutes,status'),
    fetchTable<RawForm>(url, serviceKey, 'forms', 'id,conservatorium_id,type,student_id,status,submitted_at,form_data'),
    fetchTable<RawRoom>(url, serviceKey, 'rooms', 'id,conservatorium_id,branch_id,name,capacity,instrument_equipment'),
    fetchTable<RawEvent>(url, serviceKey, 'events', 'id,conservatorium_id,title,venue,event_date,event_time,status'),
    fetchTable<RawPayroll>(url, serviceKey, 'payroll_snapshots', 'id,conservatorium_id,teacher_id,period_year,period_month,total_minutes,generated_at'),
  ]);

  const conservatoriumSeed = mapConservatoriums(conservatoriumRows);
  const conservatoriumMap = new Map(conservatoriumSeed.map((item) => [item.id, item.name]));
  const userSeed = mapUsers(userRows, conservatoriumMap);
  const userMap = new Map(userSeed.map((item) => [item.id, item.name]));

  return {
    users: userSeed,
    conservatoriums: conservatoriumSeed,
    lessons: mapLessons(lessonRows),
    rooms: mapRooms(roomRows),
    events: mapEvents(eventRows),
    forms: mapForms(formRows, conservatoriumMap, userMap),
    scholarships: [],
    rentals: [],
    payments: [],
    payrolls: mapPayroll(payrollRows, userMap),
    announcements: [],
    alumni: [],
    masterClasses: [],
  };
}

export class SupabaseAdapter extends MemoryDatabaseAdapter {
  readonly url: string;
  readonly serviceKey: string;

  constructor(url: string, serviceKey: string, seed: MemorySeed) {
    super(seed);
    this.url = url;
    this.serviceKey = serviceKey;
  }

  static async create(url: string, serviceKey: string): Promise<SupabaseAdapter> {
    try {
      const seed = await loadSeedFromSupabase(url, serviceKey);
      return new SupabaseAdapter(url, serviceKey, seed);
    } catch (error) {
      console.error('[db/supabase] Falling back to default in-memory seed:', error);
      return new SupabaseAdapter(url, serviceKey, buildDefaultSeed());
    }
  }
}
