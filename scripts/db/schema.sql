\encoding UTF8

-- ============================================================
-- Harmonia Platform - PostgreSQL Schema
-- Run: psql -U harmonia -d harmonia_dev -f scripts/db/schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CONSERVATORIUMS
-- ============================================================
CREATE TABLE IF NOT EXISTS conservatoriums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL,
  description JSONB,
  city VARCHAR(100),
  city_i18n JSONB,
  address TEXT,
  address_i18n JSONB,
  phone VARCHAR(20),
  email VARCHAR(255),
  website_url TEXT,
  logo_url TEXT,
  established_year INT,
  google_place_id TEXT,
  coordinates JSONB,
  opening_hours JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'SITE_ADMIN',
      'CONSERVATORIUM_ADMIN',
      'DELEGATED_ADMIN',
      'TEACHER',
      'PARENT',
      'STUDENT_OVER_13',
      'STUDENT_UNDER_13'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID REFERENCES conservatoriums(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  first_name_i18n JSONB,
  last_name VARCHAR(100) NOT NULL,
  last_name_i18n JSONB,
  national_id VARCHAR(9),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  city VARCHAR(100),
  address TEXT,
  avatar_url TEXT,
  registration_source VARCHAR(20) DEFAULT 'email',
  oauth_providers JSONB DEFAULT '[]',
  delegated_permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_conservatorium ON users(conservatorium_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE conservatoriums ADD COLUMN IF NOT EXISTS city_i18n JSONB;
ALTER TABLE conservatoriums ADD COLUMN IF NOT EXISTS address_i18n JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name_i18n JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name_i18n JSONB;

-- ============================================================
-- STUDENT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id),
  grade VARCHAR(10),
  school_name VARCHAR(200),
  in_music_stream BOOLEAN DEFAULT FALSE,
  is_music_major BOOLEAN DEFAULT FALSE,
  graduation_year INT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio JSONB,
  education TEXT[] DEFAULT '{}',
  video_url TEXT,
  available_for_new_students BOOLEAN DEFAULT TRUE,
  lesson_durations INT[] DEFAULT '{45}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher ON teacher_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_conservatorium ON teacher_ratings(conservatorium_id);

-- ============================================================
-- INSTRUMENT CATALOG (normalized global instruments)
-- ============================================================
CREATE TABLE IF NOT EXISTS instrument_catalog (
  id TEXT PRIMARY KEY,
  names JSONB NOT NULL,
  family VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONSERVATORIUM INSTRUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conservatorium_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  instrument_catalog_id TEXT REFERENCES instrument_catalog(id),
  names JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  available_for_registration BOOLEAN DEFAULT TRUE,
  available_for_rental BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conservatorium_id, id)
);

