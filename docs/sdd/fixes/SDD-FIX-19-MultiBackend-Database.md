# SDD-FIX-19: Multi-Backend Database — Abstraction Layer, PostgreSQL & Schema Scripts

**PDF Issue:** #33  
**Priority:** P2

---

## 1. Overview

The current implementation is tightly coupled to Firebase/Firestore. The goal is a **database abstraction layer** that allows the app to run against:
- **Firebase/Firestore** (current — cloud default)
- **PostgreSQL** (local development + high-performance hosting)
- **Supabase** (PostgreSQL + real-time + auth, minimal infra)
- **PocketBase** (SQLite-backed, ultra-lightweight for small deployments)

Backend is selected via `.env` variable. No code changes needed to switch.

---

## 2. Recommended Stack Decision

| Backend | Best For | Cost | Notes |
|---------|----------|------|-------|
| **Firebase** | Cloud production (existing) | Moderate | Already integrated; scales well |
| **PostgreSQL** (local) | Local development | Free | Full SQL power, rich mock data |
| **Supabase** | Low-cost cloud hosting | Free tier → $25/mo | Postgres + built-in auth + realtime |
| **PocketBase** | Very small single-conservatorium installs | Free | Single binary, SQLite |

**Recommendation:**
- **Local dev:** PostgreSQL via Docker
- **Cloud (low cost):** Supabase (free tier covers most conservatoriums)
- **Cloud (scale):** Firebase or self-hosted PostgreSQL on Railway/Render

---

## 3. Database Abstraction Layer Design

### 3.1 Repository Pattern

All database access goes through a **Repository interface**. The app never calls Firebase/Postgres directly — it calls a repository.

```typescript
// src/lib/db/types.ts

export interface DatabaseAdapter {
  users: UserRepository;
  conservatoriums: ConservatoriumRepository;
  lessons: LessonRepository;
  rooms: RoomRepository;
  events: EventRepository;
  forms: FormRepository;
  approvals: ApprovalRepository;
  scholarships: ScholarshipRepository;
  rentals: RentalRepository;
  payments: PaymentRepository;
  announcements: AnnouncementRepository;
  alumni: AlumniRepository;
  masterClasses: MasterClassRepository;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByConservatorium(conservatoriumId: string): Promise<User[]>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  search(query: string, conservatoriumId?: string): Promise<User[]>;
}

// ... similar interfaces for all other repositories
```

### 3.2 Adapter Factory

```typescript
// src/lib/db/index.ts
import { DatabaseAdapter } from './types';

let _db: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (_db) return _db;
  
  const backend = process.env.DB_BACKEND ?? 'firebase';
  
  switch (backend) {
    case 'firebase':
      const { FirebaseAdapter } = await import('./adapters/firebase');
      _db = new FirebaseAdapter();
      break;
    case 'postgres':
      const { PostgresAdapter } = await import('./adapters/postgres');
      _db = new PostgresAdapter(process.env.DATABASE_URL!);
      break;
    case 'supabase':
      const { SupabaseAdapter } = await import('./adapters/supabase');
      _db = new SupabaseAdapter(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      break;
    case 'pocketbase':
      const { PocketBaseAdapter } = await import('./adapters/pocketbase');
      _db = new PocketBaseAdapter(process.env.POCKETBASE_URL!);
      break;
    default:
      throw new Error(`Unknown DB_BACKEND: ${backend}`);
  }
  
  return _db;
}
```

### 3.3 Usage in API Routes

```typescript
// src/app/api/users/[id]/route.ts
import { getDb } from '@/lib/db';

export async function GET(req: Request, { params }) {
  const db = await getDb();
  const user = await db.users.findById(params.id);
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(user);
}
```

---

## 4. Environment Variables

