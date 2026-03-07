import type {
  Alumnus,
  Branch,
  Conservatorium,
  ConservatoriumInstrument,
  EventProduction,
  Announcement,
  FormStatus,
  FormSubmission,
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
  DonationCause,
  DonationRecord,
} from '@/lib/types';
import { buildDefaultSeed, MemoryDatabaseAdapter, type MemorySeed } from './shared';
import type { RepertoireEntry } from '@/lib/db/types';

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

type RawDonationCause = {
  id: string;
  conservatorium_id: string;
  names: unknown;
  descriptions: unknown;
  category: string | null;
  priority: number | null;
  is_active: boolean;
  target_amount_ils: number | null;
  raised_amount_ils: number | null;
  image_url: string | null;
};

type RawDonationRecord = {
  id: string;
  conservatorium_id: string;
  cause_id: string;
  amount_ils: number;
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
  channels: string[] | null;
  sent_at: string;
};

type RawScholarship = {
  id: string;
  conservatorium_id: string;
  student_id: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

type RawRental = {
  id: string;
  conservatorium_id: string;
  instrument_name: string | null;
  student_id: string;
  parent_id: string | null;
  rental_model: string;
  deposit_amount_ils: number | null;
  monthly_fee_ils: number | null;
  purchase_price_ils: number | null;
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
  total: number;
  status: string;
  due_date: string;
  paid_at: string | null;
};

type RawConservatoriumInstrument = {
  id: string;
  conservatorium_id: string;
  instrument_catalog_id: string | null;
  names: unknown;
  is_active: boolean;
  available_for_registration: boolean;
  available_for_rental: boolean;
};

type RawTeacherProfileInstrument = {
  teacher_user_id: string;
  conservatorium_instrument_id: string;
};

type RawLessonPackage = {
  id: string;
  conservatorium_id: string;
  names: unknown;
  type: string;
  lesson_count: number | null;
  duration_minutes: number;
  price_ils: number;
  is_active: boolean;
};

type RawLessonPackageInstrument = {
  lesson_package_id: string;
  conservatorium_instrument_id: string;
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
  price_ils: number | null;
  status: string | null;
};

const TIER_CYCLE: Conservatorium['tier'][] = ['A', 'B', 'C'];

function readLocalized(value: { he?: string; en?: string } | string | null | undefined, locale: 'he' | 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.he || value.en || '';
}

function readLocalizedObject(value: unknown): { he?: string; en?: string; ru?: string; ar?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as { he?: string; en?: string; ru?: string; ar?: string };
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string') as string[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
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
      gender: row.gender === 'female' ? 'נקבה' : row.gender === 'male' ? 'זכר' : undefined,
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
    instrument: 'כלי נגינה',
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

function mapBranches(rows: RawBranch[]): Branch[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
    name: row.name,
    address: row.address || row.phone || '',
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



function mapConservatoriumInstruments(
  rows: RawConservatoriumInstrument[],
  teacherProfileInstrumentRows: RawTeacherProfileInstrument[]
): ConservatoriumInstrument[] {
  const counts = new Map<string, Set<string>>();
  for (const row of teacherProfileInstrumentRows) {
    if (!counts.has(row.conservatorium_instrument_id)) counts.set(row.conservatorium_instrument_id, new Set());
    counts.get(row.conservatorium_instrument_id)?.add(row.teacher_user_id);
  }

  return rows.map((row) => {
    const names = readLocalizedObject(row.names);
    const fallbackName = names.he || names.en || row.instrument_catalog_id || 'Instrument';
    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      instrumentCatalogId: row.instrument_catalog_id || undefined,
      names: {
        he: names.he || fallbackName,
        en: names.en || fallbackName,
        ru: names.ru || undefined,
        ar: names.ar || undefined,
      },
      isActive: row.is_active,
      teacherCount: counts.get(row.id)?.size || 0,
      availableForRegistration: row.available_for_registration,
      availableForRental: row.available_for_rental,
    };
  });
}

function mapPackageType(value: string): LessonPackage['type'] {
  if (value === 'monthly' || value === 'semester' || value === 'annual' || value === 'single') return value;
  return 'single';
}

function mapLessonPackages(
  rows: RawLessonPackage[],
  links: RawLessonPackageInstrument[],
  conservatoriumInstruments: ConservatoriumInstrument[]
): LessonPackage[] {
  const byPackage = new Map<string, string[]>();
  for (const link of links) {
    if (!byPackage.has(link.lesson_package_id)) byPackage.set(link.lesson_package_id, []);
    byPackage.get(link.lesson_package_id)?.push(link.conservatorium_instrument_id);
  }

  const ciById = new Map(conservatoriumInstruments.map((ci) => [ci.id, ci]));

  return rows.map((row) => {
    const names = readLocalizedObject(row.names);
    const fallbackName = names.he || names.en || 'Package';
    const conservatoriumInstrumentIds = byPackage.get(row.id) || [];
    const instrumentCatalogIds = conservatoriumInstrumentIds
      .map((id) => ciById.get(id)?.instrumentCatalogId)
      .filter((id): id is string => Boolean(id));
    const instruments = instrumentCatalogIds;

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      names: {
        he: names.he || fallbackName,
        en: names.en || fallbackName,
        ru: names.ru || undefined,
        ar: names.ar || undefined,
      },
      type: mapPackageType(row.type),
      lessonCount: row.lesson_count,
      durationMinutes: toDuration(row.duration_minutes ?? 60),
      priceILS: Number(row.price_ils || 0),
      isActive: row.is_active,
      instruments,
      conservatoriumInstrumentIds,
      instrumentCatalogIds,
    };
  });
}

function mapCompositions(rows: RawComposition[]): RepertoireEntry[] {
  return rows.map((row) => {
    const composerNames = readLocalizedObject(row.composer_names);
    const titles = readLocalizedObject(row.titles);
    const instrumentNames = readLocalizedObject(row.instrument_names);
    const composer = composerNames.he || composerNames.en || 'Unknown Composer';
    const title = titles.he || titles.en || 'Untitled';
    const instrument = instrumentNames.he || instrumentNames.en;

    return {
      id: row.id,
      composer,
      composerId: row.id,
      composerNames: {
        he: composerNames.he || composer,
        en: composerNames.en || composer,
        ru: composerNames.ru || undefined,
        ar: composerNames.ar || undefined,
      },
      title,
      titles: {
        he: titles.he || title,
        en: titles.en || title,
        ru: titles.ru || undefined,
        ar: titles.ar || undefined,
      },
      duration: '00:00',
      genre: row.genre || 'classical',
      instrument,
      approved: true,
      source: 'seed',
    } as RepertoireEntry;
  });
}

function mapAlumni(rows: RawAlumnus[], userMap: Map<string, string>): Alumnus[] {
  return rows.map((row) => {
    const bio = readLocalizedObject(row.bio);
    const socialLinks =
      row.social_links && typeof row.social_links === 'object' && !Array.isArray(row.social_links)
        ? (row.social_links as Record<string, unknown>)
        : {};

    return {
      id: row.user_id,
      userId: row.user_id,
      conservatoriumId: row.conservatorium_id,
      displayName: userMap.get(row.user_id) || 'Alumnus',
      graduationYear: row.graduation_year ?? new Date().getFullYear(),
      primaryInstrument: row.primary_instrument || 'General Music',
      currentOccupation: row.current_occupation || undefined,
      bio: {
        he: bio.he,
        en: bio.en,
        ru: bio.ru,
        ar: bio.ar,
      },
      profilePhotoUrl: row.profile_photo_url || undefined,
      isPublic: row.is_public,
      achievements: parseStringArray(row.achievements),
      socialLinks: {
        website: typeof socialLinks.website === 'string' ? socialLinks.website : undefined,
        youtube: typeof socialLinks.youtube === 'string' ? socialLinks.youtube : undefined,
        spotify: typeof socialLinks.spotify === 'string' ? socialLinks.spotify : undefined,
        instagram: typeof socialLinks.instagram === 'string' ? socialLinks.instagram : undefined,
      },
      availableForMasterClasses: row.available_for_master_classes,
    };
  });
}

function mapMasterClasses(rows: RawMasterClass[], userMap: Map<string, string>): Masterclass[] {
  return rows.map((row) => {
    const title = readLocalizedObject(row.title);
    const description = readLocalizedObject(row.description);
    const targetAudience: Masterclass['targetAudience'] =
      row.target_audience === 'beginners' ||
      row.target_audience === 'intermediate' ||
      row.target_audience === 'advanced' ||
      row.target_audience === 'all'
        ? row.target_audience
        : 'all';
    const status: Masterclass['status'] =
      row.status === 'published' || row.status === 'completed' || row.status === 'cancelled' || row.status === 'draft'
        ? row.status
        : 'draft';

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      title: {
        he: title.he || title.en || 'מאסטרקלאס',
        en: title.en || title.he || 'Master Class',
        ru: title.ru || undefined,
        ar: title.ar || undefined,
      },
      description: {
        he: description.he || description.en || '',
        en: description.en || description.he || '',
        ru: description.ru || undefined,
        ar: description.ar || undefined,
      },
      instructor: {
        userId: row.instructor_id,
        displayName: userMap.get(row.instructor_id) || 'Instructor',
        instrument: row.instrument || 'General Music',
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
      status,
      registrations: [],
    };
  });
}

function mapDonationCauses(rows: RawDonationCause[]): DonationCause[] {
  return rows.map((row) => {
    const names = readLocalizedObject(row.names);
    const descriptions = readLocalizedObject(row.descriptions);
    const fallbackName = names.he || names.en || 'Donation Cause';
    const fallbackDescription = descriptions.he || descriptions.en || '';

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      names: {
        he: names.he || fallbackName,
        en: names.en || fallbackName,
        ru: names.ru || undefined,
        ar: names.ar || undefined,
      },
      descriptions: {
        he: descriptions.he || fallbackDescription,
        en: descriptions.en || fallbackDescription,
      },
      category: (row.category as DonationCause['category']) || 'general',
      priority: typeof row.priority === 'number' ? row.priority : 99,
      isActive: row.is_active,
      targetAmountILS: row.target_amount_ils ?? undefined,
      raisedAmountILS: row.raised_amount_ils ?? 0,
      imageUrl: row.image_url || undefined,
    };
  });
}