CREATE INDEX IF NOT EXISTS idx_conservatorium_instruments_catalog
  ON conservatorium_instruments(instrument_catalog_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conservatorium_instruments_cons_catalog
  ON conservatorium_instruments(conservatorium_id, instrument_catalog_id)
  WHERE instrument_catalog_id IS NOT NULL;

-- ============================================================
-- NORMALIZED RELATION TABLES (non-breaking; legacy columns remain)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_profile_instruments (
  teacher_user_id UUID NOT NULL REFERENCES teacher_profiles(user_id) ON DELETE CASCADE,
  conservatorium_instrument_id UUID NOT NULL REFERENCES conservatorium_instruments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (teacher_user_id, conservatorium_instrument_id)
);


-- ============================================================
-- TEACHER ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  instrument_id UUID REFERENCES conservatorium_instruments(id),
  lesson_duration_min INT NOT NULL DEFAULT 45,
  day_of_week INT,
  start_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRANCHES & ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 1,
  instrument_equipment JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LESSONS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
    CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'makeup');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  student_id UUID NOT NULL REFERENCES users(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  instrument_id UUID REFERENCES conservatorium_instruments(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  status lesson_status DEFAULT 'scheduled',
  absence_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled ON lessons(scheduled_at);

-- ============================================================
-- LESSON PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  names JSONB NOT NULL,
  type VARCHAR(20) NOT NULL,
  lesson_count INT,
  duration_minutes INT NOT NULL DEFAULT 45,
  price_ils NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LESSON PACKAGE ? INSTRUMENT LINKS (normalized)
CREATE TABLE IF NOT EXISTS lesson_package_instruments (
  lesson_package_id UUID NOT NULL REFERENCES lesson_packages(id) ON DELETE CASCADE,
  conservatorium_instrument_id UUID NOT NULL REFERENCES conservatorium_instruments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lesson_package_id, conservatorium_instrument_id)
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  title JSONB NOT NULL,
  description JSONB,
  event_date DATE NOT NULL,
  event_time TIME,
  venue JSONB,
  poster_url TEXT,
  is_free BOOLEAN DEFAULT TRUE,
  ticket_prices JSONB DEFAULT '[]',
  total_seats INT,
  seat_map_url TEXT,
  performers JSONB DEFAULT '[]',
  program JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPROVALS / FORMS
-- ============================================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  type VARCHAR(50) NOT NULL,
  student_id UUID REFERENCES users(id),
  submitted_by_user_id UUID REFERENCES users(id),
  form_data JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'PENDING',
  required_approver_role VARCHAR(50),
  assigned_to_user_id UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience VARCHAR(20) NOT NULL DEFAULT 'ALL',
  channels TEXT[] NOT NULL DEFAULT '{IN_APP}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RENTALS
-- ============================================================

-- ============================================================
-- REPERTOIRE LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS repertoire_library (
  id TEXT PRIMARY KEY,
  composer_id TEXT NOT NULL,
  composer_names JSONB NOT NULL,
  titles JSONB NOT NULL,
  genre TEXT,
  instrument TEXT,
  instrument_names JSONB NOT NULL DEFAULT '{}',
  approved BOOLEAN DEFAULT FALSE,
  source VARCHAR(30) DEFAULT 'wp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repertoire_library_composer_id ON repertoire_library(composer_id);
CREATE INDEX IF NOT EXISTS idx_repertoire_library_instrument ON repertoire_library(instrument);
CREATE INDEX IF NOT EXISTS idx_repertoire_library_source ON repertoire_library(source);

CREATE TABLE IF NOT EXISTS instrument_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  instrument_name VARCHAR(200),
  student_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES users(id),
  rental_model VARCHAR(20) NOT NULL,
  deposit_amount_ils NUMERIC(10,2),
  monthly_fee_ils NUMERIC(10,2),
  purchase_price_ils NUMERIC(10,2),
  start_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  status VARCHAR(30) DEFAULT 'pending_signature',
  signing_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  parent_signed_at TIMESTAMPTZ,
  parent_signature_url TEXT,
  condition VARCHAR(20) DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHOLARSHIPS & DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  student_id UUID NOT NULL REFERENCES users(id),
  amount_ils NUMERIC(10,2),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  approved_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_causes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  names JSONB NOT NULL,
  descriptions JSONB,
  category VARCHAR(30),
  priority INT DEFAULT 99,
  is_active BOOLEAN DEFAULT TRUE,
  target_amount_ils NUMERIC(10,2),
  raised_amount_ils NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES / PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  invoice_number VARCHAR(50) NOT NULL,
  payer_id UUID NOT NULL REFERENCES users(id),
  line_items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  due_date DATE NOT NULL,
  paid_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (invoice_number)
);

-- ============================================================
-- ALUMNI
-- ============================================================

CREATE TABLE IF NOT EXISTS donation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  cause_id UUID NOT NULL REFERENCES donation_causes(id),
  amount_ils NUMERIC(10,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'once',
  donor_name TEXT,
  donor_email TEXT,
  donor_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'INITIATED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS alumni_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  graduation_year INT,
  primary_instrument VARCHAR(100),
  current_occupation TEXT,
  bio JSONB,
  profile_photo_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  achievements TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  available_for_master_classes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MASTER CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS master_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  title JSONB NOT NULL,
  description JSONB,
  instructor_id UUID NOT NULL REFERENCES users(id),
  instrument VARCHAR(100),
  instrument_catalog_id TEXT REFERENCES instrument_catalog(id),
  max_participants INT DEFAULT 20,
  target_audience VARCHAR(20) DEFAULT 'all',
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT DEFAULT 90,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  stream_url TEXT,
  included_in_package BOOLEAN DEFAULT FALSE,
  price_ils NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYROLL REPORTS (cached)
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  total_minutes INT DEFAULT 0,
  lesson_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  makeup_count INT DEFAULT 0,
  notes TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, period_year, period_month)
);


-- ============================================================
-- INTEGRITY HARDENING
-- ============================================================
CREATE OR REPLACE FUNCTION is_valid_i18n_jsonb(payload JSONB)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    jsonb_typeof(payload) = 'object'
    AND payload ? 'he' AND jsonb_typeof(payload->'he') = 'string' AND btrim(payload->>'he') <> ''
    AND payload ? 'en' AND jsonb_typeof(payload->'en') = 'string' AND btrim(payload->>'en') <> ''
    AND payload ? 'ar' AND jsonb_typeof(payload->'ar') = 'string' AND btrim(payload->>'ar') <> ''
    AND payload ? 'ru' AND jsonb_typeof(payload->'ru') = 'string' AND btrim(payload->>'ru') <> '';
$$;

CREATE OR REPLACE FUNCTION add_check_constraint_if_missing(
  target_table REGCLASS,
  constraint_name TEXT,
  constraint_expr TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conname = constraint_name
      AND c.conrelid = target_table
  ) THEN
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I CHECK (%s)',
      target_table::TEXT,
      constraint_name,
      constraint_expr
    );
  END IF;
END;
$$;

