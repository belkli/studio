import { spawnSync } from 'node:child_process';
import type { DatabaseAdapter } from '@/lib/db/types';
import type {
  Branch,
  Conservatorium,
  ConservatoriumInstrument,
  Announcement,
  DonationCause,
  DonationRecord,
  EventProduction,
  FormSubmission,
  Invoice,
  LessonPackage,
  LessonSlot,
  Masterclass,
  PayrollSummary,
  Room,
  ScholarshipApplication,
  User,
} from '@/lib/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

function sqlString(value: string): string {
  return "'" + value.replace(/'/g, "''") + "'";
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'object') return sqlString(JSON.stringify(value)) + '::jsonb';
  return sqlString(String(value));
}

function runPsqlExecute(connectionString: string, sql: string): void {
  const result = spawnSync(
    'psql',
    [
      '--no-psqlrc',
      '--quiet',
      '--dbname',
      connectionString,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || 'psql execute failed');
  }
}

type Repo<T extends { id: string }> = {
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
};

function withWriteThrough<T extends { id: string }>(
  repo: Repo<T>,
  hooks: { upsert?: (record: T) => Promise<void>; remove?: (id: string) => Promise<void> }
): Repo<T> {
  return {
    ...repo,
    async create(data: Partial<T>): Promise<T> {
      const created = await repo.create(data);
      if (hooks.upsert) await hooks.upsert(created);
      return created;
    },
    async update(id: string, data: Partial<T>): Promise<T> {
      const updated = await repo.update(id, data);
      if (hooks.upsert) await hooks.upsert(updated);
      return updated;
    },
    async delete(id: string): Promise<void> {
      await repo.delete(id);
      if (hooks.remove) await hooks.remove(id);
    },
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const clean = (name || '').trim();
  if (!clean) return { firstName: 'Unknown', lastName: 'User' };
  const parts = clean.split(/\s+/);
  return { firstName: parts[0] || 'Unknown', lastName: parts.slice(1).join(' ') || parts[0] || 'User' };
}

function appRoleToDbRole(role: User['role']): string {
  switch (role) {
    case 'site_admin':
    case 'superadmin':
    case 'admin':
      return 'SITE_ADMIN';
    case 'conservatorium_admin':
      return 'CONSERVATORIUM_ADMIN';
    case 'delegated_admin':
      return 'DELEGATED_ADMIN';
    case 'teacher':
      return 'TEACHER';
    case 'parent':
      return 'PARENT';
    default:
      return 'STUDENT_OVER_13';
  }
}

function formStatusToDb(status: FormSubmission['status']): string {
  if (status === 'DRAFT') return 'DRAFT';
  if (status === 'APPROVED' || status === 'FINAL_APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'REVISION_REQUIRED') return 'REVISION_REQUIRED';
  return 'PENDING';
}

function eventStatusToDb(event: EventProduction): string {
  if (event.visibilityStatus === 'draft' || event.visibilityStatus === 'published' || event.visibilityStatus === 'cancelled' || event.visibilityStatus === 'completed') {
    return event.visibilityStatus;
  }
  if (event.status === 'COMPLETED') return 'completed';
  if (event.status === 'OPEN_REGISTRATION' || event.status === 'CLOSED') return 'published';
  return 'draft';
}

function lessonStatusToDb(status: LessonSlot['status'], type: LessonSlot['type']): string {
  if (type === 'MAKEUP') return 'makeup';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'SCHEDULED') return 'scheduled';
  return 'cancelled';
}

function lessonPackageTypeToDb(type: LessonPackage['type']): string {
  if (type === 'monthly' || type === 'semester' || type === 'annual' || type === 'single') {
    return type;
  }
  return 'single';
}

function announcementTargetToDb(target: Announcement['targetAudience'] | undefined): string {
  if (target === 'STUDENTS' || target === 'PARENTS' || target === 'TEACHERS') return target;
  return 'ALL';
}

function sanitizeChannels(channels: Announcement['channels'] | undefined): Array<'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'> {
  if (!Array.isArray(channels)) return ['IN_APP'];
  const valid = channels.filter((channel): channel is 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' =>
    channel === 'IN_APP' || channel === 'EMAIL' || channel === 'SMS' || channel === 'WHATSAPP'
  );
  return valid.length ? valid : ['IN_APP'];
}

function scholarshipStatusToDb(status: ScholarshipApplication['status'] | undefined): string {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

function invoiceStatusToDb(status: Invoice['status'] | undefined): string {
  if (status === 'DRAFT' || status === 'SENT' || status === 'PAID' || status === 'OVERDUE' || status === 'CANCELLED') {
    return status;
  }
  return 'SENT';
}

function rentalStatusToDb(status: string | undefined): string {
  if (status === 'pending_signature' || status === 'active' || status === 'returned' || status === 'overdue' || status === 'purchased') {
    return status;
  }
  return 'pending_signature';
}

function rentalConditionToDb(condition: string | undefined): string {
  if (condition === 'excellent' || condition === 'good' || condition === 'fair' || condition === 'damaged') {
    return condition;
  }
  return 'good';
}

function donationStatusToDb(status: DonationRecord['status'] | undefined): string {
  if (status === 'PAID' || status === 'FAILED') return status;
  return 'INITIATED';
}

function masterClassStatusToDb(status: Masterclass['status'] | undefined): string {
  if (status === 'draft' || status === 'published' || status === 'completed' || status === 'cancelled') return status;
  return 'draft';
}

function masterClassAudienceToDb(audience: Masterclass['targetAudience'] | undefined): string {
  if (audience === 'beginners' || audience === 'intermediate' || audience === 'advanced' || audience === 'all') return audience;
  return 'all';
}

function donationCategoryToDb(category: DonationCause['category'] | undefined): string {
  if (category === 'financial_aid' || category === 'excellence' || category === 'equipment' || category === 'events' || category === 'general') {
    return category;
  }
  return 'general';
}


function jsonbI18nFromText(value: string | undefined): Record<string, string> | null {
  const text = (value || '').trim();
  if (!text) return null;
  return { he: text, en: text, ar: text, ru: text };
}
export function attachPostgresWriteThrough(adapter: DatabaseAdapter, connectionString: string): void {
  adapter.conservatoriums = withWriteThrough(
    adapter.conservatoriums as unknown as Repo<Conservatorium>,
    {
      upsert: async (conservatorium) => {
        if (!isUuid(conservatorium.id)) return;
        const localizedName = {
          he: conservatorium.name || 'Conservatorium',
          en: conservatorium.nameEn || conservatorium.name || 'Conservatorium',
        };
        const description = {
          about: conservatorium.about || null,
          translations: conservatorium.translations || {},
          teachers: conservatorium.teachers || [],
          programs: conservatorium.programs || [],
          departments: conservatorium.departments || [],
          branchesInfo: conservatorium.branchesInfo || [],
          socialMedia: conservatorium.socialMedia || {},
          location: conservatorium.location || {},
          manager: conservatorium.manager || null,
          leadingTeam: conservatorium.leadingTeam || [],
          photoUrls: conservatorium.photoUrls || [],
        };
        runPsqlExecute(
          connectionString,
          `
            INSERT INTO conservatoriums (
              id, name, description, city, address, phone, email, website_url, logo_url,
              established_year, opening_hours, is_active, updated_at
            ) VALUES (
              ${sqlValue(conservatorium.id)}, ${sqlValue(localizedName)}, ${sqlValue(description)},
              ${sqlValue(conservatorium.location?.city || null)}, ${sqlValue(conservatorium.location?.address || null)},
              ${sqlValue(conservatorium.tel || null)}, ${sqlValue(conservatorium.email || null)},
              ${sqlValue(conservatorium.officialSite || null)}, ${sqlValue(conservatorium.photoUrls?.[0] || null)},
              ${sqlValue(conservatorium.foundedYear || null)}, ${sqlValue(conservatorium.openingHoursByDay || null)},
              TRUE, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              city = EXCLUDED.city,
              address = EXCLUDED.address,
              phone = EXCLUDED.phone,
              email = EXCLUDED.email,
              website_url = EXCLUDED.website_url,
              logo_url = EXCLUDED.logo_url,
              established_year = EXCLUDED.established_year,
              opening_hours = EXCLUDED.opening_hours,
              is_active = EXCLUDED.is_active,
              updated_at = NOW();
          `
        );
      },
      remove: async (id) => {
        if (!isUuid(id)) return;
        runPsqlExecute(connectionString, `DELETE FROM conservatoriums WHERE id = ${sqlValue(id)};`);
      },
    }
  ) as unknown as typeof adapter.conservatoriums;

  adapter.conservatoriumInstruments = withWriteThrough(
    adapter.conservatoriumInstruments as unknown as Repo<ConservatoriumInstrument>,
    {
      upsert: async (instrument) => {
        if (!isUuid(instrument.id) || !isUuid(instrument.conservatoriumId)) return;
        runPsqlExecute(
          connectionString,
          `
            INSERT INTO conservatorium_instruments (
              id, conservatorium_id, instrument_catalog_id, names, is_active,
              available_for_registration, available_for_rental
            ) VALUES (
              ${sqlValue(instrument.id)}, ${sqlValue(instrument.conservatoriumId)}, ${sqlValue(instrument.instrumentCatalogId || null)},
              ${sqlValue(instrument.names)}, ${sqlValue(instrument.isActive)},
              ${sqlValue(instrument.availableForRegistration)}, ${sqlValue(instrument.availableForRental)}
            )
            ON CONFLICT (id) DO UPDATE SET
              conservatorium_id = EXCLUDED.conservatorium_id,
              instrument_catalog_id = EXCLUDED.instrument_catalog_id,
              names = EXCLUDED.names,
              is_active = EXCLUDED.is_active,
              available_for_registration = EXCLUDED.available_for_registration,
              available_for_rental = EXCLUDED.available_for_rental;
          `
        );
      },
      remove: async (id) => {
        if (!isUuid(id)) return;
        runPsqlExecute(connectionString, `DELETE FROM conservatorium_instruments WHERE id = ${sqlValue(id)};`);
      },
    }
  ) as unknown as typeof adapter.conservatoriumInstruments;

  adapter.lessonPackages = withWriteThrough(
    adapter.lessonPackages as unknown as Repo<LessonPackage>,
    {
      upsert: async (pkg) => {
        if (!isUuid(pkg.id) || !isUuid(pkg.conservatoriumId)) return;
        runPsqlExecute(
          connectionString,
          `
            INSERT INTO lesson_packages (
              id, conservatorium_id, names, type, lesson_count, duration_minutes,
              price_ils, is_active
            ) VALUES (
              ${sqlValue(pkg.id)}, ${sqlValue(pkg.conservatoriumId)}, ${sqlValue(pkg.names)},
              ${sqlValue(lessonPackageTypeToDb(pkg.type))}, ${sqlValue(pkg.lessonCount)},
              ${sqlValue(pkg.durationMinutes)}, ${sqlValue(pkg.priceILS)}, ${sqlValue(pkg.isActive)}
            )
            ON CONFLICT (id) DO UPDATE SET
              conservatorium_id = EXCLUDED.conservatorium_id,
              names = EXCLUDED.names,
              type = EXCLUDED.type,
              lesson_count = EXCLUDED.lesson_count,
              duration_minutes = EXCLUDED.duration_minutes,
              price_ils = EXCLUDED.price_ils,
              is_active = EXCLUDED.is_active;
          `
        );

        const explicitIds = Array.isArray(pkg.conservatoriumInstrumentIds)
          ? pkg.conservatoriumInstrumentIds.filter((id) => isUuid(id))
          : [];
        runPsqlExecute(
          connectionString,
          `
              DELETE FROM lesson_package_instruments
              WHERE lesson_package_id = ${sqlValue(pkg.id)};
            `
        );

        if (explicitIds.length > 0) {
          const values = explicitIds
            .map((instrumentId) => `(${sqlValue(pkg.id)}, ${sqlValue(instrumentId)})`)
            .join(', ');
          runPsqlExecute(
            connectionString,
            `
                INSERT INTO lesson_package_instruments (lesson_package_id, conservatorium_instrument_id)
                VALUES ${values}
                ON CONFLICT (lesson_package_id, conservatorium_instrument_id) DO NOTHING;
              `
          );
        }
      },
      remove: async (id) => {
        if (!isUuid(id)) return;
        runPsqlExecute(connectionString, `DELETE FROM lesson_packages WHERE id = ${sqlValue(id)};`);
      },
    }
  ) as unknown as typeof adapter.lessonPackages;

  adapter.lessons = withWriteThrough(adapter.lessons as unknown as Repo<LessonSlot>, {
    upsert: async (lesson) => {
      if (!isUuid(lesson.id) || !isUuid(lesson.conservatoriumId) || !isUuid(lesson.studentId) || !isUuid(lesson.teacherId)) return;
      const roomId = lesson.roomId && isUuid(lesson.roomId) ? lesson.roomId : null;
      const instrumentId = lesson.instrument && isUuid(lesson.instrument) ? lesson.instrument : null;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO lessons (
            id, conservatorium_id, student_id, teacher_id, room_id, instrument_id,
            scheduled_at, duration_minutes, status, absence_reason, notes
          ) VALUES (
            ${sqlValue(lesson.id)}, ${sqlValue(lesson.conservatoriumId)}, ${sqlValue(lesson.studentId)}, ${sqlValue(lesson.teacherId)},
            ${sqlValue(roomId)}, ${sqlValue(instrumentId)}, ${sqlValue(lesson.startTime)}, ${sqlValue(lesson.durationMinutes)},
            ${sqlValue(lessonStatusToDb(lesson.status, lesson.type))}::lesson_status,
            ${sqlValue(lesson.cancellationReason || null)}, ${sqlValue(lesson.teacherNote || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            student_id = EXCLUDED.student_id,
            teacher_id = EXCLUDED.teacher_id,
            room_id = EXCLUDED.room_id,
            instrument_id = EXCLUDED.instrument_id,
            scheduled_at = EXCLUDED.scheduled_at,
            duration_minutes = EXCLUDED.duration_minutes,
            status = EXCLUDED.status,
            absence_reason = EXCLUDED.absence_reason,
            notes = EXCLUDED.notes;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM lessons WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.lessons;

  adapter.announcements = withWriteThrough(adapter.announcements as unknown as Repo<Announcement>, {
    upsert: async (announcement) => {
      if (!isUuid(announcement.id) || !isUuid(announcement.conservatoriumId)) return;
      const channels = sanitizeChannels(announcement.channels);
      const targetAudience = announcementTargetToDb(announcement.targetAudience);
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO announcements (
            id, conservatorium_id, title, body, target_audience, channels, sent_at
          ) VALUES (
            ${sqlValue(announcement.id)}, ${sqlValue(announcement.conservatoriumId)}, ${sqlValue(announcement.title || '')},
            ${sqlValue(announcement.body || '')}, ${sqlValue(targetAudience)}, ${sqlValue(channels)}::text[],
            ${sqlValue(announcement.sentAt || new Date().toISOString())}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            title = EXCLUDED.title,
            body = EXCLUDED.body,
            target_audience = EXCLUDED.target_audience,
            channels = EXCLUDED.channels,
            sent_at = EXCLUDED.sent_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM announcements WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.announcements;

  adapter.scholarships = withWriteThrough(adapter.scholarships as unknown as Repo<ScholarshipApplication>, {
    upsert: async (scholarship) => {
      if (!isUuid(scholarship.id) || !isUuid(scholarship.conservatoriumId) || !isUuid(scholarship.studentId)) return;
      const status = scholarshipStatusToDb(scholarship.status);
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO scholarship_applications (
            id, conservatorium_id, student_id, amount_ils, reason, status, paid_at
          ) VALUES (
            ${sqlValue(scholarship.id)}, ${sqlValue(scholarship.conservatoriumId)}, ${sqlValue(scholarship.studentId)},
            ${sqlValue(null)}, ${sqlValue(null)}, ${sqlValue(status)},
            ${sqlValue(scholarship.paidAt || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            student_id = EXCLUDED.student_id,
            status = EXCLUDED.status,
            paid_at = EXCLUDED.paid_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM scholarship_applications WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.scholarships;

  adapter.rentals = withWriteThrough(adapter.rentals as unknown as Repo<any>, {
    upsert: async (rental) => {
      if (!isUuid(rental.id) || !isUuid(rental.conservatoriumId) || !isUuid(rental.studentId)) return;
      const parentId = rental.parentId && isUuid(rental.parentId) ? rental.parentId : null;
      const status = rentalStatusToDb(rental.status);
      const condition = rentalConditionToDb(rental.condition);
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO instrument_rentals (
            id, conservatorium_id, instrument_name, student_id, parent_id, rental_model,
            deposit_amount_ils, monthly_fee_ils, purchase_price_ils,
            start_date, expected_return_date, actual_return_date, status, condition, notes
          ) VALUES (
            ${sqlValue(rental.id)}, ${sqlValue(rental.conservatoriumId)}, ${sqlValue(rental.instrumentName || null)},
            ${sqlValue(rental.studentId)}, ${sqlValue(parentId)}, ${sqlValue(rental.rentalModel || 'monthly')},
            ${sqlValue(rental.depositAmountILS || null)}, ${sqlValue(rental.monthlyFeeILS || null)}, ${sqlValue(rental.purchasePriceILS || null)},
            ${sqlValue(rental.startDate || new Date().toISOString().slice(0, 10))}, ${sqlValue(rental.expectedReturnDate || null)}, ${sqlValue(rental.actualReturnDate || null)},
            ${sqlValue(status)}, ${sqlValue(condition)}, ${sqlValue(rental.notes || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            instrument_name = EXCLUDED.instrument_name,
            student_id = EXCLUDED.student_id,
            parent_id = EXCLUDED.parent_id,
            rental_model = EXCLUDED.rental_model,
            deposit_amount_ils = EXCLUDED.deposit_amount_ils,
            monthly_fee_ils = EXCLUDED.monthly_fee_ils,
            purchase_price_ils = EXCLUDED.purchase_price_ils,
            start_date = EXCLUDED.start_date,
            expected_return_date = EXCLUDED.expected_return_date,
            actual_return_date = EXCLUDED.actual_return_date,
            status = EXCLUDED.status,
            condition = EXCLUDED.condition,
            notes = EXCLUDED.notes;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM instrument_rentals WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.rentals;

  adapter.payments = withWriteThrough(adapter.payments as unknown as Repo<Invoice>, {
    upsert: async (invoice) => {
      if (!isUuid(invoice.id) || !isUuid(invoice.conservatoriumId) || !isUuid(invoice.payerId)) return;
      const invoiceNumber = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8)}`;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO invoices (
            id, conservatorium_id, invoice_number, payer_id, line_items, total, status, due_date, paid_at
          ) VALUES (
            ${sqlValue(invoice.id)}, ${sqlValue(invoice.conservatoriumId)}, ${sqlValue(invoiceNumber)}, ${sqlValue(invoice.payerId)},
            ${sqlValue(invoice.lineItems || [])}, ${sqlValue(invoice.total || 0)}, ${sqlValue(invoiceStatusToDb(invoice.status))},
            ${sqlValue(invoice.dueDate || new Date().toISOString().slice(0, 10))}, ${sqlValue(invoice.paidAt || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            payer_id = EXCLUDED.payer_id,
            line_items = EXCLUDED.line_items,
            total = EXCLUDED.total,
            status = EXCLUDED.status,
            due_date = EXCLUDED.due_date,
            paid_at = EXCLUDED.paid_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM invoices WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.payments;

  adapter.payrolls = withWriteThrough(adapter.payrolls as unknown as Repo<PayrollSummary>, {
    upsert: async (payroll) => {
      if (!isUuid(payroll.id) || !isUuid(payroll.conservatoriumId) || !isUuid(payroll.teacherId)) return;
      const periodStart = typeof payroll.periodStart === 'string' ? payroll.periodStart : new Date().toISOString().slice(0, 10);
      const year = Number(periodStart.slice(0, 4)) || new Date().getUTCFullYear();
      const month = Number(periodStart.slice(5, 7)) || 1;
      const totalMinutes = Math.max(0, Math.round(Number(payroll.totalHours || 0) * 60));
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO payroll_snapshots (
            id, conservatorium_id, teacher_id, period_year, period_month, total_minutes,
            lesson_count, absent_count, makeup_count, notes, generated_at
          ) VALUES (
            ${sqlValue(payroll.id)}, ${sqlValue(payroll.conservatoriumId)}, ${sqlValue(payroll.teacherId)},
            ${sqlValue(year)}, ${sqlValue(month)}, ${sqlValue(totalMinutes)},
            ${sqlValue(Array.isArray(payroll.completedLessons) ? payroll.completedLessons.length : 0)},
            0, 0, ${sqlValue(null)}, ${sqlValue(payroll.paymentDate || new Date().toISOString())}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            teacher_id = EXCLUDED.teacher_id,
            period_year = EXCLUDED.period_year,
            period_month = EXCLUDED.period_month,
            total_minutes = EXCLUDED.total_minutes,
            lesson_count = EXCLUDED.lesson_count,
            notes = EXCLUDED.notes,
            generated_at = EXCLUDED.generated_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM payroll_snapshots WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.payrolls;

  adapter.masterClasses = withWriteThrough(adapter.masterClasses as unknown as Repo<Masterclass>, {
    upsert: async (masterClass) => {
      if (!isUuid(masterClass.id) || !isUuid(masterClass.conservatoriumId)) return;
      const instructorId = masterClass.instructor?.userId;
      if (!isUuid(instructorId)) return;
      const title = masterClass.title || { he: 'Master Class', en: 'Master Class' };
      const description = masterClass.description || { he: '', en: '' };
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO master_classes (
            id, conservatorium_id, title, description, instructor_id, instrument,
            max_participants, target_audience, event_date, start_time, duration_minutes,
            location, is_online, stream_url, included_in_package, price_ils, status
          ) VALUES (
            ${sqlValue(masterClass.id)}, ${sqlValue(masterClass.conservatoriumId)}, ${sqlValue(title)}, ${sqlValue(description)}, ${sqlValue(instructorId)},
            ${sqlValue(masterClass.instrument || null)}, ${sqlValue(masterClass.maxParticipants || 20)}, ${sqlValue(masterClassAudienceToDb(masterClass.targetAudience))},
            ${sqlValue(masterClass.date)}, ${sqlValue(masterClass.startTime)}, ${sqlValue(masterClass.durationMinutes || 90)},
            ${sqlValue(masterClass.location || null)}, ${sqlValue(masterClass.isOnline === true)}, ${sqlValue(masterClass.streamUrl || null)},
            ${sqlValue(masterClass.includedInPackage === true)}, ${sqlValue(masterClass.priceILS || null)}, ${sqlValue(masterClassStatusToDb(masterClass.status))}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            instructor_id = EXCLUDED.instructor_id,
            instrument = EXCLUDED.instrument,
            max_participants = EXCLUDED.max_participants,
            target_audience = EXCLUDED.target_audience,
            event_date = EXCLUDED.event_date,
            start_time = EXCLUDED.start_time,
            duration_minutes = EXCLUDED.duration_minutes,
            location = EXCLUDED.location,
            is_online = EXCLUDED.is_online,
            stream_url = EXCLUDED.stream_url,
            included_in_package = EXCLUDED.included_in_package,
            price_ils = EXCLUDED.price_ils,
            status = EXCLUDED.status;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM master_classes WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.masterClasses;

  adapter.donationCauses = withWriteThrough(adapter.donationCauses as unknown as Repo<DonationCause>, {
    upsert: async (cause) => {
      if (!isUuid(cause.id) || !isUuid(cause.conservatoriumId)) return;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO donation_causes (
            id, conservatorium_id, names, descriptions, category, priority,
            is_active, target_amount_ils, raised_amount_ils, image_url
          ) VALUES (
            ${sqlValue(cause.id)}, ${sqlValue(cause.conservatoriumId)}, ${sqlValue(cause.names || { he: 'Cause', en: 'Cause' })},
            ${sqlValue(cause.descriptions || { he: '', en: '' })}, ${sqlValue(donationCategoryToDb(cause.category))}, ${sqlValue(cause.priority || 99)},
            ${sqlValue(cause.isActive !== false)}, ${sqlValue(cause.targetAmountILS || null)}, ${sqlValue(cause.raisedAmountILS || 0)}, ${sqlValue(cause.imageUrl || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            names = EXCLUDED.names,
            descriptions = EXCLUDED.descriptions,
            category = EXCLUDED.category,
            priority = EXCLUDED.priority,
            is_active = EXCLUDED.is_active,
            target_amount_ils = EXCLUDED.target_amount_ils,
            raised_amount_ils = EXCLUDED.raised_amount_ils,
            image_url = EXCLUDED.image_url;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM donation_causes WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.donationCauses;

  adapter.donations = withWriteThrough(adapter.donations as unknown as Repo<DonationRecord>, {
    upsert: async (donation) => {
      if (!isUuid(donation.id) || !isUuid(donation.conservatoriumId) || !isUuid(donation.causeId)) return;
      const donorId = donation.donorId && isUuid(donation.donorId) ? donation.donorId : null;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO donation_records (
            id, conservatorium_id, cause_id, amount_ils, frequency, donor_name,
            donor_email, donor_user_id, status, created_at
          ) VALUES (
            ${sqlValue(donation.id)}, ${sqlValue(donation.conservatoriumId)}, ${sqlValue(donation.causeId)},
            ${sqlValue(donation.amountILS || 0)}, ${sqlValue(donation.frequency || 'once')}, ${sqlValue(donation.donorName || null)},
            ${sqlValue(donation.donorEmail || null)}, ${sqlValue(donorId)}, ${sqlValue(donationStatusToDb(donation.status))},
            ${sqlValue(donation.createdAt || new Date().toISOString())}
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            cause_id = EXCLUDED.cause_id,
            amount_ils = EXCLUDED.amount_ils,
            frequency = EXCLUDED.frequency,
            donor_name = EXCLUDED.donor_name,
            donor_email = EXCLUDED.donor_email,
            donor_user_id = EXCLUDED.donor_user_id,
            status = EXCLUDED.status,
            created_at = EXCLUDED.created_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM donation_records WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.donations;
  adapter.users = withWriteThrough(adapter.users as unknown as Repo<User>, {
    upsert: async (user) => {
      if (!isUuid(user.id)) return;
      const { firstName, lastName } = splitName(user.name || '');
      const conservatoriumId = isUuid(user.conservatoriumId) ? user.conservatoriumId : null;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO users (
            id, conservatorium_id, email, role, first_name, last_name,
            national_id, phone, avatar_url, city, gender, is_active, updated_at
          ) VALUES (
            ${sqlValue(user.id)}, ${sqlValue(conservatoriumId)}, ${sqlValue(user.email)}, ${sqlValue(appRoleToDbRole(user.role))}::user_role,
            ${sqlValue(firstName)}, ${sqlValue(lastName)}, ${sqlValue(user.idNumber || null)}, ${sqlValue(user.phone || null)},
            ${sqlValue(user.avatarUrl || null)}, ${sqlValue(user.city || null)}, ${sqlValue(user.gender || null)}, ${sqlValue(user.approved !== false)}, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            national_id = EXCLUDED.national_id,
            phone = EXCLUDED.phone,
            avatar_url = EXCLUDED.avatar_url,
            city = EXCLUDED.city,
            gender = EXCLUDED.gender,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
        `
      );

      const roleDb = appRoleToDbRole(user.role);
      if (roleDb === 'TEACHER') {
        const teacherBio = jsonbI18nFromText(user.bio);
        const teacherEducation = Array.isArray(user.education) ? user.education.filter((x) => typeof x === 'string') : [];
        const lessonDurations = Array.isArray(user.lessonDurationsOffered)
          ? user.lessonDurationsOffered.filter((x) => x === 30 || x === 45 || x === 60)
          : [];
        const teacherInstruments = Array.isArray(user.instruments)
          ? user.instruments
              .map((entry) => (entry?.instrument || '').trim())
              .filter((entry) => entry.length > 0)
          : [];

        runPsqlExecute(
          connectionString,
          `
            INSERT INTO teacher_profiles (
              user_id, bio, education, video_url, available_for_new_students, lesson_durations
            ) VALUES (
              ${sqlValue(user.id)},
              ${sqlValue(teacherBio)},
              ${sqlValue(teacherEducation)}::text[],
              ${sqlValue(user.videoUrl || null)},
              ${sqlValue(user.availableForNewStudents !== false)},
              ${sqlValue(lessonDurations.length > 0 ? lessonDurations : [45])}::int[]
            )
            ON CONFLICT (user_id) DO UPDATE SET
              bio = COALESCE(EXCLUDED.bio, teacher_profiles.bio),
              education = EXCLUDED.education,
              video_url = EXCLUDED.video_url,
              available_for_new_students = EXCLUDED.available_for_new_students,
              lesson_durations = EXCLUDED.lesson_durations;
          `
        );

        if (conservatoriumId && teacherInstruments.length > 0) {
          runPsqlExecute(
            connectionString,
            `
              DELETE FROM teacher_profile_instruments
              WHERE teacher_user_id = ${sqlValue(user.id)};
            `
          );

          runPsqlExecute(
            connectionString,
            `
              WITH tokenized AS (
                SELECT
                  lower(btrim(v.token)) AS token,
                  v.ord::int
                FROM (VALUES ${teacherInstruments.map((token, idx) => `(${sqlValue(token)}, ${idx + 1})`).join(', ')}) AS v(token, ord)
              ),
              matched AS (
                SELECT DISTINCT ON (ci.id)
                  ci.id AS conservatorium_instrument_id,
                  t.ord
                FROM tokenized t
                JOIN conservatorium_instruments ci
                  ON ci.conservatorium_id = ${sqlValue(conservatoriumId)}
                 AND (
                   t.token = lower(COALESCE(ci.names->>'he', ''))
                   OR t.token = lower(COALESCE(ci.names->>'en', ''))
                   OR t.token = lower(COALESCE(ci.names->>'ar', ''))
                   OR t.token = lower(COALESCE(ci.names->>'ru', ''))
                   OR regexp_replace(lower(btrim(t.token)), '[^a-z0-9\u0590-\u05ff]+', '_', 'g') = ci.instrument_catalog_id
                 )
                ORDER BY ci.id, t.ord
              ),
              ranked AS (
                SELECT
                  conservatorium_instrument_id,
                  ord,
                  MIN(ord) OVER () AS first_ord
                FROM matched
              )
              INSERT INTO teacher_profile_instruments (teacher_user_id, conservatorium_instrument_id, is_primary)
              SELECT
                ${sqlValue(user.id)},
                conservatorium_instrument_id,
                (ord = first_ord)
              FROM ranked
              ON CONFLICT (teacher_user_id, conservatorium_instrument_id) DO UPDATE
              SET is_primary = teacher_profile_instruments.is_primary OR EXCLUDED.is_primary;
            `
          );
        }
      }
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM users WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.users;

  adapter.forms = withWriteThrough(adapter.forms as unknown as Repo<FormSubmission>, {
    upsert: async (form) => {
      if (!isUuid(form.id)) return;
      const conservatoriumId = isUuid(form.conservatoriumId) ? form.conservatoriumId : null;
      const studentId = isUuid(form.studentId) ? form.studentId : null;
      const submittedBy = form.submittedBy && isUuid(form.submittedBy) ? form.submittedBy : null;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO forms (
            id, conservatorium_id, type, student_id, submitted_by_user_id,
            form_data, status, required_approver_role, submitted_at, updated_at
          ) VALUES (
            ${sqlValue(form.id)}, ${sqlValue(conservatoriumId)}, ${sqlValue(form.formType || 'generic_form')},
            ${sqlValue(studentId)}, ${sqlValue(submittedBy)}, ${sqlValue(form.formData || {})}, ${sqlValue(formStatusToDb(form.status))},
            ${sqlValue('CONSERVATORIUM_ADMIN')}, ${sqlValue(form.submissionDate || new Date().toISOString())}, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            type = EXCLUDED.type,
            student_id = EXCLUDED.student_id,
            submitted_by_user_id = EXCLUDED.submitted_by_user_id,
            form_data = EXCLUDED.form_data,
            status = EXCLUDED.status,
            updated_at = NOW();
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM forms WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.forms;

  adapter.events = withWriteThrough(adapter.events as unknown as Repo<EventProduction>, {
    upsert: async (event) => {
      if (!isUuid(event.id) || !isUuid(event.conservatoriumId)) return;
      const title = event.title || { he: event.name, en: event.name };
      const venue = event.venueDetails?.name || { he: event.venue, en: event.venue };
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO events (
            id, conservatorium_id, title, description, event_date, event_time,
            venue, is_free, ticket_prices, total_seats, seat_map_url,
            performers, program, status, poster_url, published_at
          ) VALUES (
            ${sqlValue(event.id)}, ${sqlValue(event.conservatoriumId)}, ${sqlValue(title)}, ${sqlValue(event.description || null)},
            ${sqlValue(event.eventDate)}, ${sqlValue(event.startTime)}, ${sqlValue(venue)},
            ${sqlValue(event.isFree ?? true)}, ${sqlValue(event.ticketPrices || [])}, ${sqlValue(event.totalSeats ?? null)},
            ${sqlValue(event.seatMapUrl || null)}, ${sqlValue(event.performers || [])}, ${sqlValue(event.program || [])},
            ${sqlValue(eventStatusToDb(event))}, ${sqlValue(event.posterUrl || null)}, ${sqlValue(event.publishedAt || null)}
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            event_date = EXCLUDED.event_date,
            event_time = EXCLUDED.event_time,
            venue = EXCLUDED.venue,
            is_free = EXCLUDED.is_free,
            ticket_prices = EXCLUDED.ticket_prices,
            total_seats = EXCLUDED.total_seats,
            seat_map_url = EXCLUDED.seat_map_url,
            performers = EXCLUDED.performers,
            program = EXCLUDED.program,
            status = EXCLUDED.status,
            poster_url = EXCLUDED.poster_url,
            published_at = EXCLUDED.published_at;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM events WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.events;

  adapter.branches = withWriteThrough(adapter.branches as unknown as Repo<Branch>, {
    upsert: async (branch) => {
      if (!isUuid(branch.id) || !isUuid(branch.conservatoriumId)) return;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO branches (id, conservatorium_id, name, address, phone, is_active)
          VALUES (${sqlValue(branch.id)}, ${sqlValue(branch.conservatoriumId)}, ${sqlValue(branch.name)}, ${sqlValue(branch.address || null)}, NULL, TRUE)
          ON CONFLICT (id) DO UPDATE SET
            conservatorium_id = EXCLUDED.conservatorium_id,
            name = EXCLUDED.name,
            address = EXCLUDED.address;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM branches WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.branches;

  adapter.rooms = withWriteThrough(adapter.rooms as unknown as Repo<Room>, {
    upsert: async (room) => {
      if (!isUuid(room.id) || !isUuid(room.conservatoriumId) || !isUuid(room.branchId)) return;
      runPsqlExecute(
        connectionString,
        `
          INSERT INTO rooms (id, branch_id, conservatorium_id, name, capacity, instrument_equipment, is_active)
          VALUES (
            ${sqlValue(room.id)}, ${sqlValue(room.branchId)}, ${sqlValue(room.conservatoriumId)},
            ${sqlValue(room.name)}, ${sqlValue(room.capacity ?? 1)}, ${sqlValue(room.instrumentEquipment || [])}, ${sqlValue(room.isActive !== false)}
          )
          ON CONFLICT (id) DO UPDATE SET
            branch_id = EXCLUDED.branch_id,
            conservatorium_id = EXCLUDED.conservatorium_id,
            name = EXCLUDED.name,
            capacity = EXCLUDED.capacity,
            instrument_equipment = EXCLUDED.instrument_equipment,
            is_active = EXCLUDED.is_active;
        `
      );
    },
    remove: async (id) => {
      if (!isUuid(id)) return;
      runPsqlExecute(connectionString, `DELETE FROM rooms WHERE id = ${sqlValue(id)};`);
    },
  }) as unknown as typeof adapter.rooms;
}

