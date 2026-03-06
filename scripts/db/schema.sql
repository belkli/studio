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