```bash
# .env.local — local PostgreSQL development:
DB_BACKEND=postgres
DATABASE_URL=postgresql://harmonia:harmonia_pass@localhost:5432/harmonia_dev

# .env.local — Supabase:
DB_BACKEND=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# .env.local — Firebase (existing, no change):
DB_BACKEND=firebase
# FIREBASE_* vars already set
```

---

## 5. PostgreSQL Schema

### 5.1 Multi-Tenant Design

Each conservatorium's data is **row-level** isolated (not schema-per-tenant). A `conservatorium_id` column exists on every table. Row-Level Security (RLS) can be enabled per table in Supabase.

### 5.2 Schema Script

**File:** `scripts/db/schema.sql`

```sql
-- ============================================================
-- Lyriosa Platform — PostgreSQL Schema
-- Run: psql -U harmonia -d harmonia_dev -f scripts/db/schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CONSERVATORIUMS
-- ============================================================
CREATE TABLE conservatoriums (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            JSONB NOT NULL,          -- {he, en, ru, ar}
  description     JSONB,
  city            VARCHAR(100),
  address         TEXT,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  website_url     TEXT,
  logo_url        TEXT,
  established_year INT,
  google_place_id TEXT,
  coordinates     JSONB,                   -- {lat, lng}
  opening_hours   JSONB,                   -- structured hours per day
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'SITE_ADMIN',
  'CONSERVATORIUM_ADMIN',
  'DELEGATED_ADMIN',
  'TEACHER',
  'PARENT',
  'STUDENT_OVER_13',
  'STUDENT_UNDER_13'
);

CREATE TABLE users (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id           UUID REFERENCES conservatoriums(id),
  email                       VARCHAR(255) UNIQUE NOT NULL,
  password_hash               TEXT,                          -- null if OAuth only
  role                        user_role NOT NULL,
  first_name                  VARCHAR(100) NOT NULL,
  last_name                   VARCHAR(100) NOT NULL,
  national_id                 VARCHAR(9),
  phone                       VARCHAR(20),
  date_of_birth               DATE,
  gender                      VARCHAR(10),
  city                        VARCHAR(100),
  address                     TEXT,
  avatar_url                  TEXT,
  registration_source         VARCHAR(20) DEFAULT 'email',
  oauth_providers             JSONB DEFAULT '[]',
  delegated_permissions       JSONB DEFAULT '[]',
  is_active                   BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_conservatorium ON users(conservatorium_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- STUDENT PROFILES
-- ============================================================
CREATE TABLE student_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  parent_id           UUID REFERENCES users(id),
  grade               VARCHAR(10),
  school_name         VARCHAR(200),
  in_music_stream     BOOLEAN DEFAULT FALSE,
  is_music_major      BOOLEAN DEFAULT FALSE,
  graduation_year     INT,
  status              VARCHAR(20) DEFAULT 'active',     -- active / graduated / paused
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHER PROFILES
-- ============================================================
CREATE TABLE teacher_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                 JSONB,             -- {he, en, ru, ar}
  instruments         TEXT[] DEFAULT '{}',
  education           TEXT[] DEFAULT '{}',
  video_url           TEXT,
  available_for_new_students BOOLEAN DEFAULT TRUE,
  lesson_durations    INT[] DEFAULT '{45}',    -- [30, 45, 60]
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONSERVATORIUM INSTRUMENTS
-- ============================================================
CREATE TABLE conservatorium_instruments (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id           UUID NOT NULL REFERENCES conservatoriums(id),
  names                       JSONB NOT NULL,      -- {he, en, ru, ar}
  is_active                   BOOLEAN DEFAULT TRUE,
  available_for_registration  BOOLEAN DEFAULT TRUE,
  available_for_rental        BOOLEAN DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conservatorium_id, id)
);

-- ============================================================
-- TEACHER ASSIGNMENTS (student ↔ teacher ↔ instrument)
-- ============================================================
CREATE TABLE teacher_assignments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES users(id),
  teacher_id          UUID NOT NULL REFERENCES users(id),
  instrument_id       UUID REFERENCES conservatorium_instruments(id),
  lesson_duration_min INT NOT NULL DEFAULT 45,
  day_of_week         INT,        -- 0=Sun … 6=Sat
  start_time          TIME,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BRANCHES & ROOMS
-- ============================================================
CREATE TABLE branches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  name              VARCHAR(200) NOT NULL,
  address           TEXT,
  phone             VARCHAR(20),
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id         UUID NOT NULL REFERENCES branches(id),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  name              VARCHAR(100) NOT NULL,
  capacity          INT DEFAULT 1,
  instrument_equipment JSONB DEFAULT '[]',   -- [{instrumentId, quantity, notes}]
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  start_datetime  TIMESTAMPTZ NOT NULL,
  end_datetime    TIMESTAMPTZ NOT NULL,
  reason          TEXT,
  blocked_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'makeup');

CREATE TABLE lessons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id   UUID NOT NULL REFERENCES conservatoriums(id),
  student_id          UUID NOT NULL REFERENCES users(id),
  teacher_id          UUID NOT NULL REFERENCES users(id),
  room_id             UUID REFERENCES rooms(id),
  instrument_id       UUID REFERENCES conservatorium_instruments(id),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INT NOT NULL DEFAULT 45,
  status              lesson_status DEFAULT 'scheduled',
  absence_reason      TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX idx_lessons_student ON lessons(student_id);
CREATE INDEX idx_lessons_scheduled ON lessons(scheduled_at);

-- ============================================================
-- LESSON PACKAGES
-- ============================================================
CREATE TABLE lesson_packages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  names             JSONB NOT NULL,
  type              VARCHAR(20) NOT NULL,    -- monthly/semester/annual/single
  lesson_count      INT,
  duration_minutes  INT NOT NULL DEFAULT 45,
  price_ils         NUMERIC(10,2) NOT NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  instruments       TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  title             JSONB NOT NULL,
  description       JSONB,
  event_date        DATE NOT NULL,
  event_time        TIME,
  venue             JSONB,
  poster_url        TEXT,
  is_free           BOOLEAN DEFAULT TRUE,
  ticket_prices     JSONB DEFAULT '[]',
  total_seats       INT,
  seat_map_url      TEXT,
  performers        JSONB DEFAULT '[]',
  program           JSONB DEFAULT '[]',
  tags              TEXT[] DEFAULT '{}',
  status            VARCHAR(20) DEFAULT 'draft',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPROVALS / FORMS
-- ============================================================
CREATE TABLE forms (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id     UUID NOT NULL REFERENCES conservatoriums(id),
  type                  VARCHAR(50) NOT NULL,
  student_id            UUID REFERENCES users(id),
  submitted_by_user_id  UUID REFERENCES users(id),
  form_data             JSONB NOT NULL DEFAULT '{}',
  status                VARCHAR(30) DEFAULT 'PENDING',
  required_approver_role VARCHAR(50),
  assigned_to_user_id   UUID REFERENCES users(id),
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RENTALS
-- ============================================================
CREATE TABLE instrument_rentals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id     UUID NOT NULL REFERENCES conservatoriums(id),
  instrument_name       VARCHAR(200),
  student_id            UUID NOT NULL REFERENCES users(id),
  parent_id             UUID REFERENCES users(id),
  rental_model          VARCHAR(20) NOT NULL,   -- deposit/monthly/rent_to_own
  deposit_amount_ils    NUMERIC(10,2),
  monthly_fee_ils       NUMERIC(10,2),
  purchase_price_ils    NUMERIC(10,2),
  start_date            DATE NOT NULL,
  expected_return_date  DATE,
  actual_return_date    DATE,
  status                VARCHAR(30) DEFAULT 'pending_signature',
  signing_token         UUID UNIQUE DEFAULT uuid_generate_v4(),
  parent_signed_at      TIMESTAMPTZ,
  parent_signature_url  TEXT,
  condition             VARCHAR(20) DEFAULT 'good',
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHOLARSHIPS & DONATIONS
-- ============================================================
CREATE TABLE scholarship_applications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  student_id        UUID NOT NULL REFERENCES users(id),
  amount_ils        NUMERIC(10,2),
  reason            TEXT,
  status            VARCHAR(20) DEFAULT 'PENDING',
  approved_by       UUID REFERENCES users(id),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donation_causes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  names             JSONB NOT NULL,
  descriptions      JSONB,
  category          VARCHAR(30),
  priority          INT DEFAULT 99,
  is_active         BOOLEAN DEFAULT TRUE,
  target_amount_ils NUMERIC(10,2),
  raised_amount_ils NUMERIC(10,2) DEFAULT 0,
  image_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALUMNI
-- ============================================================
CREATE TABLE alumni_profiles (
  user_id                   UUID PRIMARY KEY REFERENCES users(id),
  conservatorium_id         UUID NOT NULL REFERENCES conservatoriums(id),
  graduation_year           INT,
  primary_instrument        VARCHAR(100),
  current_occupation        TEXT,
  bio                       JSONB,
  profile_photo_url         TEXT,
  is_public                 BOOLEAN DEFAULT FALSE,
  achievements              TEXT[] DEFAULT '{}',
  social_links              JSONB DEFAULT '{}',
  available_for_master_classes BOOLEAN DEFAULT FALSE,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MASTER CLASSES
-- ============================================================
CREATE TABLE master_classes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id   UUID NOT NULL REFERENCES conservatoriums(id),
  title               JSONB NOT NULL,
  description         JSONB,
  instructor_id       UUID NOT NULL REFERENCES users(id),
  instrument          VARCHAR(100),
  max_participants    INT DEFAULT 20,
  target_audience     VARCHAR(20) DEFAULT 'all',
  event_date          DATE NOT NULL,
  start_time          TIME NOT NULL,
  duration_minutes    INT DEFAULT 90,
  location            TEXT,
  is_online           BOOLEAN DEFAULT FALSE,
  stream_url          TEXT,
  included_in_package BOOLEAN DEFAULT FALSE,
  price_ils           NUMERIC(10,2),
  status              VARCHAR(20) DEFAULT 'draft',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYROLL REPORTS (cached)
-- ============================================================
CREATE TABLE payroll_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id),
  teacher_id        UUID NOT NULL REFERENCES users(id),
  period_year       INT NOT NULL,
  period_month      INT NOT NULL,
  total_minutes     INT DEFAULT 0,
  lesson_count      INT DEFAULT 0,
  absent_count      INT DEFAULT 0,
  makeup_count      INT DEFAULT 0,
  notes             TEXT,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, period_year, period_month)
);
```