SELECT add_check_constraint_if_missing('conservatoriums', 'ck_conservatoriums_name_i18n', 'is_valid_i18n_jsonb(name)');
SELECT add_check_constraint_if_missing('conservatoriums', 'ck_conservatoriums_description_i18n', 'description IS NULL OR jsonb_typeof(description) = ''object''');
SELECT add_check_constraint_if_missing('conservatoriums', 'ck_conservatoriums_city_i18n', 'city_i18n IS NULL OR is_valid_i18n_jsonb(city_i18n)');
SELECT add_check_constraint_if_missing('conservatoriums', 'ck_conservatoriums_address_i18n', 'address_i18n IS NULL OR is_valid_i18n_jsonb(address_i18n)');

SELECT add_check_constraint_if_missing('users', 'ck_users_first_name_i18n', 'first_name_i18n IS NULL OR is_valid_i18n_jsonb(first_name_i18n)');
SELECT add_check_constraint_if_missing('users', 'ck_users_last_name_i18n', 'last_name_i18n IS NULL OR is_valid_i18n_jsonb(last_name_i18n)');

SELECT add_check_constraint_if_missing('teacher_profiles', 'ck_teacher_profiles_bio_i18n', 'bio IS NULL OR is_valid_i18n_jsonb(bio)');
SELECT add_check_constraint_if_missing('conservatorium_instruments', 'ck_conservatorium_instruments_names_i18n', 'is_valid_i18n_jsonb(names)');
SELECT add_check_constraint_if_missing('lesson_packages', 'ck_lesson_packages_names_i18n', 'is_valid_i18n_jsonb(names)');
SELECT add_check_constraint_if_missing('events', 'ck_events_title_i18n', 'is_valid_i18n_jsonb(title)');
SELECT add_check_constraint_if_missing('events', 'ck_events_description_i18n', 'description IS NULL OR is_valid_i18n_jsonb(description)');
SELECT add_check_constraint_if_missing('events', 'ck_events_venue_i18n', 'venue IS NULL OR is_valid_i18n_jsonb(venue)');
SELECT add_check_constraint_if_missing('donation_causes', 'ck_donation_causes_names_i18n', 'is_valid_i18n_jsonb(names)');
SELECT add_check_constraint_if_missing('donation_causes', 'ck_donation_causes_descriptions_i18n', 'descriptions IS NULL OR is_valid_i18n_jsonb(descriptions)');
SELECT add_check_constraint_if_missing('repertoire_library', 'ck_repertoire_composer_names_i18n', 'is_valid_i18n_jsonb(composer_names)');
SELECT add_check_constraint_if_missing('repertoire_library', 'ck_repertoire_titles_i18n', 'is_valid_i18n_jsonb(titles)');
SELECT add_check_constraint_if_missing('repertoire_library', 'ck_repertoire_instrument_names_i18n', 'is_valid_i18n_jsonb(instrument_names)');
SELECT add_check_constraint_if_missing('master_classes', 'ck_master_classes_title_i18n', 'is_valid_i18n_jsonb(title)');
SELECT add_check_constraint_if_missing('master_classes', 'ck_master_classes_description_i18n', 'description IS NULL OR is_valid_i18n_jsonb(description)');

SELECT add_check_constraint_if_missing('student_profiles', 'ck_student_profiles_status', 'status IN (''active'', ''inactive'', ''graduated'')');
SELECT add_check_constraint_if_missing('events', 'ck_events_status', 'status IN (''draft'', ''published'', ''archived'', ''cancelled'')');
SELECT add_check_constraint_if_missing('forms', 'ck_forms_status', 'status IN (''DRAFT'', ''PENDING'', ''APPROVED'', ''REJECTED'', ''REVISION_REQUIRED'')');
SELECT add_check_constraint_if_missing('instrument_rentals', 'ck_instrument_rentals_status', 'status IN (''pending_signature'', ''active'', ''returned'', ''cancelled'', ''overdue'')');
SELECT add_check_constraint_if_missing('scholarship_applications', 'ck_scholarship_status', 'status IN (''PENDING'', ''APPROVED'', ''REJECTED'', ''PAID'')');
SELECT add_check_constraint_if_missing('invoices', 'ck_invoices_status', 'status IN (''DRAFT'', ''SENT'', ''PAID'', ''OVERDUE'', ''CANCELLED'')');
SELECT add_check_constraint_if_missing('donation_records', 'ck_donation_records_status', 'status IN (''INITIATED'', ''PAID'', ''FAILED'', ''REFUNDED'')');
SELECT add_check_constraint_if_missing('master_classes', 'ck_master_classes_status', 'status IN (''draft'', ''published'', ''cancelled'', ''completed'')');

DROP FUNCTION IF EXISTS add_check_constraint_if_missing(REGCLASS, TEXT, TEXT);

CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_ratings_teacher_reviewer_conservatorium
  ON teacher_ratings(teacher_id, reviewer_user_id, conservatorium_id);

CREATE OR REPLACE FUNCTION enforce_role_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  teacher_role user_role;
  student_role user_role;
  parent_role user_role;
