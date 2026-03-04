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
  address TEXT,
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
  last_name VARCHAR(100) NOT NULL,
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
  instruments TEXT[] DEFAULT '{}',
  education TEXT[] DEFAULT '{}',
  video_url TEXT,
  available_for_new_students BOOLEAN DEFAULT TRUE,
  lesson_durations INT[] DEFAULT '{45}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONSERVATORIUM INSTRUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS conservatorium_instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  names JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  available_for_registration BOOLEAN DEFAULT TRUE,
  available_for_rental BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conservatorium_id, id)
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
  instruments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
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
-- RENTALS
-- ============================================================
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
-- ALUMNI
-- ============================================================
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