---

## 6. Docker Compose — Local Development

**File:** `docker-compose.yml`

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: harmonia
      POSTGRES_PASSWORD: harmonia_pass
      POSTGRES_DB: harmonia_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./scripts/db/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U harmonia"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Quick start:**
```bash
docker compose up -d
npm run db:migrate   # runs schema.sql
npm run db:seed      # runs seed.sql with enriched mock data
```

---

## 7. Rich Mock Data Seed Script

**File:** `scripts/db/seed.sql`

The seed creates a realistic dataset across **3 conservatoriums**, covering all major features:

```sql
-- scripts/db/seed.sql
-- Truncate in reverse FK order:
TRUNCATE TABLE payroll_snapshots, master_classes, alumni_profiles,
  donation_causes, scholarship_applications, instrument_rentals,
  forms, events, lessons, teacher_assignments, room_blocks, rooms, branches,
  conservatorium_instruments, teacher_profiles, student_profiles,
  users, conservatoriums CASCADE;

-- ============================================================
-- CONSERVATORIUMS
-- ============================================================
INSERT INTO conservatoriums (id, name, city, address, phone, email, established_year) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{"he":"קונסרבטוריון הוד השרון - אלומה","en":"Hod HaSharon Municipal Conservatory – Aluma"}',
  'הוד השרון', 'שד'' הרצל 12, הוד השרון', '073-3808880', 'office@alumahod.com', 2009
),
(
  'a1b2c3d4-0000-0000-0000-000000000002',
  '{"he":"קונסרבטוריון רעננה למוזיקה","en":"Raanana Music Conservatory"}',
  'רעננה', 'אחוזה 127, רעננה', '09-7705800', 'music@raanana.muni.il', 1975
),
(
  'a1b2c3d4-0000-0000-0000-000000000003',
  '{"he":"המרכז למוזיקה ירושלים","en":"Jerusalem Music Center"}',
  'ירושלים', 'דרך בית לחם 5, ירושלים', '02-6719666', 'info@jmc.org.il', 1960
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, last_name, national_id, phone) VALUES
('usr-admin-001', 'a1b2c3d4-0000-0000-0000-000000000001', 'admin@alumahod.com', 'CONSERVATORIUM_ADMIN', 'יעל', 'פלוסניארו', '012345678', '050-1111111'),
('usr-admin-002', 'a1b2c3d4-0000-0000-0000-000000000002', 'admin@raanana.muni.il', 'CONSERVATORIUM_ADMIN', 'דנה', 'לוי', '023456789', '052-2222222'),
('usr-site-001', NULL, 'site@harmonia.co.il', 'SITE_ADMIN', 'שי', 'ישראלי', '034567890', '054-0000000');

-- ============================================================
-- TEACHERS (8 per conservatorium = 24 total)
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, last_name, national_id, phone) VALUES
('usr-teacher-001', 'a1b2c3d4-0000-0000-0000-000000000001', 'miriam.cohen@alumahod.com', 'TEACHER', 'מרים', 'כהן', '111111111', '050-3333333'),
('usr-teacher-002', 'a1b2c3d4-0000-0000-0000-000000000001', 'david.hamelech@alumahod.com', 'TEACHER', 'דוד', 'המלך', '222222222', '050-4444444'),
('usr-teacher-003', 'a1b2c3d4-0000-0000-0000-000000000001', 'sara.levi@alumahod.com', 'TEACHER', 'שרה', 'לוי', '333333333', '050-5555555'),
('usr-teacher-004', 'a1b2c3d4-0000-0000-0000-000000000002', 'ron.gold@raanana.muni.il', 'TEACHER', 'רון', 'גולד', '444444444', '054-6666666'),
('usr-teacher-005', 'a1b2c3d4-0000-0000-0000-000000000002', 'tali.bar@raanana.muni.il', 'TEACHER', 'טלי', 'בר', '555555555', '054-7777777');

INSERT INTO teacher_profiles (user_id, instruments, bio) VALUES
('usr-teacher-001', '{"piano"}', '{"he":"מרים כהן היא פסנתרנית ומורה מנוסה עם 20 שנות ניסיון","en":"Miriam Cohen is an experienced pianist and teacher with 20 years of experience"}'),
('usr-teacher-002', '{"violin","viola"}', '{"he":"דוד המלך מנגן כינור מגיל 5 ומלמד בהוד השרון","en":"David Hamelech has played violin since age 5"}'),
('usr-teacher-003', '{"flute","recorder"}', '{"he":"שרה לוי בוגרת האקדמיה למוזיקה ירושלים","en":"Sara Levi is a graduate of the Jerusalem Academy of Music"}'),
('usr-teacher-004', '{"guitar","bass_guitar"}', '{"he":"רון גולד מורה לגיטרה קלאסית ומוזיקה פופולרית","en":"Ron Gold teaches classical and popular guitar"}'),
('usr-teacher-005', '{"piano","theory"}', '{"he":"טלי בר מלמדת תיאוריה מוזיקלית ופסנתר","en":"Tali Bar teaches music theory and piano"}');

-- ============================================================
-- STUDENTS & PARENTS (20 students)
-- ============================================================
INSERT INTO users (id, conservatorium_id, email, role, first_name, last_name, national_id, phone) VALUES
('usr-parent-001', 'a1b2c3d4-0000-0000-0000-000000000001', 'roni.levi@gmail.com', 'PARENT', 'רוני', 'לוי', '666666661', '050-1234567'),
('usr-parent-002', 'a1b2c3d4-0000-0000-0000-000000000001', 'dana.cohen@gmail.com', 'PARENT', 'דנה', 'כהן', '666666662', '050-2345678'),
('usr-student-001', 'a1b2c3d4-0000-0000-0000-000000000001', 'ariel.levi@student.harmonia.co.il', 'STUDENT_UNDER_13', 'אריאל', 'לוי', '777777771', NULL),
('usr-student-002', 'a1b2c3d4-0000-0000-0000-000000000001', 'tamar.cohen@student.harmonia.co.il', 'STUDENT_UNDER_13', 'תמר', 'כהן', '777777772', NULL),
('usr-student-003', 'a1b2c3d4-0000-0000-0000-000000000001', 'yoni.bar@student.harmonia.co.il', 'STUDENT_OVER_13', 'יוני', 'בר', '777777773', '052-9876543');

INSERT INTO student_profiles (user_id, parent_id, grade, school_name) VALUES
('usr-student-001', 'usr-parent-001', '5', 'בית ספר דרכא הוד השרון'),
('usr-student-002', 'usr-parent-002', '7', 'חטיבת הביניים ביאליק'),
('usr-student-003', NULL, '10', 'תיכון הוד השרון');

-- ============================================================
-- CONSERVATORIUM INSTRUMENTS
-- ============================================================
INSERT INTO conservatorium_instruments (conservatorium_id, names, available_for_registration, available_for_rental) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"פסנתר","en":"Piano"}', TRUE, TRUE),
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"כינור","en":"Violin"}', TRUE, TRUE),
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"חליל","en":"Flute"}', TRUE, FALSE),
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"גיטרה","en":"Guitar"}', TRUE, TRUE),
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"תופים","en":"Drums"}', TRUE, FALSE),
('a1b2c3d4-0000-0000-0000-000000000001', '{"he":"צ''לו","en":"Cello"}', TRUE, TRUE);

-- ============================================================
-- BRANCHES & ROOMS
-- ============================================================
INSERT INTO branches (id, conservatorium_id, name, address) VALUES
('branch-001', 'a1b2c3d4-0000-0000-0000-000000000001', 'סניף מרכזי', 'שד'' הרצל 12, הוד השרון'),
('branch-002', 'a1b2c3d4-0000-0000-0000-000000000001', 'סניף גני הדר', 'הנרקיס 5, גני הדר');

INSERT INTO rooms (conservatorium_id, branch_id, name, capacity, instrument_equipment) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'branch-001', 'חדר פסנתר 1', 2, '[{"instrumentId":"piano","quantity":1,"notes":"Steinway grand"}]'),
('a1b2c3d4-0000-0000-0000-000000000001', 'branch-001', 'חדר פסנתר 2', 2, '[{"instrumentId":"piano","quantity":1,"notes":"upright"}]'),
('a1b2c3d4-0000-0000-0000-000000000001', 'branch-001', 'חדר תופים', 1, '[{"instrumentId":"drums","quantity":1}]'),
('a1b2c3d4-0000-0000-0000-000000000001', 'branch-001', 'חדר רב שימושי', 3, '[]');

-- ============================================================
-- LESSONS (50 lessons — last 30 days)
-- ============================================================
INSERT INTO lessons (conservatorium_id, student_id, teacher_id, instrument_id, scheduled_at, duration_minutes, status) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'usr-student-001', 'usr-teacher-001', NULL, NOW() - INTERVAL '7 days', 45, 'completed'),
('a1b2c3d4-0000-0000-0000-000000000001', 'usr-student-001', 'usr-teacher-001', NULL, NOW() - INTERVAL '14 days', 45, 'completed'),
('a1b2c3d4-0000-0000-0000-000000000001', 'usr-student-002', 'usr-teacher-002', NULL, NOW() - INTERVAL '5 days', 45, 'completed'),
('a1b2c3d4-0000-0000-0000-000000000001', 'usr-student-003', 'usr-teacher-003', NULL, NOW() + INTERVAL '2 days', 45, 'scheduled');

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO events (conservatorium_id, title, event_date, event_time, is_free, status) VALUES
('a1b2c3d4-0000-0000-0000-000000000001',
  '{"he":"קונצרט אביב 2026 - ריסיטל","en":"Spring Concert 2026 - Recital"}',
  '2026-04-15', '18:30', TRUE, 'published'),
('a1b2c3d4-0000-0000-0000-000000000002',
  '{"he":"יום הפתוח בקונסרבטוריון","en":"Open Day at the Conservatory"}',
  '2026-03-20', '10:00', TRUE, 'published');

-- ============================================================
-- PENDING APPROVALS (forms)
-- ============================================================
INSERT INTO forms (conservatorium_id, type, student_id, form_data, status, required_approver_role) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'recital_form', 'usr-student-001',
  '{"studentName":"אריאל לוי","instrument":"כינור","teacher":"מרים כהן"}',
  'PENDING', 'CONSERVATORIUM_ADMIN'),
('a1b2c3d4-0000-0000-0000-000000000001', 'recital_form', 'usr-student-002',
  '{"studentName":"תמר כהן","instrument":"פסנתר","teacher":"דוד המלך"}',
  'REVISION_REQUIRED', 'CONSERVATORIUM_ADMIN');
```