BEGIN
  IF TG_TABLE_NAME = 'teacher_profiles' THEN
    SELECT role INTO teacher_role FROM users WHERE id = NEW.user_id;
    IF teacher_role IS DISTINCT FROM 'TEACHER' THEN
      RAISE EXCEPTION 'teacher_profiles.user_id % must reference users.role=TEACHER', NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'student_profiles' THEN
    SELECT role INTO student_role FROM users WHERE id = NEW.user_id;
    IF student_role NOT IN ('STUDENT_OVER_13', 'STUDENT_UNDER_13') THEN
      RAISE EXCEPTION 'student_profiles.user_id % must reference student role', NEW.user_id;
    END IF;

    IF NEW.parent_id IS NOT NULL THEN
      SELECT role INTO parent_role FROM users WHERE id = NEW.parent_id;
      IF parent_role IS DISTINCT FROM 'PARENT' THEN
        RAISE EXCEPTION 'student_profiles.parent_id % must reference users.role=PARENT', NEW.parent_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'teacher_ratings' THEN
    SELECT role INTO teacher_role FROM users WHERE id = NEW.teacher_id;
    IF teacher_role IS DISTINCT FROM 'TEACHER' THEN
      RAISE EXCEPTION 'teacher_ratings.teacher_id % must reference users.role=TEACHER', NEW.teacher_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teacher_profiles_role_integrity ON teacher_profiles;
CREATE TRIGGER trg_teacher_profiles_role_integrity
BEFORE INSERT OR UPDATE ON teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_role_integrity();

DROP TRIGGER IF EXISTS trg_student_profiles_role_integrity ON student_profiles;
CREATE TRIGGER trg_student_profiles_role_integrity
BEFORE INSERT OR UPDATE ON student_profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_role_integrity();

DROP TRIGGER IF EXISTS trg_teacher_ratings_role_integrity ON teacher_ratings;
CREATE TRIGGER trg_teacher_ratings_role_integrity
BEFORE INSERT OR UPDATE ON teacher_ratings
FOR EACH ROW
EXECUTE FUNCTION enforce_role_integrity();

-- ============================================================
-- ROW LEVEL SECURITY
-- Applied automatically when schema.sql is run.
-- Helper functions must exist before policies are created.
-- ============================================================

-- ------------------------------------------------------------
-- A. HELPER FUNCTIONS
-- Used by all RLS policies below. Safe to re-run (idempotent).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION harmonia_role() RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', auth.jwt()->>'role');
$$;

CREATE OR REPLACE FUNCTION harmonia_conservatorium_id() RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'conservatoriumId', auth.jwt()->>'conservatoriumId');
$$;

CREATE OR REPLACE FUNCTION is_site_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT harmonia_role() IN ('SITE_ADMIN', 'site_admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION is_conservatorium_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT harmonia_role() IN (
    'CONSERVATORIUM_ADMIN', 'conservatorium_admin',
    'DELEGATED_ADMIN', 'delegated_admin',
    'SITE_ADMIN', 'site_admin', 'superadmin'
  );
$$;

-- ------------------------------------------------------------
-- B. ENABLE RLS ON ALL TABLES
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent.
-- FORCE ROW LEVEL SECURITY ensures the table owner is also
-- subject to policies (critical for security).
-- instrument_catalog is a public read-only reference table
-- and is intentionally excluded from RLS.
-- ------------------------------------------------------------

ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservatoriums FORCE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_ratings FORCE ROW LEVEL SECURITY;

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE conservatorium_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservatorium_instruments FORCE ROW LEVEL SECURITY;

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms FORCE ROW LEVEL SECURITY;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons FORCE ROW LEVEL SECURITY;

ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_packages FORCE ROW LEVEL SECURITY;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms FORCE ROW LEVEL SECURITY;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE instrument_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_rentals FORCE ROW LEVEL SECURITY;

ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications FORCE ROW LEVEL SECURITY;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements FORCE ROW LEVEL SECURITY;

ALTER TABLE repertoire_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE repertoire_library FORCE ROW LEVEL SECURITY;

ALTER TABLE donation_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_causes FORCE ROW LEVEL SECURITY;

ALTER TABLE donation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_records FORCE ROW LEVEL SECURITY;

ALTER TABLE payroll_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_snapshots FORCE ROW LEVEL SECURITY;

ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE master_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_classes FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- C. RLS POLICIES
-- Each policy is preceded by DROP POLICY IF EXISTS so this
-- section is idempotent (safe to re-run).
-- ------------------------------------------------------------