function mapDonationRecords(rows: RawDonationRecord[]): DonationRecord[] {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
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
function mapAnnouncements(rows: RawAnnouncement[]) {
  return rows.map((row) => {
    const channels: Announcement['channels'] = Array.isArray(row.channels)
      ? row.channels.filter(
          (value): value is 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' =>
            value === 'IN_APP' || value === 'EMAIL' || value === 'SMS' || value === 'WHATSAPP'
        )
      : [];

    const targetAudience: Announcement['targetAudience'] =
      row.target_audience === 'STUDENTS' ||
      row.target_audience === 'PARENTS' ||
      row.target_audience === 'TEACHERS'
        ? row.target_audience
        : 'ALL';

    const normalizedChannels: Announcement['channels'] = channels.length ? channels : ['IN_APP'];

    return {
      id: row.id,
      conservatoriumId: row.conservatorium_id,
      title: row.title,
      body: row.body,
      targetAudience,
      channels: normalizedChannels,
      sentAt: new Date(row.sent_at).toISOString(),
    };
  });
}

function mapScholarships(rows: RawScholarship[], userMap: Map<string, string>) {
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
      studentName: userMap.get(row.student_id) || 'Student',
      instrument: 'Instrument',
      conservatoriumId: row.conservatorium_id,
      academicYear: '2025/2026',
      status,
      submittedAt: new Date(row.created_at).toISOString(),
      priorityScore: 0,
      paymentStatus,
      paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : undefined,
    };
  });
}