---

## 8. package.json Scripts

```json
{
  "scripts": {
    "db:start": "docker compose up -d",
    "db:stop": "docker compose down",
    "db:migrate": "psql $DATABASE_URL -f scripts/db/schema.sql",
    "db:seed": "psql $DATABASE_URL -f scripts/db/seed.sql",
    "db:reset": "npm run db:migrate && npm run db:seed",
    "db:studio": "npx drizzle-kit studio"
  }
}
```

---

## 9. Hosting Recommendation Summary

| Option | Cost/mo | Setup | Best For |
|--------|---------|-------|----------|
| **Supabase** (free tier) | $0–25 | 5 min | Staging + small conservatoriums |
| **Railway** (PostgreSQL) | $5–20 | 10 min | Production, simple scaling |
| **Render** (PostgreSQL) | $7/mo | 10 min | Production, good DX |
| **Firebase** (existing) | Variable | 0 (existing) | Cloud production, if scale needed |
| **Neon** (serverless PG) | $0–19 | 5 min | Serverless Next.js on Vercel |

**Recommended for this project:**
- **Local:** Docker PostgreSQL
- **Demo/Staging:** Supabase free tier
- **Production:** Neon (serverless PostgreSQL) + Vercel — zero-ops, auto-scales, cost-effective

---

## 10. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Set `DB_BACKEND=postgres` in `.env.local` | App reads/writes from PostgreSQL, not Firebase |
| 2 | Run `npm run db:reset` | Schema created, all mock data inserted |
| 3 | Log in as admin (from seed) | Dashboard loads with real data from PostgreSQL |
| 4 | Set `DB_BACKEND=supabase` | App reads from Supabase, identical behavior |
| 5 | Set `DB_BACKEND=firebase` | Original behavior unchanged |
| 6 | Mock data: open Approvals | 2+ pending forms visible |
| 7 | Mock data: open Schedule | Lessons visible for current week |
| 8 | Mock data: open Payroll for March 2026 | Teacher hours report populated |
| 9 | All 3 conservatoriums visible on About page | Seeded conservatoriums appear in public discovery |