-- ============================================================
-- CONSERVATORIUMS: public read, admin write
-- ============================================================
DROP POLICY IF EXISTS "conservatoriums_select_public" ON conservatoriums;
CREATE POLICY "conservatoriums_select_public" ON conservatoriums
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "conservatoriums_update_own_admin" ON conservatoriums;
CREATE POLICY "conservatoriums_update_own_admin" ON conservatoriums
  FOR UPDATE USING (
    is_site_admin() OR (is_conservatorium_admin() AND id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "conservatoriums_insert_site_admin" ON conservatoriums;
CREATE POLICY "conservatoriums_insert_site_admin" ON conservatoriums
  FOR INSERT WITH CHECK (is_site_admin());

DROP POLICY IF EXISTS "conservatoriums_delete_site_admin" ON conservatoriums;
CREATE POLICY "conservatoriums_delete_site_admin" ON conservatoriums
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- USERS: own row + parent->child + teacher->students + admin
-- ============================================================
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_parent_children" ON users;
CREATE POLICY "users_select_parent_children" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = users.id AND sp.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "users_select_teacher_students" ON users;
CREATE POLICY "users_select_teacher_students" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.student_id = users.id AND ta.teacher_id = auth.uid() AND ta.is_active = true)
  );

DROP POLICY IF EXISTS "users_select_conservatorium_admin" ON users;
CREATE POLICY "users_select_conservatorium_admin" ON users
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT u.role FROM users u WHERE u.id = auth.uid()));

DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "users_delete_site_admin" ON users;
CREATE POLICY "users_delete_site_admin" ON users
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- STUDENT PROFILES: own + parent + assigned teacher + admin
-- ============================================================
DROP POLICY IF EXISTS "student_profiles_select_own" ON student_profiles;
CREATE POLICY "student_profiles_select_own" ON student_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "student_profiles_select_parent" ON student_profiles;
CREATE POLICY "student_profiles_select_parent" ON student_profiles
  FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "student_profiles_select_teacher" ON student_profiles;
CREATE POLICY "student_profiles_select_teacher" ON student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.student_id = student_profiles.user_id AND ta.teacher_id = auth.uid() AND ta.is_active = true)
  );

DROP POLICY IF EXISTS "student_profiles_select_admin" ON student_profiles;
CREATE POLICY "student_profiles_select_admin" ON student_profiles
  FOR SELECT USING (
    is_conservatorium_admin() AND (
      is_site_admin() OR
      (SELECT conservatorium_id::text FROM users u WHERE u.id = student_profiles.user_id) = harmonia_conservatorium_id()
    )
  );

DROP POLICY IF EXISTS "student_profiles_insert_admin" ON student_profiles;
CREATE POLICY "student_profiles_insert_admin" ON student_profiles
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "student_profiles_update_admin" ON student_profiles;
CREATE POLICY "student_profiles_update_admin" ON student_profiles
  FOR UPDATE USING (is_conservatorium_admin());

DROP POLICY IF EXISTS "student_profiles_delete_site_admin" ON student_profiles;
CREATE POLICY "student_profiles_delete_site_admin" ON student_profiles
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- TEACHER PROFILES: own + public (available) + admin
-- ============================================================
DROP POLICY IF EXISTS "teacher_profiles_select_own" ON teacher_profiles;
CREATE POLICY "teacher_profiles_select_own" ON teacher_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teacher_profiles_select_public_available" ON teacher_profiles;
CREATE POLICY "teacher_profiles_select_public_available" ON teacher_profiles
  FOR SELECT USING (available_for_new_students = true);

DROP POLICY IF EXISTS "teacher_profiles_select_admin" ON teacher_profiles;
CREATE POLICY "teacher_profiles_select_admin" ON teacher_profiles
  FOR SELECT USING (
    is_conservatorium_admin() AND (
      is_site_admin() OR
      (SELECT conservatorium_id::text FROM users u WHERE u.id = teacher_profiles.user_id) = harmonia_conservatorium_id()
    )
  );

DROP POLICY IF EXISTS "teacher_profiles_update_own" ON teacher_profiles;
CREATE POLICY "teacher_profiles_update_own" ON teacher_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teacher_profiles_update_admin" ON teacher_profiles;
CREATE POLICY "teacher_profiles_update_admin" ON teacher_profiles
  FOR UPDATE USING (is_conservatorium_admin());