function mapRentals(rows: RawRental[]) {
  return rows.map((row) => ({
    id: row.id,
    conservatoriumId: row.conservatorium_id,
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
function mapPayments(rows: RawInvoice[]): Invoice[] {
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
      ? parsedItems.map((item: any) => ({
          description: String(item?.description || ''),
          total: Number(item?.total || 0),
        }))
      : [];

    const status: Invoice['status'] =
      row.status === 'DRAFT' || row.status === 'SENT' || row.status === 'PAID' || row.status === 'OVERDUE' || row.status === 'CANCELLED'
        ? row.status
        : 'SENT';

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      conservatoriumId: row.conservatorium_id,
      payerId: row.payer_id,
      lineItems,
      total: Number(row.total || 0),
      status,
      dueDate: row.due_date,
      paidAt: row.paid_at || undefined,
    };
  });
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
  const [conservatoriumRows, userRows, lessonRows, formRows, roomRows, branchRows, eventRows, payrollRows, donationCauseRows, scholarshipRows, rentalRows, invoiceRows, conservatoriumInstrumentRows, teacherProfileInstrumentRows, lessonPackageRows, lessonPackageInstrumentRows, compositionRows, alumnusRows, masterClassRows] = await Promise.all([
    fetchTable<RawConservatorium>(url, serviceKey, 'conservatoriums', 'id,name,city,address,phone,email,website_url,established_year'),
    fetchTable<RawUser>(url, serviceKey, 'users', 'id,conservatorium_id,email,role,first_name,last_name,national_id,phone,city,gender,is_active,created_at'),
    fetchTable<RawLesson>(url, serviceKey, 'lessons', 'id,conservatorium_id,student_id,teacher_id,room_id,scheduled_at,duration_minutes,status'),
    fetchTable<RawForm>(url, serviceKey, 'forms', 'id,conservatorium_id,type,student_id,status,submitted_at,form_data'),
    fetchTable<RawRoom>(url, serviceKey, 'rooms', 'id,conservatorium_id,branch_id,name,capacity,instrument_equipment'),
    fetchTable<RawBranch>(url, serviceKey, 'branches', 'id,conservatorium_id,name,address,phone'),
    fetchTable<RawEvent>(url, serviceKey, 'events', 'id,conservatorium_id,title,venue,event_date,event_time,status'),
    fetchTable<RawPayroll>(url, serviceKey, 'payroll_snapshots', 'id,conservatorium_id,teacher_id,period_year,period_month,total_minutes,generated_at'),
    fetchTable<RawDonationCause>(url, serviceKey, 'donation_causes', 'id,conservatorium_id,names,descriptions,category,priority,is_active,target_amount_ils,raised_amount_ils,image_url'),
    fetchTable<RawScholarship>(url, serviceKey, 'scholarship_applications', 'id,conservatorium_id,student_id,status,created_at,paid_at'),
    fetchTable<RawRental>(url, serviceKey, 'instrument_rentals', 'id,conservatorium_id,instrument_name,student_id,parent_id,rental_model,deposit_amount_ils,monthly_fee_ils,purchase_price_ils,start_date,expected_return_date,actual_return_date,status,condition,notes,created_at'),
    fetchTable<RawInvoice>(url, serviceKey, 'invoices', 'id,conservatorium_id,invoice_number,payer_id,line_items,total,status,due_date,paid_at'),
    fetchTable<RawConservatoriumInstrument>(url, serviceKey, 'conservatorium_instruments', 'id,conservatorium_id,instrument_catalog_id,names,is_active,available_for_registration,available_for_rental'),
    fetchTable<RawTeacherProfileInstrument>(url, serviceKey, 'teacher_profile_instruments', 'teacher_user_id,conservatorium_instrument_id'),
    fetchTable<RawLessonPackage>(url, serviceKey, 'lesson_packages', 'id,conservatorium_id,names,type,lesson_count,duration_minutes,price_ils,is_active'),
    fetchTable<RawLessonPackageInstrument>(url, serviceKey, 'lesson_package_instruments', 'lesson_package_id,conservatorium_instrument_id'),
    fetchTable<RawComposition>(url, serviceKey, 'repertoire_library', 'id,composer_names,titles,genre,instrument_names'),
    fetchTable<RawAlumnus>(url, serviceKey, 'alumni_profiles', 'user_id,conservatorium_id,graduation_year,primary_instrument,current_occupation,bio,profile_photo_url,is_public,achievements,social_links,available_for_master_classes'),
    fetchTable<RawMasterClass>(url, serviceKey, 'master_classes', 'id,conservatorium_id,title,description,instructor_id,instrument,max_participants,target_audience,event_date,start_time,duration_minutes,location,is_online,stream_url,included_in_package,price_ils,status'),
  ]);

  const conservatoriumSeed = mapConservatoriums(conservatoriumRows);
  const conservatoriumMap = new Map(conservatoriumSeed.map((item) => [item.id, item.name]));
  const userSeed = mapUsers(userRows, conservatoriumMap);
  const userMap = new Map(userSeed.map((item) => [item.id, item.name]));
  const conservatoriumInstrumentSeed = mapConservatoriumInstruments(conservatoriumInstrumentRows, teacherProfileInstrumentRows);
  const lessonPackageSeed = mapLessonPackages(lessonPackageRows, lessonPackageInstrumentRows, conservatoriumInstrumentSeed);
  const repertoireSeed = mapCompositions(compositionRows);
  let donationRecordRows: RawDonationRecord[] = [];
  try {
    donationRecordRows = await fetchTable<RawDonationRecord>(
      url,
      serviceKey,
      'donation_records',
      'id,conservatorium_id,cause_id,amount_ils,frequency,donor_name,donor_email,donor_user_id,status,created_at'
    );
  } catch {
    donationRecordRows = [];
  }

  let announcementRows: RawAnnouncement[] = [];
  try {
    announcementRows = await fetchTable<RawAnnouncement>(
      url,
      serviceKey,
      'announcements',
      'id,conservatorium_id,title,body,target_audience,channels,sent_at'
    );
  } catch {
    announcementRows = [];
  }

  return {
    users: userSeed,
    conservatoriums: conservatoriumSeed,
    conservatoriumInstruments: conservatoriumInstrumentSeed,
    lessonPackages: lessonPackageSeed,
    lessons: mapLessons(lessonRows),
    branches: mapBranches(branchRows),
    rooms: mapRooms(roomRows),
    events: mapEvents(eventRows),
    forms: mapForms(formRows, conservatoriumMap, userMap),
    scholarships: mapScholarships(scholarshipRows, userMap),
    rentals: mapRentals(rentalRows),
    payments: mapPayments(invoiceRows),
    payrolls: mapPayroll(payrollRows, userMap),
    announcements: mapAnnouncements(announcementRows),
    alumni: mapAlumni(alumnusRows, userMap),
    masterClasses: mapMasterClasses(masterClassRows, userMap),
    repertoire: repertoireSeed,
    donationCauses: mapDonationCauses(donationCauseRows),
    donations: mapDonationRecords(donationRecordRows),
    makeupCredits: [],
    practiceLogs: [],
    notifications: [],
    roomLocks: [],
    teacherExceptions: [],
    consentRecords: [],
    complianceLogs: [],
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
    const allowFallback = process.env.ALLOW_DB_FALLBACK_TO_MOCK === '1';

    try {
      const seed = await loadSeedFromSupabase(url, serviceKey);
      return new SupabaseAdapter(url, serviceKey, seed);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (!allowFallback) {
        throw new Error('[db/supabase] Failed to load from Supabase and fallback is disabled: ' + reason);
      }

      console.error('[db/supabase] Falling back to default in-memory seed (ALLOW_DB_FALLBACK_TO_MOCK=1):', error);
      return new SupabaseAdapter(url, serviceKey, buildDefaultSeed());
    }
  }
}

