DROP POLICY IF EXISTS "teacher_profiles_insert_admin" ON teacher_profiles;
CREATE POLICY "teacher_profiles_insert_admin" ON teacher_profiles
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "teacher_profiles_delete_site_admin" ON teacher_profiles;
CREATE POLICY "teacher_profiles_delete_site_admin" ON teacher_profiles
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- TEACHER RATINGS: own conservatorium read, admin write
-- ============================================================
DROP POLICY IF EXISTS "teacher_ratings_select_conservatorium" ON teacher_ratings;
CREATE POLICY "teacher_ratings_select_conservatorium" ON teacher_ratings
  FOR SELECT USING (
    is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "teacher_ratings_insert_authenticated" ON teacher_ratings;
CREATE POLICY "teacher_ratings_insert_authenticated" ON teacher_ratings
  FOR INSERT WITH CHECK (
    reviewer_user_id = auth.uid() AND
    (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "teacher_ratings_delete_site_admin" ON teacher_ratings;
CREATE POLICY "teacher_ratings_delete_site_admin" ON teacher_ratings
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- TEACHER ASSIGNMENTS: teacher + student + parent + admin
-- ============================================================
DROP POLICY IF EXISTS "teacher_assignments_select_teacher" ON teacher_assignments;
CREATE POLICY "teacher_assignments_select_teacher" ON teacher_assignments
  FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "teacher_assignments_select_student" ON teacher_assignments;
CREATE POLICY "teacher_assignments_select_student" ON teacher_assignments
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "teacher_assignments_select_parent" ON teacher_assignments;
CREATE POLICY "teacher_assignments_select_parent" ON teacher_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = teacher_assignments.student_id AND sp.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "teacher_assignments_select_admin" ON teacher_assignments;
CREATE POLICY "teacher_assignments_select_admin" ON teacher_assignments
  FOR SELECT USING (is_conservatorium_admin());

DROP POLICY IF EXISTS "teacher_assignments_insert_admin" ON teacher_assignments;
CREATE POLICY "teacher_assignments_insert_admin" ON teacher_assignments
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "teacher_assignments_update_admin" ON teacher_assignments;
CREATE POLICY "teacher_assignments_update_admin" ON teacher_assignments
  FOR UPDATE USING (is_conservatorium_admin());

DROP POLICY IF EXISTS "teacher_assignments_delete_admin" ON teacher_assignments;
CREATE POLICY "teacher_assignments_delete_admin" ON teacher_assignments
  FOR DELETE USING (is_conservatorium_admin());

-- ============================================================
-- CONSERVATORIUM INSTRUMENTS: tenant read, admin write
-- ============================================================
DROP POLICY IF EXISTS "conservatorium_instruments_select_tenant" ON conservatorium_instruments;
CREATE POLICY "conservatorium_instruments_select_tenant" ON conservatorium_instruments
  FOR SELECT USING (
    is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "conservatorium_instruments_insert_admin" ON conservatorium_instruments;
CREATE POLICY "conservatorium_instruments_insert_admin" ON conservatorium_instruments
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "conservatorium_instruments_update_admin" ON conservatorium_instruments;
CREATE POLICY "conservatorium_instruments_update_admin" ON conservatorium_instruments
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "conservatorium_instruments_delete_admin" ON conservatorium_instruments;
CREATE POLICY "conservatorium_instruments_delete_admin" ON conservatorium_instruments
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- BRANCHES: public read, admin write
-- ============================================================
DROP POLICY IF EXISTS "branches_select_public" ON branches;
CREATE POLICY "branches_select_public" ON branches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "branches_insert_admin" ON branches;
CREATE POLICY "branches_insert_admin" ON branches
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "branches_update_admin" ON branches;
CREATE POLICY "branches_update_admin" ON branches
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "branches_delete_admin" ON branches;
CREATE POLICY "branches_delete_admin" ON branches
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- ROOMS: tenant users read, admin write
-- ============================================================
DROP POLICY IF EXISTS "rooms_select_tenant" ON rooms;
CREATE POLICY "rooms_select_tenant" ON rooms
  FOR SELECT USING (
    is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "rooms_insert_admin" ON rooms;
CREATE POLICY "rooms_insert_admin" ON rooms
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "rooms_update_admin" ON rooms;
CREATE POLICY "rooms_update_admin" ON rooms
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "rooms_delete_admin" ON rooms;
CREATE POLICY "rooms_delete_admin" ON rooms
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- LESSONS: teacher + student + parent + admin
-- ============================================================
DROP POLICY IF EXISTS "lessons_select_teacher" ON lessons;
CREATE POLICY "lessons_select_teacher" ON lessons
  FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "lessons_select_student" ON lessons;
CREATE POLICY "lessons_select_student" ON lessons
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "lessons_select_parent" ON lessons;
CREATE POLICY "lessons_select_parent" ON lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = lessons.student_id AND sp.parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "lessons_select_admin" ON lessons;
CREATE POLICY "lessons_select_admin" ON lessons
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "lessons_update_teacher" ON lessons;
CREATE POLICY "lessons_update_teacher" ON lessons
  FOR UPDATE USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "lessons_insert_admin" ON lessons;
CREATE POLICY "lessons_insert_admin" ON lessons
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "lessons_delete_site_admin" ON lessons;
CREATE POLICY "lessons_delete_site_admin" ON lessons
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- LESSON PACKAGES: tenant users read, admin write
-- ============================================================
DROP POLICY IF EXISTS "lesson_packages_select_tenant" ON lesson_packages;
CREATE POLICY "lesson_packages_select_tenant" ON lesson_packages
  FOR SELECT USING (
    is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "lesson_packages_insert_admin" ON lesson_packages;
CREATE POLICY "lesson_packages_insert_admin" ON lesson_packages
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "lesson_packages_update_admin" ON lesson_packages;
CREATE POLICY "lesson_packages_update_admin" ON lesson_packages
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "lesson_packages_delete_admin" ON lesson_packages;
CREATE POLICY "lesson_packages_delete_admin" ON lesson_packages
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- EVENTS: public read (published), admin write
-- ============================================================
DROP POLICY IF EXISTS "events_select_public" ON events;
CREATE POLICY "events_select_public" ON events
  FOR SELECT USING (
    status = 'published' OR
    is_site_admin() OR
    conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "events_insert_admin" ON events;
CREATE POLICY "events_insert_admin" ON events
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "events_update_admin" ON events;
CREATE POLICY "events_update_admin" ON events
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "events_delete_admin" ON events;
CREATE POLICY "events_delete_admin" ON events
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- FORMS: student own + admin own-tenant
-- ============================================================
DROP POLICY IF EXISTS "forms_select_own_student" ON forms;
CREATE POLICY "forms_select_own_student" ON forms
  FOR SELECT USING (
    student_id = auth.uid() OR submitted_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "forms_select_admin" ON forms;
CREATE POLICY "forms_select_admin" ON forms
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "forms_insert_authenticated" ON forms;
CREATE POLICY "forms_insert_authenticated" ON forms
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "forms_update_admin" ON forms;
CREATE POLICY "forms_update_admin" ON forms
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "forms_delete_site_admin" ON forms;
CREATE POLICY "forms_delete_site_admin" ON forms
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- INVOICES: payer + parent + admin
-- ============================================================
DROP POLICY IF EXISTS "invoices_select_payer" ON invoices;
CREATE POLICY "invoices_select_payer" ON invoices
  FOR SELECT USING (payer_id = auth.uid());

DROP POLICY IF EXISTS "invoices_select_parent" ON invoices;
CREATE POLICY "invoices_select_parent" ON invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.parent_id = auth.uid() AND sp.user_id = invoices.payer_id)
  );

DROP POLICY IF EXISTS "invoices_select_admin" ON invoices;
CREATE POLICY "invoices_select_admin" ON invoices
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "invoices_insert_admin" ON invoices;
CREATE POLICY "invoices_insert_admin" ON invoices
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "invoices_update_admin" ON invoices;
CREATE POLICY "invoices_update_admin" ON invoices
  FOR UPDATE USING (is_conservatorium_admin());

DROP POLICY IF EXISTS "invoices_delete_site_admin" ON invoices;
CREATE POLICY "invoices_delete_site_admin" ON invoices
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- INSTRUMENT RENTALS: student/parent own + admin own-tenant
-- ============================================================
DROP POLICY IF EXISTS "instrument_rentals_select_student" ON instrument_rentals;
CREATE POLICY "instrument_rentals_select_student" ON instrument_rentals
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "instrument_rentals_select_parent" ON instrument_rentals;
CREATE POLICY "instrument_rentals_select_parent" ON instrument_rentals
  FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "instrument_rentals_select_admin" ON instrument_rentals;
CREATE POLICY "instrument_rentals_select_admin" ON instrument_rentals
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "instrument_rentals_insert_admin" ON instrument_rentals;
CREATE POLICY "instrument_rentals_insert_admin" ON instrument_rentals
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "instrument_rentals_update_admin" ON instrument_rentals;
CREATE POLICY "instrument_rentals_update_admin" ON instrument_rentals
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "instrument_rentals_delete_site_admin" ON instrument_rentals;
CREATE POLICY "instrument_rentals_delete_site_admin" ON instrument_rentals
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- SCHOLARSHIP APPLICATIONS: student own + admin own-tenant
-- ============================================================
DROP POLICY IF EXISTS "scholarship_applications_select_student" ON scholarship_applications;
CREATE POLICY "scholarship_applications_select_student" ON scholarship_applications
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "scholarship_applications_select_admin" ON scholarship_applications;
CREATE POLICY "scholarship_applications_select_admin" ON scholarship_applications
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "scholarship_applications_insert_student" ON scholarship_applications;
CREATE POLICY "scholarship_applications_insert_student" ON scholarship_applications
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "scholarship_applications_update_admin" ON scholarship_applications;
CREATE POLICY "scholarship_applications_update_admin" ON scholarship_applications
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "scholarship_applications_delete_site_admin" ON scholarship_applications;
CREATE POLICY "scholarship_applications_delete_site_admin" ON scholarship_applications
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- ANNOUNCEMENTS: admin own-tenant write, tenant users read
-- ============================================================
DROP POLICY IF EXISTS "announcements_select_tenant" ON announcements;
CREATE POLICY "announcements_select_tenant" ON announcements
  FOR SELECT USING (
    is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "announcements_insert_admin" ON announcements;
CREATE POLICY "announcements_insert_admin" ON announcements
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "announcements_update_admin" ON announcements;
CREATE POLICY "announcements_update_admin" ON announcements
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "announcements_delete_admin" ON announcements;
CREATE POLICY "announcements_delete_admin" ON announcements
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- REPERTOIRE LIBRARY: public read (approved), ministry write
-- ============================================================
DROP POLICY IF EXISTS "repertoire_select_public" ON repertoire_library;
CREATE POLICY "repertoire_select_public" ON repertoire_library
  FOR SELECT USING (approved = true OR is_site_admin() OR harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR'));

DROP POLICY IF EXISTS "repertoire_insert_ministry" ON repertoire_library;
CREATE POLICY "repertoire_insert_ministry" ON repertoire_library
  FOR INSERT WITH CHECK (harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR') OR is_site_admin());

DROP POLICY IF EXISTS "repertoire_update_ministry" ON repertoire_library;
CREATE POLICY "repertoire_update_ministry" ON repertoire_library
  FOR UPDATE USING (harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR') OR is_site_admin());

DROP POLICY IF EXISTS "repertoire_delete_site_admin" ON repertoire_library;
CREATE POLICY "repertoire_delete_site_admin" ON repertoire_library
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- DONATION CAUSES: public read (active), admin write
-- ============================================================
DROP POLICY IF EXISTS "donation_causes_select_public" ON donation_causes;
CREATE POLICY "donation_causes_select_public" ON donation_causes
  FOR SELECT USING (
    is_active = true OR
    is_site_admin() OR
    conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "donation_causes_insert_admin" ON donation_causes;
CREATE POLICY "donation_causes_insert_admin" ON donation_causes
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "donation_causes_update_admin" ON donation_causes;
CREATE POLICY "donation_causes_update_admin" ON donation_causes
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "donation_causes_delete_admin" ON donation_causes;
CREATE POLICY "donation_causes_delete_admin" ON donation_causes
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ============================================================
-- DONATION RECORDS: donor own + admin own-tenant
-- ============================================================
DROP POLICY IF EXISTS "donation_records_select_own" ON donation_records;
CREATE POLICY "donation_records_select_own" ON donation_records
  FOR SELECT USING (
    donor_user_id = auth.uid() OR
    is_site_admin() OR
    conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "donation_records_insert_authenticated" ON donation_records;
CREATE POLICY "donation_records_insert_authenticated" ON donation_records
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "donation_records_update_admin" ON donation_records;
CREATE POLICY "donation_records_update_admin" ON donation_records
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "donation_records_delete_site_admin" ON donation_records;
CREATE POLICY "donation_records_delete_site_admin" ON donation_records
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- PAYROLL SNAPSHOTS: teacher own (read) + admin own-tenant
-- ============================================================
DROP POLICY IF EXISTS "payroll_snapshots_select_teacher" ON payroll_snapshots;
CREATE POLICY "payroll_snapshots_select_teacher" ON payroll_snapshots
  FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "payroll_snapshots_select_admin" ON payroll_snapshots;
CREATE POLICY "payroll_snapshots_select_admin" ON payroll_snapshots
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "payroll_snapshots_insert_admin" ON payroll_snapshots;
CREATE POLICY "payroll_snapshots_insert_admin" ON payroll_snapshots
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "payroll_snapshots_update_admin" ON payroll_snapshots;
CREATE POLICY "payroll_snapshots_update_admin" ON payroll_snapshots
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "payroll_snapshots_delete_site_admin" ON payroll_snapshots;
CREATE POLICY "payroll_snapshots_delete_site_admin" ON payroll_snapshots
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- ALUMNI PROFILES: public read (if is_public), admin write
-- ============================================================
DROP POLICY IF EXISTS "alumni_profiles_select_public" ON alumni_profiles;
CREATE POLICY "alumni_profiles_select_public" ON alumni_profiles
  FOR SELECT USING (
    is_public = true OR
    user_id = auth.uid() OR
    is_site_admin() OR
    conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "alumni_profiles_update_own" ON alumni_profiles;
CREATE POLICY "alumni_profiles_update_own" ON alumni_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "alumni_profiles_insert_admin" ON alumni_profiles;
CREATE POLICY "alumni_profiles_insert_admin" ON alumni_profiles
  FOR INSERT WITH CHECK (is_conservatorium_admin());

DROP POLICY IF EXISTS "alumni_profiles_delete_site_admin" ON alumni_profiles;
CREATE POLICY "alumni_profiles_delete_site_admin" ON alumni_profiles
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- MASTER CLASSES: public read (published), admin write
-- ============================================================
DROP POLICY IF EXISTS "master_classes_select_public" ON master_classes;
CREATE POLICY "master_classes_select_public" ON master_classes
  FOR SELECT USING (
    status = 'published' OR
    is_site_admin() OR
    conservatorium_id::text = harmonia_conservatorium_id()
  );

DROP POLICY IF EXISTS "master_classes_insert_admin" ON master_classes;
CREATE POLICY "master_classes_insert_admin" ON master_classes
  FOR INSERT WITH CHECK (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "master_classes_update_admin" ON master_classes;
CREATE POLICY "master_classes_update_admin" ON master_classes
  FOR UPDATE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

DROP POLICY IF EXISTS "master_classes_delete_admin" ON master_classes;
CREATE POLICY "master_classes_delete_admin" ON master_classes
  FOR DELETE USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- ------------------------------------------------------------
-- D. VERIFICATION
-- Run this query after applying the schema to confirm all
-- tables have RLS enabled. The result MUST be empty.
-- ------------------------------------------------------------
-- Verify: SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
-- Result MUST be empty after running this file.
