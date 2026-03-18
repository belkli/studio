# 01 -- Security Setup Guide

**Audience:** Backend engineers, DevOps, security reviewers
**Last updated:** 2026-03-14
**Companion docs:** `docs/architecture/06-security.md`, `docs/plans/qa/12-security-review.md`

> This guide covers every security configuration needed before Lyriosa can accept real user data. Follow each section in order. Every item has a checkbox -- do not skip any.

---

## Table of Contents

1. [Supabase RLS Policies -- Table by Table](#1-supabase-rls-policies----table-by-table)
2. [Parent-Child Data Isolation](#2-parent-child-data-isolation)
3. [API Security](#3-api-security)
4. [Auth Security](#4-auth-security)
5. [Data Protection (PDPPA)](#5-data-protection-pdppa)
6. [Input Validation](#6-input-validation)
7. [Demo Gate Security](#7-demo-gate-security)
8. [Security Checklist (Pre-Launch)](#8-security-checklist-pre-launch)

---

## 1. Supabase RLS Policies -- Table by Table

When the Supabase backend is active (`DB_BACKEND=supabase`), all tables **must** have RLS enabled. The service role key (used by Server Actions via `src/lib/db/supabase-adapter.ts`) bypasses RLS, but any direct client-side Supabase queries do not. RLS is defense-in-depth: even if the service key leaks, policies limit the blast radius.

### 1.0 Prerequisites

- [ ] **Step 1.** Open the Supabase dashboard for your project.
- [ ] **Step 2.** Navigate to **SQL Editor**.
- [ ] **Step 3.** Confirm that all tables from `scripts/db/schema.sql` have been created.
- [ ] **Step 4.** Run all SQL blocks below in order. Each block is self-contained.

### 1.1 Helper Function: Role from JWT

Every policy below reads the caller's role and conservatorium from the Supabase JWT. Create this helper function first:

```sql
-- ============================================================
-- HELPER: Extract Lyriosa claims from Supabase JWT
-- ============================================================
-- Supabase stores Custom Claims in auth.jwt()->'app_metadata'.
-- Firebase Custom Claims are synced to app_metadata during
-- the login flow (see /api/auth/login).
-- ============================================================

CREATE OR REPLACE FUNCTION harmonia_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'role',
    auth.jwt()->>'role'
  );
$$;

CREATE OR REPLACE FUNCTION harmonia_conservatorium_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'conservatoriumId',
    auth.jwt()->>'conservatoriumId'
  );
$$;

CREATE OR REPLACE FUNCTION is_site_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT harmonia_role() IN ('SITE_ADMIN', 'site_admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION is_conservatorium_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT harmonia_role() IN (
    'CONSERVATORIUM_ADMIN', 'conservatorium_admin',
    'DELEGATED_ADMIN', 'delegated_admin',
    'SITE_ADMIN', 'site_admin', 'superadmin'
  );
$$;
```

- [ ] **Step 5.** Run the helper function block above.

---

### 1.2 Table: `conservatoriums`

**Access rules:**
- Anyone (including anonymous) can read conservatorium public info (name, city, website).
- Only `conservatorium_admin` for their own conservatorium, or `site_admin`, can update.
- Only `site_admin` can insert or delete.

```sql
-- ============================================================
-- TABLE: conservatoriums
-- ============================================================
ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read access (landing page, enrollment wizard)
CREATE POLICY "conservatoriums_select_public"
  ON conservatoriums FOR SELECT
  USING (true);

-- Policy 2: Conservatorium admin can update their own conservatorium
CREATE POLICY "conservatoriums_update_own_admin"
  ON conservatoriums FOR UPDATE
  USING (
    is_site_admin()
    OR (
      is_conservatorium_admin()
      AND id::text = harmonia_conservatorium_id()
    )
  )
  WITH CHECK (
    is_site_admin()
    OR (
      is_conservatorium_admin()
      AND id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 3: Only site_admin can insert new conservatoriums
CREATE POLICY "conservatoriums_insert_site_admin"
  ON conservatoriums FOR INSERT
  WITH CHECK (is_site_admin());

-- Policy 4: Only site_admin can delete conservatoriums
CREATE POLICY "conservatoriums_delete_site_admin"
  ON conservatoriums FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 6.** Run the `conservatoriums` RLS block.

---

### 1.3 Table: `users`

**Access rules:**
- Users can read their own row.
- Parents can read their children's rows (via `student_profiles.parent_id`).
- Teachers can read students assigned to them (via `teacher_assignments`).
- `conservatorium_admin` / `delegated_admin` can read all users in their conservatorium.
- `site_admin` can read all users.
- Users can update only their own profile fields.
- Only admins can insert or delete users.

```sql
-- ============================================================
-- TABLE: users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own row
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Parents can read their children
CREATE POLICY "users_select_parent_children"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = users.id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 3: Teachers can read their assigned students
CREATE POLICY "users_select_teacher_students"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.student_id = users.id
        AND ta.teacher_id = auth.uid()
        AND ta.is_active = true
    )
  );

-- Policy 4: Conservatorium admins can read users in their conservatorium
CREATE POLICY "users_select_conservatorium_admin"
  ON users FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 5: Users can update their own row (limited fields)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent role escalation: role cannot change via self-update
    AND role = (SELECT u.role FROM users u WHERE u.id = auth.uid())
  );

-- Policy 6: Admins can update users in their conservatorium
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 7: Only admins can insert users
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT
  WITH CHECK (is_conservatorium_admin());

-- Policy 8: Only site_admin can delete users (DSAR erasure)
CREATE POLICY "users_delete_site_admin"
  ON users FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 7.** Run the `users` RLS block.

---

### 1.4 Table: `student_profiles`

```sql
-- ============================================================
-- TABLE: student_profiles
-- ============================================================
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can read their own profile
CREATE POLICY "student_profiles_select_own"
  ON student_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Parents can read their child's profile
CREATE POLICY "student_profiles_select_parent"
  ON student_profiles FOR SELECT
  USING (parent_id = auth.uid());

-- Policy 3: Teachers can read assigned students' profiles
CREATE POLICY "student_profiles_select_teacher"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.student_id = student_profiles.user_id
        AND ta.teacher_id = auth.uid()
        AND ta.is_active = true
    )
  );

-- Policy 4: Admins can read student profiles in their conservatorium
CREATE POLICY "student_profiles_select_admin"
  ON student_profiles FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = student_profiles.user_id
          AND u.conservatorium_id::text = harmonia_conservatorium_id()
      )
    )
  );

-- Policy 5: Admins can insert/update student profiles
CREATE POLICY "student_profiles_insert_admin"
  ON student_profiles FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "student_profiles_update_admin"
  ON student_profiles FOR UPDATE
  USING (is_conservatorium_admin());

-- Policy 6: Only site_admin can delete (DSAR)
CREATE POLICY "student_profiles_delete_site_admin"
  ON student_profiles FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 8.** Run the `student_profiles` RLS block.

---

### 1.5 Table: `teacher_profiles`

```sql
-- ============================================================
-- TABLE: teacher_profiles
-- ============================================================
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Teachers can read their own profile
CREATE POLICY "teacher_profiles_select_own"
  ON teacher_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Public read for teacher directory (landing page shows teachers)
CREATE POLICY "teacher_profiles_select_public"
  ON teacher_profiles FOR SELECT
  USING (available_for_new_students = true);

-- Policy 3: Admins can read all teacher profiles in their conservatorium
CREATE POLICY "teacher_profiles_select_admin"
  ON teacher_profiles FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = teacher_profiles.user_id
          AND u.conservatorium_id::text = harmonia_conservatorium_id()
      )
    )
  );

-- Policy 4: Teachers can update their own profile
CREATE POLICY "teacher_profiles_update_own"
  ON teacher_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Policy 5: Admins can update teacher profiles
CREATE POLICY "teacher_profiles_update_admin"
  ON teacher_profiles FOR UPDATE
  USING (is_conservatorium_admin());

-- Policy 6: Admins can insert teacher profiles
CREATE POLICY "teacher_profiles_insert_admin"
  ON teacher_profiles FOR INSERT
  WITH CHECK (is_conservatorium_admin());

-- Policy 7: Only site_admin can delete
CREATE POLICY "teacher_profiles_delete_site_admin"
  ON teacher_profiles FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 9.** Run the `teacher_profiles` RLS block.

---

### 1.6 Table: `teacher_ratings`

```sql
-- ============================================================
-- TABLE: teacher_ratings
-- ============================================================
ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read ratings for teachers in their conservatorium
CREATE POLICY "teacher_ratings_select_same_conservatorium"
  ON teacher_ratings FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

-- Policy 2: Authenticated users can insert a rating (one per teacher per reviewer)
CREATE POLICY "teacher_ratings_insert_authenticated"
  ON teacher_ratings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reviewer_user_id = auth.uid()
  );

-- Policy 3: Users can update their own rating
CREATE POLICY "teacher_ratings_update_own"
  ON teacher_ratings FOR UPDATE
  USING (reviewer_user_id = auth.uid());

-- Policy 4: Only site_admin can delete ratings
CREATE POLICY "teacher_ratings_delete_site_admin"
  ON teacher_ratings FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 10.** Run the `teacher_ratings` RLS block.

---

### 1.7 Table: `instrument_catalog`

```sql
-- ============================================================
-- TABLE: instrument_catalog
-- ============================================================
ALTER TABLE instrument_catalog ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read (instruments shown on landing/enrollment)
CREATE POLICY "instrument_catalog_select_public"
  ON instrument_catalog FOR SELECT
  USING (true);

-- Policy 2: Only site_admin can write
CREATE POLICY "instrument_catalog_insert_site_admin"
  ON instrument_catalog FOR INSERT
  WITH CHECK (is_site_admin());

CREATE POLICY "instrument_catalog_update_site_admin"
  ON instrument_catalog FOR UPDATE
  USING (is_site_admin());

CREATE POLICY "instrument_catalog_delete_site_admin"
  ON instrument_catalog FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 11.** Run the `instrument_catalog` RLS block.

---

### 1.8 Table: `conservatorium_instruments`

```sql
-- ============================================================
-- TABLE: conservatorium_instruments
-- ============================================================
ALTER TABLE conservatorium_instruments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read (enrollment wizard, teacher directory)
CREATE POLICY "conservatorium_instruments_select_public"
  ON conservatorium_instruments FOR SELECT
  USING (true);

-- Policy 2: Admins can write for their conservatorium
CREATE POLICY "conservatorium_instruments_insert_admin"
  ON conservatorium_instruments FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

CREATE POLICY "conservatorium_instruments_update_admin"
  ON conservatorium_instruments FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

CREATE POLICY "conservatorium_instruments_delete_admin"
  ON conservatorium_instruments FOR DELETE
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );
```

- [ ] **Step 12.** Run the `conservatorium_instruments` RLS block.

---

### 1.9 Table: `teacher_profile_instruments`

```sql
-- ============================================================
-- TABLE: teacher_profile_instruments
-- ============================================================
ALTER TABLE teacher_profile_instruments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read (teacher directory shows instruments)
CREATE POLICY "teacher_profile_instruments_select_public"
  ON teacher_profile_instruments FOR SELECT
  USING (true);

-- Policy 2: Teachers can manage their own instruments
CREATE POLICY "teacher_profile_instruments_insert_own"
  ON teacher_profile_instruments FOR INSERT
  WITH CHECK (teacher_user_id = auth.uid() OR is_conservatorium_admin());

CREATE POLICY "teacher_profile_instruments_update_own"
  ON teacher_profile_instruments FOR UPDATE
  USING (teacher_user_id = auth.uid() OR is_conservatorium_admin());

CREATE POLICY "teacher_profile_instruments_delete_own"
  ON teacher_profile_instruments FOR DELETE
  USING (teacher_user_id = auth.uid() OR is_conservatorium_admin());
```

- [ ] **Step 13.** Run the `teacher_profile_instruments` RLS block.

---

### 1.10 Table: `teacher_assignments`

```sql
-- ============================================================
-- TABLE: teacher_assignments
-- ============================================================
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Teachers see their own assignments
CREATE POLICY "teacher_assignments_select_teacher"
  ON teacher_assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Policy 2: Students see their own assignments
CREATE POLICY "teacher_assignments_select_student"
  ON teacher_assignments FOR SELECT
  USING (student_id = auth.uid());

-- Policy 3: Parents see their children's assignments
CREATE POLICY "teacher_assignments_select_parent"
  ON teacher_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = teacher_assignments.student_id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 4: Admins see all assignments in their conservatorium
CREATE POLICY "teacher_assignments_select_admin"
  ON teacher_assignments FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = teacher_assignments.student_id
          AND u.conservatorium_id::text = harmonia_conservatorium_id()
      )
    )
  );

-- Policy 5: Only admins can insert/update/delete assignments
CREATE POLICY "teacher_assignments_write_admin"
  ON teacher_assignments FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "teacher_assignments_update_admin"
  ON teacher_assignments FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "teacher_assignments_delete_admin"
  ON teacher_assignments FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 14.** Run the `teacher_assignments` RLS block.

---

### 1.11 Tables: `branches`, `rooms`, `room_blocks`

```sql
-- ============================================================
-- TABLE: branches
-- ============================================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select_same_conservatorium"
  ON branches FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

CREATE POLICY "branches_write_admin"
  ON branches FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "branches_update_admin"
  ON branches FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "branches_delete_admin"
  ON branches FOR DELETE
  USING (is_site_admin());

-- ============================================================
-- TABLE: rooms
-- ============================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_same_conservatorium"
  ON rooms FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

CREATE POLICY "rooms_write_admin"
  ON rooms FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "rooms_update_admin"
  ON rooms FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "rooms_delete_admin"
  ON rooms FOR DELETE
  USING (is_site_admin());

-- ============================================================
-- TABLE: room_blocks
-- ============================================================
ALTER TABLE room_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_blocks_select_same_conservatorium"
  ON room_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      WHERE r.id = room_blocks.room_id
        AND (r.conservatorium_id::text = harmonia_conservatorium_id() OR is_site_admin())
    )
  );

CREATE POLICY "room_blocks_write_admin"
  ON room_blocks FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "room_blocks_update_admin"
  ON room_blocks FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "room_blocks_delete_admin"
  ON room_blocks FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 15.** Run the `branches`, `rooms`, `room_blocks` RLS block.

---

### 1.12 Table: `lessons`

**Access rules:**
- Teachers see lessons where they are the teacher.
- Students see lessons where they are the student.
- Parents see their children's lessons.
- Admins see all lessons in their conservatorium.
- Teachers can update lesson status/notes for their own lessons.
- Only admins can insert or delete lessons.

```sql
-- ============================================================
-- TABLE: lessons
-- ============================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Policy 1: Teachers see their own lessons
CREATE POLICY "lessons_select_teacher"
  ON lessons FOR SELECT
  USING (teacher_id = auth.uid());

-- Policy 2: Students see their own lessons
CREATE POLICY "lessons_select_student"
  ON lessons FOR SELECT
  USING (student_id = auth.uid());

-- Policy 3: Parents see their children's lessons
CREATE POLICY "lessons_select_parent"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = lessons.student_id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 4: Admins see lessons in their conservatorium
CREATE POLICY "lessons_select_admin"
  ON lessons FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 5: Teachers can update their own lessons (status, notes, absence_reason)
CREATE POLICY "lessons_update_teacher"
  ON lessons FOR UPDATE
  USING (teacher_id = auth.uid());

-- Policy 6: Admins can update any lesson in their conservatorium
CREATE POLICY "lessons_update_admin"
  ON lessons FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 7: Only admins can insert lessons
CREATE POLICY "lessons_insert_admin"
  ON lessons FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 8: Only site_admin can delete lessons (data integrity)
CREATE POLICY "lessons_delete_site_admin"
  ON lessons FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 16.** Run the `lessons` RLS block.

---

### 1.13 Table: `lesson_packages`

```sql
-- ============================================================
-- TABLE: lesson_packages
-- ============================================================
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read for active packages (booking wizard)
CREATE POLICY "lesson_packages_select_public"
  ON lesson_packages FOR SELECT
  USING (is_active = true OR is_conservatorium_admin());

-- Policy 2: Admins can write packages for their conservatorium
CREATE POLICY "lesson_packages_insert_admin"
  ON lesson_packages FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lesson_packages_update_admin"
  ON lesson_packages FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lesson_packages_delete_admin"
  ON lesson_packages FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 17.** Run the `lesson_packages` RLS block.

---

### 1.14 Table: `lesson_package_instruments`

```sql
-- ============================================================
-- TABLE: lesson_package_instruments
-- ============================================================
ALTER TABLE lesson_package_instruments ENABLE ROW LEVEL SECURITY;

-- Public read (tied to visible packages)
CREATE POLICY "lesson_package_instruments_select_public"
  ON lesson_package_instruments FOR SELECT
  USING (true);

CREATE POLICY "lesson_package_instruments_write_admin"
  ON lesson_package_instruments FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "lesson_package_instruments_update_admin"
  ON lesson_package_instruments FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "lesson_package_instruments_delete_admin"
  ON lesson_package_instruments FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 18.** Run the `lesson_package_instruments` RLS block.

---

### 1.15 Table: `events`

```sql
-- ============================================================
-- TABLE: events
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Published events are public
CREATE POLICY "events_select_published"
  ON events FOR SELECT
  USING (status = 'published' OR is_conservatorium_admin());

-- Policy 2: Admins can write events for their conservatorium
CREATE POLICY "events_insert_admin"
  ON events FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "events_update_admin"
  ON events FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "events_delete_admin"
  ON events FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 19.** Run the `events` RLS block.

---

### 1.16 Table: `forms`

**Access rules:**
- Users can read forms they submitted.
- Students can read forms about them.
- Parents can read forms about their children.
- Admins can read all forms in their conservatorium.

```sql
-- ============================================================
-- TABLE: forms
-- ============================================================
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read forms they submitted
CREATE POLICY "forms_select_submitter"
  ON forms FOR SELECT
  USING (submitted_by_user_id = auth.uid());

-- Policy 2: Users can read forms about them (student_id)
CREATE POLICY "forms_select_subject"
  ON forms FOR SELECT
  USING (student_id = auth.uid());

-- Policy 3: Parents can read forms about their children
CREATE POLICY "forms_select_parent"
  ON forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = forms.student_id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 4: Assigned approver can read the form
CREATE POLICY "forms_select_approver"
  ON forms FOR SELECT
  USING (assigned_to_user_id = auth.uid());

-- Policy 5: Admins can read all forms in their conservatorium
CREATE POLICY "forms_select_admin"
  ON forms FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (
      is_site_admin()
      OR conservatorium_id::text = harmonia_conservatorium_id()
    )
  );

-- Policy 6: Authenticated users can submit forms
CREATE POLICY "forms_insert_authenticated"
  ON forms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by_user_id = auth.uid()
  );

-- Policy 7: Admins and approvers can update form status
CREATE POLICY "forms_update_admin_or_approver"
  ON forms FOR UPDATE
  USING (
    assigned_to_user_id = auth.uid()
    OR is_conservatorium_admin()
  );

-- Policy 8: Only site_admin can delete forms
CREATE POLICY "forms_delete_site_admin"
  ON forms FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 20.** Run the `forms` RLS block.

---

### 1.17 Table: `announcements`

```sql
-- ============================================================
-- TABLE: announcements
-- ============================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read announcements for their conservatorium
CREATE POLICY "announcements_select_same_conservatorium"
  ON announcements FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

-- Policy 2: Admins can write announcements
CREATE POLICY "announcements_insert_admin"
  ON announcements FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "announcements_update_admin"
  ON announcements FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "announcements_delete_admin"
  ON announcements FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 21.** Run the `announcements` RLS block.

---

### 1.18 Table: `repertoire_library`

```sql
-- ============================================================
-- TABLE: repertoire_library (compositions)
-- ============================================================
ALTER TABLE repertoire_library ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public read for approved compositions
CREATE POLICY "repertoire_library_select_public"
  ON repertoire_library FOR SELECT
  USING (approved = true OR is_site_admin() OR harmonia_role() = 'ministry_director');

-- Policy 2: Ministry director and site_admin can write
CREATE POLICY "repertoire_library_insert_ministry"
  ON repertoire_library FOR INSERT
  WITH CHECK (
    harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR')
    OR is_site_admin()
  );

CREATE POLICY "repertoire_library_update_ministry"
  ON repertoire_library FOR UPDATE
  USING (
    harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR')
    OR is_site_admin()
  );

CREATE POLICY "repertoire_library_delete_ministry"
  ON repertoire_library FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 22.** Run the `repertoire_library` RLS block.

---

### 1.19 Table: `instrument_rentals`

```sql
-- ============================================================
-- TABLE: instrument_rentals
-- ============================================================
ALTER TABLE instrument_rentals ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can see their own rentals
CREATE POLICY "instrument_rentals_select_student"
  ON instrument_rentals FOR SELECT
  USING (student_id = auth.uid());

-- Policy 2: Parents can see their children's rentals
CREATE POLICY "instrument_rentals_select_parent"
  ON instrument_rentals FOR SELECT
  USING (parent_id = auth.uid());

-- Policy 3: Admins can see rentals in their conservatorium
CREATE POLICY "instrument_rentals_select_admin"
  ON instrument_rentals FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Policy 4: Parents can update their rental (sign)
CREATE POLICY "instrument_rentals_update_parent_sign"
  ON instrument_rentals FOR UPDATE
  USING (parent_id = auth.uid());

-- Policy 5: Admins can insert and update rentals
CREATE POLICY "instrument_rentals_insert_admin"
  ON instrument_rentals FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "instrument_rentals_update_admin"
  ON instrument_rentals FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "instrument_rentals_delete_admin"
  ON instrument_rentals FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 23.** Run the `instrument_rentals` RLS block.

---

### 1.20 Table: `scholarship_applications`

```sql
-- ============================================================
-- TABLE: scholarship_applications
-- ============================================================
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can see their own applications
CREATE POLICY "scholarship_applications_select_student"
  ON scholarship_applications FOR SELECT
  USING (student_id = auth.uid());

-- Policy 2: Parents can see their children's applications
CREATE POLICY "scholarship_applications_select_parent"
  ON scholarship_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = scholarship_applications.student_id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 3: Admins see all in their conservatorium
CREATE POLICY "scholarship_applications_select_admin"
  ON scholarship_applications FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Policy 4: Authenticated users can submit applications
CREATE POLICY "scholarship_applications_insert_authenticated"
  ON scholarship_applications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 5: Admins can update (approve/reject)
CREATE POLICY "scholarship_applications_update_admin"
  ON scholarship_applications FOR UPDATE
  USING (is_conservatorium_admin());

-- Policy 6: Only site_admin can delete
CREATE POLICY "scholarship_applications_delete_site_admin"
  ON scholarship_applications FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 24.** Run the `scholarship_applications` RLS block.

---

### 1.21 Table: `donation_causes` and `donation_records`

```sql
-- ============================================================
-- TABLE: donation_causes
-- ============================================================
ALTER TABLE donation_causes ENABLE ROW LEVEL SECURITY;

-- Public read for active causes (donation page)
CREATE POLICY "donation_causes_select_public"
  ON donation_causes FOR SELECT
  USING (is_active = true OR is_conservatorium_admin());

CREATE POLICY "donation_causes_write_admin"
  ON donation_causes FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "donation_causes_update_admin"
  ON donation_causes FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "donation_causes_delete_admin"
  ON donation_causes FOR DELETE
  USING (is_site_admin());

-- ============================================================
-- TABLE: donation_records
-- ============================================================
ALTER TABLE donation_records ENABLE ROW LEVEL SECURITY;

-- Donors can see their own records
CREATE POLICY "donation_records_select_donor"
  ON donation_records FOR SELECT
  USING (donor_user_id = auth.uid());

-- Admins see all in their conservatorium
CREATE POLICY "donation_records_select_admin"
  ON donation_records FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Anyone can insert (donation flow may be anonymous via webhook)
CREATE POLICY "donation_records_insert_public"
  ON donation_records FOR INSERT
  WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "donation_records_update_admin"
  ON donation_records FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "donation_records_delete_admin"
  ON donation_records FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 25.** Run the `donation_causes` and `donation_records` RLS block.

---

### 1.22 Table: `invoices`

```sql
-- ============================================================
-- TABLE: invoices
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Payers can see their own invoices
CREATE POLICY "invoices_select_payer"
  ON invoices FOR SELECT
  USING (payer_id = auth.uid());

-- Policy 2: Parents can see invoices for their children
CREATE POLICY "invoices_select_parent"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.parent_id = auth.uid()
        AND sp.user_id = invoices.payer_id
    )
  );

-- Policy 3: Admins can see all invoices in their conservatorium
CREATE POLICY "invoices_select_admin"
  ON invoices FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Policy 4: Only admins can insert invoices
CREATE POLICY "invoices_insert_admin"
  ON invoices FOR INSERT
  WITH CHECK (is_conservatorium_admin());

-- Policy 5: Admins can update invoice status (mark paid, etc.)
CREATE POLICY "invoices_update_admin"
  ON invoices FOR UPDATE
  USING (is_conservatorium_admin());

-- Policy 6: Only site_admin can delete (audit trail)
CREATE POLICY "invoices_delete_site_admin"
  ON invoices FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 26.** Run the `invoices` RLS block.

---

### 1.23 Table: `alumni_profiles`

```sql
-- ============================================================
-- TABLE: alumni_profiles
-- ============================================================
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public profiles are readable by anyone
CREATE POLICY "alumni_profiles_select_public"
  ON alumni_profiles FOR SELECT
  USING (is_public = true);

-- Policy 2: Users can see their own profile
CREATE POLICY "alumni_profiles_select_own"
  ON alumni_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 3: Admins can see all alumni in their conservatorium
CREATE POLICY "alumni_profiles_select_admin"
  ON alumni_profiles FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Policy 4: Users can update their own alumni profile
CREATE POLICY "alumni_profiles_update_own"
  ON alumni_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Policy 5: Admins can write alumni profiles
CREATE POLICY "alumni_profiles_insert_admin"
  ON alumni_profiles FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "alumni_profiles_update_admin"
  ON alumni_profiles FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "alumni_profiles_delete_admin"
  ON alumni_profiles FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 27.** Run the `alumni_profiles` RLS block.

---

### 1.24 Table: `master_classes`

```sql
-- ============================================================
-- TABLE: master_classes
-- ============================================================
ALTER TABLE master_classes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Published master classes are publicly readable
CREATE POLICY "master_classes_select_published"
  ON master_classes FOR SELECT
  USING (status IN ('published', 'completed') OR is_conservatorium_admin());

-- Policy 2: Instructors can see their own classes
CREATE POLICY "master_classes_select_instructor"
  ON master_classes FOR SELECT
  USING (instructor_id = auth.uid());

-- Policy 3: Admins can write
CREATE POLICY "master_classes_insert_admin"
  ON master_classes FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "master_classes_update_admin"
  ON master_classes FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "master_classes_delete_admin"
  ON master_classes FOR DELETE
  USING (is_conservatorium_admin());
```

- [ ] **Step 28.** Run the `master_classes` RLS block.

---

### 1.25 Table: `payroll_snapshots`

```sql
-- ============================================================
-- TABLE: payroll_snapshots
-- ============================================================
ALTER TABLE payroll_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy 1: Teachers can see their own payroll data
CREATE POLICY "payroll_snapshots_select_teacher"
  ON payroll_snapshots FOR SELECT
  USING (teacher_id = auth.uid());

-- Policy 2: Admins can see payroll for their conservatorium
CREATE POLICY "payroll_snapshots_select_admin"
  ON payroll_snapshots FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Policy 3: Only admins can write payroll
CREATE POLICY "payroll_snapshots_insert_admin"
  ON payroll_snapshots FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "payroll_snapshots_update_admin"
  ON payroll_snapshots FOR UPDATE
  USING (is_conservatorium_admin());

-- Policy 4: Only site_admin can delete (financial records)
CREATE POLICY "payroll_snapshots_delete_site_admin"
  ON payroll_snapshots FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 29.** Run the `payroll_snapshots` RLS block.

---

### 1.26 Consent & Compliance Tables

These tables are not in the schema.sql yet but are used via the memory/Firestore adapter. When migrated to Supabase, apply these policies:

```sql
-- ============================================================
-- TABLE: consent_records (create if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(50) NOT NULL,
  given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  given_by_user_id UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  consent_version VARCHAR(10) NOT NULL DEFAULT '2.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Consent records are IMMUTABLE. No updates allowed via client.
-- Revocation is a server-side operation that sets revoked_at.

-- Policy 1: Users can read their own consent records
CREATE POLICY "consent_records_select_own"
  ON consent_records FOR SELECT
  USING (user_id = auth.uid() OR given_by_user_id = auth.uid());

-- Policy 2: Parents can read their children's consent records
CREATE POLICY "consent_records_select_parent"
  ON consent_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = consent_records.user_id
        AND sp.parent_id = auth.uid()
    )
  );

-- Policy 3: Admins can read consent records (DSAR audit)
CREATE POLICY "consent_records_select_admin"
  ON consent_records FOR SELECT
  USING (is_site_admin());

-- Policy 4: Authenticated users can insert their own consent
CREATE POLICY "consent_records_insert_own"
  ON consent_records FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR given_by_user_id = auth.uid())
  );

-- Policy 5: NO client updates -- revocation handled by service role only
-- (No UPDATE policy = denied by default)

-- Policy 6: NO deletes -- immutable audit trail
-- (No DELETE policy = denied by default)

-- ============================================================
-- TABLE: compliance_logs (create if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_logs (
  id TEXT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  subject_id TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  reason TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Compliance logs are APPEND-ONLY. No updates, no deletes.

-- Policy 1: Only site_admin can read compliance logs
CREATE POLICY "compliance_logs_select_site_admin"
  ON compliance_logs FOR SELECT
  USING (is_site_admin());

-- Policy 2: Any authenticated user can insert (server actions write on their behalf)
CREATE POLICY "compliance_logs_insert_authenticated"
  ON compliance_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: NO updates -- append-only
-- (No UPDATE policy = denied by default)

-- Policy 4: NO deletes -- immutable audit trail
-- (No DELETE policy = denied by default)
```

- [ ] **Step 30.** Run the `consent_records` and `compliance_logs` block.

---

### 1.27 Verification

- [ ] **Step 31.** In the Supabase Dashboard, go to **Authentication > Policies**.
- [ ] **Step 32.** Verify that every table listed above shows RLS as **Enabled**.
- [ ] **Step 33.** Run this query to confirm no tables are missing RLS:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

The result should be **empty**. If any tables appear, add RLS policies for them.

- [ ] **Step 34.** Test as an anon user (no JWT): confirm SELECT on `users` returns 0 rows.
- [ ] **Step 35.** Test as an authenticated user: confirm they can only see their own data.

---

## 2. Parent-Child Data Isolation

### 2.1 The Relationship Model

Parent-child links are stored in `student_profiles.parent_id`:

```
student_profiles.user_id  -->  users.id   (the student)
student_profiles.parent_id --> users.id   (the parent)
```

A parent can have multiple children (multiple `student_profiles` rows with the same `parent_id`). A student has at most one parent in the system.

### 2.2 Enforcement Layers

Data isolation is enforced at THREE layers:

| Layer | Mechanism | File |
|-------|-----------|------|
| **1. Database (RLS)** | Every SELECT policy for student data includes a `parent_id = auth.uid()` check | Section 1 above |
| **2. Server Actions** | `requireRole()` + explicit ownership checks | `src/lib/auth-utils.ts` |
| **3. Client UI** | `useAuth()` filters data by current user's relationships | `src/providers/use-auth.tsx` |

### 2.3 Rules for Parent Access

- [ ] **Step 36.** Verify: A parent can ONLY see data for students where `student_profiles.parent_id = parent.uid`.
- [ ] **Step 37.** Verify: A parent CANNOT see another parent's children by guessing student IDs.
- [ ] **Step 38.** Verify: Consent actions validate the parent-child relationship before allowing parental consent:

```typescript
// In saveConsentRecord (src/app/actions/consent.ts:139-146):
if (data.userId !== claims.uid) {
  const user = await db.users.findById(claims.uid);
  const isParentOfTarget = user?.role === 'parent'
    && user?.childIds?.includes(data.userId);
  const isAdmin = ['site_admin', 'conservatorium_admin']
    .includes(claims.role || '');
  if (!isParentOfTarget && !isAdmin) {
    return { success: false, error: 'Cannot record consent for another user' };
  }
}
```

### 2.4 Rules for Teacher Access

- [ ] **Step 39.** Verify: A teacher can ONLY see students assigned to them via `teacher_assignments`.
- [ ] **Step 40.** Verify: A teacher from cons-15 CANNOT see students from cons-66.

### 2.5 Rules for Admin Access

- [ ] **Step 41.** Verify: `conservatorium_admin` can see ALL users in their conservatorium but NONE in other conservatoriums.
- [ ] **Step 42.** Verify: `site_admin` can see ALL users across ALL conservatoriums.
- [ ] **Step 43.** Verify: `delegated_admin` follows the same conservatorium scoping as `conservatorium_admin`.

### 2.6 Under-13 Students

Under-13 students have role `STUDENT_UNDER_13` in the database. Special rules apply:

- [ ] **Step 44.** Under-13 students do NOT have login credentials. The parent is the authenticated actor.
- [ ] **Step 45.** No direct email/SMS is sent to under-13 students.
- [ ] **Step 46.** Practice videos use signed URLs with expiry, not public URLs.
- [ ] **Step 47.** Parental consent is required and recorded separately via `isMinorConsent: true` in `saveConsentRecord`.

---

## 3. API Security

### 3.1 Server Action Authentication

All Server Actions use one of two auth wrappers:

| Wrapper | Checks Auth? | Checks Role? | Use When |
|---------|-------------|-------------|----------|
| `withAuth(schema, action)` | Yes | No | Action is available to any authenticated user |
| `requireRole(roles, conservatoriumId?)` | Yes | Yes | Action requires specific roles + optional tenant scoping |

**File:** `src/lib/auth-utils.ts`

- [ ] **Step 48.** Audit every Server Action in `src/app/actions/` and confirm each uses `withAuth()` or `requireRole()`:

| Action File | Functions | Auth Method |
|-------------|-----------|-------------|
| `consent.ts` | `recordConsentAction` | `requireRole(all roles)` |
| `consent.ts` | `saveConsentRecord` | `withAuth()` + manual ownership check |
| `consent.ts` | `getConsentStatus` | `withAuth()` + manual ownership check |
| `dsar.ts` | `exportUserDataAction` | `withAuth()` |
| `dsar.ts` | `requestDataDeletionAction` | `withAuth()` |
| `dsar.ts` | `withdrawConsentAction` | `withAuth()` |
| `billing.ts` | `cancelPackageAction` | `withAuth()` |
| `signatures.ts` | `submitSignatureAction` | `requireRole(signing roles)` |
| `translate.ts` | `translateCompositionData` | Verify it checks role |
| `auth.ts` | Various | Check each function |
| `rental-otp.ts` | OTP functions | Check each function |
| `reschedule-lesson.ts` | Reschedule | Check auth |
| `makeup.ts` | Makeup credit | Check auth |
| `matchmaker.ts` | Teacher matching | Check auth |
| `sick-leave.ts` | Sick leave | Check auth |
| `attendance.ts` | Attendance | Check auth |
| `practice-log.ts` | Practice logging | Check auth |
| `waitlist.ts` | Waitlist | Check auth |
| `storage.ts` | File upload | Check auth |
| `user-preferences.ts` | Preferences | Check auth |

### 3.2 No Raw SQL Exposed to Client

- [ ] **Step 49.** Confirm that no Server Action constructs SQL strings from user input. All database access goes through:
  - `getDb()` (returns the configured database adapter)
  - Adapter methods like `db.users.findById()`, `db.lessons.findByConservatorium()`
  - Supabase client with parameterized queries (never string interpolation)

### 3.3 No Sensitive Data in Client Bundles

- [ ] **Step 50.** Run this check to ensure no server secrets leak to client bundles:

```bash
# Search built client chunks for secret patterns
npx next build 2>/dev/null
grep -r "FIREBASE_SERVICE_ACCOUNT_KEY\|SUPABASE_SERVICE_KEY\|CARDCOM_WEBHOOK_SECRET\|SUPABASE_SERVICE_ROLE_KEY" .next/static/ || echo "PASS: No secrets in client bundle"
```

- [ ] **Step 51.** Verify that all secret env vars are in `.env.local` (not `.env`) and that `.env.local` is in `.gitignore`.
- [ ] **Step 52.** Verify that only `NEXT_PUBLIC_*` env vars are accessible from client code.

### 3.4 Security Headers

- [ ] **Step 53.** Verify `next.config.ts` security headers include:
  - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] **Step 54.** Verify CSP header allows only trusted domains (Firebase, Google APIs, Cardcom).

### 3.5 API Route Auth Audit

The Edge Proxy (`src/proxy.ts`) passes ALL `/api/*` routes without auth injection. Each API route must implement its own auth:

- [ ] **Step 55.** Audit each API route:

| Route | Auth Required? | Mechanism |
|-------|---------------|-----------|
| `/api/auth/login` | No (public login endpoint) | Rate limiting (10 req/15 min) |
| `/api/auth/logout` | Yes (session cookie) | Reads `__session` cookie |
| `/api/cardcom-webhook` | Yes (HMAC) | `x-cardcom-hmac-sha256` header, `timingSafeEqual` |
| `/api/bootstrap` | Dev only | Should be disabled in production |

- [ ] **Step 56.** Ensure `/api/bootstrap` returns 404 or 403 when `NODE_ENV=production`.

### 3.6 Rate Limiting

- [ ] **Step 57.** Verify the login endpoint has rate limiting (`src/app/api/auth/login/route.ts`):
  - Limit: 10 requests per 15-minute window
  - Returns HTTP 429 when exceeded

- [ ] **Step 58.** **PRODUCTION TODO:** Replace in-memory rate limiter with distributed store (Upstash Redis or Cloudflare KV). The in-memory limiter resets on server restart and is per-instance.

---

## 4. Auth Security

### 4.1 Firebase Auth Configuration

- [ ] **Step 59.** In the Firebase Console, go to **Authentication > Settings**.
- [ ] **Step 60.** Enable these sign-in methods:
  - Email/Password
  - Google OAuth
  - Microsoft OAuth
- [ ] **Step 61.** Set password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
- [ ] **Step 62.** Enable email verification for new accounts.

### 4.2 JWT Token Validation

The session flow:

```
Client                    Server
  |                         |
  |-- signInWith*() ------->| Firebase Auth
  |<-- ID Token ------------|
  |                         |
  |-- POST /api/auth/login -|
  |   { idToken }           |
  |                         |-- createSessionCookie(idToken, 14d)
  |<-- Set-Cookie: __session |
  |                         |
  |-- GET /dashboard ------>|
  |   Cookie: __session     |-- proxy.ts: extractClaimsFromCookie (lightweight)
  |                         |-- injects x-user-id, x-user-role headers
  |                         |
  |                         |-- Server Action: verifyAuth()
  |                         |   calls provider.verifySessionCookie() (cryptographic)
```

- [ ] **Step 63.** Verify that `createSessionCookie` in `auth-utils.ts:191` passes `SESSION_EXPIRY_MS / 1000` (= 14 days in seconds).
- [ ] **Step 64.** Verify that the HTTP cookie `maxAge` in `/api/auth/login/route.ts` matches `SESSION_MAX_AGE = 14 * 24 * 60 * 60`.
- [ ] **Step 65.** Verify that `verifySessionCookie()` performs cryptographic verification (not just JWT decode).

### 4.3 Session Management

- [ ] **Step 66.** Verify the `__session` cookie attributes:

| Attribute | Required Value | Why |
|-----------|---------------|-----|
| `HttpOnly` | `true` | Prevents JavaScript access (XSS mitigation) |
| `Secure` | `true` | Only sent over HTTPS |
| `SameSite` | `lax` or `strict` | CSRF protection |
| `Path` | `/` | Available on all routes |
| `maxAge` | `1209600` (14 days) | Session expiry |

- [ ] **Step 67.** Verify that `/api/auth/logout` calls `revokeUserSessions(uid)` to invalidate ALL sessions.
- [ ] **Step 68.** Verify that the logout flow clears the `__session` cookie.

### 4.4 OAuth Security (Google/Microsoft)

- [ ] **Step 69.** In Firebase Console > Authentication > Settings > Authorized domains, verify only these domains are listed:
  - `harmonia.co.il` (production)
  - `harmonia-staging.web.app` (staging)
  - `localhost` (dev only -- remove for production)
- [ ] **Step 70.** In Google Cloud Console, verify OAuth redirect URIs are locked to your domains.
- [ ] **Step 71.** In Azure AD (for Microsoft OAuth), verify redirect URIs are locked to your domains.

### 4.5 Password Policies

- [ ] **Step 72.** Firebase Auth enforces minimum 6 characters by default. For Lyriosa (handling minors' data), configure:
  - Minimum 8 characters (via Firebase Console or custom validation)
  - Block common passwords (client-side validation in the registration form)
- [ ] **Step 73.** Verify that password reset emails are sent from your verified domain.

### 4.6 Dev Bypass Safety

The dev bypass in `src/proxy.ts` and `src/lib/auth-utils.ts` activates when BOTH:
- `NODE_ENV !== 'production'`
- No `FIREBASE_SERVICE_ACCOUNT_KEY` or `SUPABASE_SERVICE_KEY` is present

- [ ] **Step 74.** Add a startup assertion to `next.config.ts` or a server-side init file:

```typescript
// Recommended: Add to next.config.ts or a server-side init file
if (process.env.NODE_ENV === 'production') {
  const hasAuth = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    || process.env.SUPABASE_SERVICE_KEY;
  if (!hasAuth) {
    throw new Error(
      'FATAL: Production build requires FIREBASE_SERVICE_ACCOUNT_KEY '
      + 'or SUPABASE_SERVICE_KEY. Without auth credentials, the dev bypass '
      + 'would grant site_admin to all requests.'
    );
  }
}
```

- [ ] **Step 75.** Verify that Firebase App Hosting sets `NODE_ENV=production` automatically.

---

## 5. Data Protection (PDPPA)

The Israeli Protection of Privacy Law (PDPPA 5741-1981) and its Information Security Regulations apply to Lyriosa because it stores:
- Israeli ID numbers (Teudat Zehut) of minors and parents
- Children's audio/video recordings
- Financial information (payments, invoices, scholarships)
- Ministry exam results
- Health-related data (special needs accommodations)

### 5.1 Consent Records -- Immutable

- [ ] **Step 76.** Verify that consent records are **append-only**:
  - `consent_records` table has NO UPDATE or DELETE RLS policies for non-service roles.
  - Revocation is handled by setting `revoked_at` via the service role key only (in `withdrawConsentAction`).
  - Once `given_at` is set, it can never be changed.

- [ ] **Step 77.** Verify that consent is collected for these types separately (not a single "I agree" checkbox):

| Consent Type | Purpose | Required? |
|-------------|---------|-----------|
| `DATA_PROCESSING` | Store and process personal data | Required for registration |
| `TERMS` | Accept terms of service | Required for registration |
| `MARKETING` | Receive marketing communications | Optional |
| `VIDEO_RECORDING` | Record practice sessions | Optional |
| `PHOTOS` | Use photos for conservatorium marketing | Optional |

- [ ] **Step 78.** Verify parental consent is collected separately when the student is under 13.

### 5.2 Encryption

- [ ] **Step 79.** **At rest:** Supabase provides AES-256 encryption at rest by default. Verify in the Supabase Dashboard under **Settings > Database > Encryption**.
- [ ] **Step 80.** **In transit:** All connections use TLS 1.2+. Verify:
  - HSTS header is set: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - No HTTP endpoints are accessible (all redirected to HTTPS)
- [ ] **Step 81.** **National ID numbers:** Consider application-level encryption for `users.national_id` using `pgcrypto`:

```sql
-- OPTIONAL: Encrypt national_id at application level
-- This adds defense-in-depth if the database is breached.
-- Server Actions would decrypt using a server-side key.
-- Only implement if your security assessment requires it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_encrypted BYTEA;
```

### 5.3 DSAR Compliance (Data Subject Access Requests)

PDPPA Section 13 grants every data subject the right to access, correct, and delete their data.

- [ ] **Step 82.** Verify the DSAR export action (`src/app/actions/dsar.ts:exportUserDataAction`) returns actual data:
  - User profile
  - Consent records
  - Lesson history
  - Invoices
  - Forms submitted

- [ ] **Step 83.** Verify the DSAR deletion action (`requestDataDeletionAction`) creates a tracked `ComplianceLog` entry with action `PII_DELETED`.

- [ ] **Step 84.** Verify the consent withdrawal action (`withdrawConsentAction`) marks records as revoked and creates a `CONSENT_REVOKED` compliance log entry.

- [ ] **Step 85.** All three DSAR actions are accessible from `/dashboard/settings` for ALL roles.

### 5.4 Minor Data Protection (Under-18)

- [ ] **Step 86.** Students under 13 have no login credentials.
- [ ] **Step 87.** Students aged 13-18 (`STUDENT_OVER_13`) can log in but parental consent is still required for data processing.
- [ ] **Step 88.** Practice videos are stored with signed URLs that expire (not public URLs).
- [ ] **Step 89.** No direct marketing emails/SMS are sent to under-18 students.

### 5.5 Audit Logging

- [ ] **Step 90.** Verify that `ComplianceLog` entries are written for:

| Action | When | File |
|--------|------|------|
| `CONSENT_GIVEN` | New consent recorded | `src/app/actions/consent.ts:177` |
| `DATA_EXPORTED` | DSAR export | `src/app/actions/dsar.ts:101` |
| `PII_DELETED` | DSAR deletion request | `src/app/actions/dsar.ts:131` |
| `CONSENT_REVOKED` | Consent withdrawal | `src/app/actions/dsar.ts:176` |
| `SIGNATURE_CREATED` | Digital signature | `src/app/actions/signatures.ts:132` |

- [ ] **Step 91.** Verify that compliance log writes are **non-fatal** (wrapped in try/catch) so they never block user-facing operations.
- [ ] **Step 92.** Verify that compliance logs are **append-only** (no UPDATE or DELETE in RLS, Section 1.26).

### 5.6 Data Retention

- [ ] **Step 93.** Document and implement retention schedules:

| Data Type | Retention Period | Basis |
|-----------|-----------------|-------|
| User profiles | Active + 3 years after deactivation | PDPPA Regulation 3 |
| Lesson records | 7 years | Tax/financial record keeping |
| Practice videos | 1 year after creation | Storage optimization |
| Financial records (invoices) | 7 years | Israeli tax law |
| Consent records | Indefinite | Legal proof of consent |
| Compliance logs | Indefinite | Audit trail |

- [ ] **Step 94.** Schedule Cloud Functions for automated data purge at retention boundaries.

### 5.7 Sub-Processors Disclosure

- [ ] **Step 95.** Verify the privacy page includes a sub-processors table listing:
  - Firebase (Google Cloud) -- Authentication, database
  - Supabase (AWS eu-central-1) -- Database, storage
  - Vercel -- Hosting, CDN
  - Cardcom -- Payment processing
  - Google Gemini -- Translation (no PII sent)

---

## 6. Input Validation

### 6.1 Zod Schemas on All Server Actions

- [ ] **Step 96.** Verify that EVERY Server Action uses Zod for input validation. No `z.any()` should remain:

```bash
# Search for z.any() usage -- should return 0 results
grep -r "z\.any()" src/app/actions/ || echo "PASS: No z.any() found"
```

- [ ] **Step 97.** Verify that Zod schemas enforce:
  - String length limits (prevent oversized payloads)
  - Format validation for IDs (UUID format)
  - Enum validation for status fields
  - Numeric range validation for amounts

### 6.2 XSS Prevention

React escapes all rendered content by default. The risk is in:
- Components using React's raw HTML rendering API
- Markdown renderers without sanitization
- Rich text fields (lesson notes, announcements, teacher bios)

- [ ] **Step 98.** Search for dangerous patterns:

```bash
# Search for raw HTML rendering in React components
grep -r "dangerously" src/ || echo "PASS: No raw HTML rendering found"
```

- [ ] **Step 99.** If any raw HTML rendering is found, ensure the content is sanitized with DOMPurify or a similar library before rendering.
- [ ] **Step 100.** Verify that all user-generated text fields (lesson notes, announcements) are rendered as plain text in React components, not as HTML.

### 6.3 SQL Injection Prevention

- [ ] **Step 101.** Verify that all database queries use parameterized queries:
  - Supabase JS client uses parameterized queries by default
  - No string concatenation or template literals build SQL queries
  - The `getDb()` adapter pattern enforces this

```bash
# Search for potential SQL injection patterns
grep -rn "query\s*(" src/lib/db/ | grep -v "test" || echo "Check results"
```

### 6.4 CSRF Protection

- [ ] **Step 102.** Next.js Server Actions include built-in CSRF protection via the `__next_action_id` header. Verify that:
  - All state-changing operations go through Server Actions (not raw `fetch()` to API routes)
  - API routes that accept POST (like `/api/cardcom-webhook`) validate their own auth (HMAC)
  - The `__session` cookie has `SameSite=lax` or `strict`

### 6.5 Webhook Input Validation

- [ ] **Step 103.** Verify the Cardcom webhook (`src/app/api/cardcom-webhook/route.ts`):
  - HMAC signature is verified using `timingSafeEqual` (prevents timing attacks)
  - `invoiceId` (from `ReturnValue`) is validated as a UUID format before database lookup
  - Only `application/json` and `application/x-www-form-urlencoded` content types are accepted
  - Returns HTTP 500 when `CARDCOM_WEBHOOK_SECRET` is not configured (fail-closed)

---

## 7. Demo Gate Security

### 7.1 Staging Environment Protection

The staging environment should NOT be publicly accessible without authentication.

- [ ] **Step 104.** Choose one protection method:

**Option A: Vercel Password Protection (recommended for staging)**
1. Go to Vercel Dashboard > Project > Settings > General > Password Protection
2. Enable password protection for the staging deployment
3. Set a strong shared password and distribute to team members

**Option B: Custom Demo Gate (`/demo-gate`)**
1. Set the `DEMO_TOKENS` environment variable with comma-separated valid tokens
2. The `/demo-gate` page requires a valid token before granting access
3. Tokens are stored in the session after validation

- [ ] **Step 105.** Whichever method you choose, verify:
  - Unauthenticated users cannot access `/dashboard` on staging
  - The demo gate does not leak into the production build

### 7.2 Demo Data Safety

- [ ] **Step 106.** Verify that seed data in `scripts/db/seed.sql` does NOT contain:
  - Real Israeli ID numbers (all should be placeholder format: `000000000`)
  - Real email addresses (all should be `@harmonia.local` or `@example.com`)
  - Real phone numbers (all should be `050-000-XXXX` format)
  - Real names of actual people (use fictional names)

- [ ] **Step 107.** Verify that `.env.local` is in `.gitignore` and contains no production credentials.

- [ ] **Step 108.** Verify that the `/api/bootstrap` endpoint (which serves mock data) is disabled when `NODE_ENV=production`.

### 7.3 Preview Deployments

- [ ] **Step 109.** For Vercel preview deployments (PR previews):
  - Use a separate Firebase project (DEV) with test data only
  - Never use production Firebase credentials in preview deployments
  - Consider enabling Vercel deployment protection for all non-production branches

---

## 8. Security Checklist (Pre-Launch)

### 8.1 BLOCKERS -- Must Pass Before Any Real User Data

- [ ] **SEC-BLK-01** Supabase/Firestore Security Rules are deployed in the production project. All cross-tenant access tests pass.
- [ ] **SEC-BLK-02** Firebase Storage Security Rules are deployed. Practice videos, invoices, and agreements are not publicly accessible. Signed URLs are used for all downloads.
- [ ] **SEC-BLK-03** DSAR Export produces an actual downloadable file containing the user's PII (not just a toast notification).
- [ ] **SEC-BLK-04** DSAR Deletion Request writes a `DELETION_REQUEST` ComplianceLog entry that is trackable by an admin.
- [ ] **SEC-BLK-05** `saveConsentRecord` rejects `userId` values that do not match `claims.uid` unless valid parental consent flow.
- [ ] **SEC-BLK-06** The `__session` cookie is `HttpOnly` and `Secure` in the production environment.
- [ ] **SEC-BLK-07** Dev bypass CANNOT activate in production: `NODE_ENV=production` with no auth credentials does NOT grant `site_admin` access.
- [ ] **SEC-BLK-08** All `z.any()` Zod schemas are replaced with proper validators (already done as of sprint 3).
- [ ] **SEC-BLK-09** No server secrets (`FIREBASE_SERVICE_ACCOUNT_KEY`, `SUPABASE_SERVICE_KEY`, `CARDCOM_WEBHOOK_SECRET`) appear in client bundles.
- [ ] **SEC-BLK-10** Israeli ID numbers in seed/demo data are fictional (not real Teudat Zehut numbers).

### 8.2 HIGH -- Must Pass Before Public Beta

- [ ] **SEC-HIGH-01** Cross-tenant isolation verified: `conservatorium_admin` from cons-15 CANNOT read/write data from cons-66.
- [ ] **SEC-HIGH-02** XSS test passes for all user-generated content fields (lesson notes, announcements, teacher bios). No raw HTML renders unsanitized content.
- [ ] **SEC-HIGH-03** Rate limiting on login endpoint uses a distributed store (Redis/Upstash), not in-process memory.
- [ ] **SEC-HIGH-04** ComplianceLog entries are written for ALL DSAR operations (export, delete, withdraw consent).
- [ ] **SEC-HIGH-05** `getConsentStatus` rejects queries for `userId !== claims.uid` unless the caller is an admin or parent.
- [ ] **SEC-HIGH-06** Firebase App Check is enabled for all Firebase products (Firestore, Storage, Functions).
- [ ] **SEC-HIGH-07** All Server Action ownership checks are in place -- no action allows operating on another user's data without explicit relationship verification.
- [ ] **SEC-HIGH-08** `recordConsentAction` validates `userId === claims.uid` to prevent consent forgery.

### 8.3 MEDIUM -- Must Pass Before General Availability

- [ ] **SEC-MED-01** `CARDCOM_WEBHOOK_SECRET` is set in staging and production. Webhook requests without valid HMAC are rejected.
- [ ] **SEC-MED-02** `ipAddress` in ConsentRecord is populated from server-side `x-forwarded-for` header, not from client input.
- [ ] **SEC-MED-03** Consent version is dynamically sourced (not hardcoded `'1.0'` / `'2.0'`).
- [ ] **SEC-MED-04** Israeli Registrar of Databases registration application has been submitted.
- [ ] **SEC-MED-05** Data Security Officer (DSO) has been appointed and their contact email is listed in the privacy policy.
- [ ] **SEC-MED-06** Session cookie `SameSite` attribute is set to `strict` (upgraded from `lax`).
- [ ] **SEC-MED-07** OAuth redirect URIs in Firebase Console are locked to production and staging domains only (no `localhost`).
- [ ] **SEC-MED-08** `invoiceId` in Cardcom webhook handler is validated as UUID format before database lookup.

### 8.4 MONITORING -- Required Post-Launch

- [ ] **SEC-MON-01** Breach notification procedure is documented: who is notified within 72 hours, with contact details for the Israeli Privacy Protection Authority.
- [ ] **SEC-MON-02** Independent penetration test is conducted within 90 days of launch. All CRITICAL and HIGH findings are remediated.
- [ ] **SEC-MON-03** Data retention automation is deployed: practice video auto-delete (1 year) and financial record archiving (7 years) via scheduled Cloud Functions.
- [ ] **SEC-MON-04** Security monitoring alerts are configured for: failed login spikes, cross-tenant access attempts, unusual data export volumes.
- [ ] **SEC-MON-05** Dependency vulnerability scanning (npm audit / Snyk) runs on every PR via CI.
- [ ] **SEC-MON-06** All secrets are stored in Google Secret Manager (Firebase) or Vercel Environment Variables (encrypted). No secrets in `.env` files on servers.

---

## Appendix A: Complete RLS Migration Script

To run ALL RLS policies in one shot, concatenate all SQL blocks from Sections 1.1 through 1.26 into a single file:

```bash
# Generate the combined migration file
cat docs/guides/01-security-setup-guide.md | \
  sed -n '/```sql/,/```/p' | \
  sed '/```/d' > scripts/db/rls-policies.sql

# Review the file before running
cat scripts/db/rls-policies.sql

# Run against your Supabase database
psql "$SUPABASE_DB_URL" -f scripts/db/rls-policies.sql
```

Alternatively, paste each block individually into the Supabase SQL Editor.

---

## Appendix B: Security Findings Cross-Reference

This guide addresses the findings from `docs/plans/qa/12-security-review.md`:

| Finding | Severity | Addressed In |
|---------|----------|-------------|
| FINDING-AUTH-01 (SameSite=lax) | MEDIUM | Section 4.3, SEC-MED-06 |
| FINDING-AUTH-02 (Lightweight JWT decode) | LOW | Section 4.2 (documented) |
| FINDING-AUTH-03 (Dev bypass) | LOW | Section 4.6, SEC-BLK-07 |
| FINDING-AUTH-04 (Session expiry sync) | LOW | Section 4.2 Steps 63-64 |
| FINDING-AUTH-05 (No session inventory) | LOW | Not in scope (post-launch) |
| FINDING-AUTHZ-01 (withAuth no role check) | HIGH | Section 3.1, SEC-HIGH-07 |
| FINDING-AUTHZ-02 (Consent forgery) | HIGH | Section 2.3, SEC-BLK-05 |
| FINDING-AUTHZ-03 (getConsentStatus leak) | MEDIUM | Section 2.3, SEC-HIGH-05 |
| FINDING-AUTHZ-04 (API routes no auth) | MEDIUM | Section 3.5 |
| FINDING-AUTHZ-05 (Tenant isolation untested) | MEDIUM | Section 2.5, SEC-HIGH-01 |
| FINDING-AUTHZ-06 (recordConsent all-roles) | LOW | Section 3.1 (documented) |
| FINDING-INPUT-01 (invoiceId unvalidated) | MEDIUM | Section 6.5, SEC-MED-08 |
| FINDING-INPUT-02 (IP trusted from client) | LOW | Section 5.1, SEC-MED-02 |
| FINDING-INPUT-03 (No HTML sanitization) | MEDIUM | Section 6.2, SEC-HIGH-02 |
| FINDING-INPUT-04 (OTP injection) | LOW | Section 6.1 |
| FINDING-DATA-01 (Empty ipAddress) | MEDIUM | SEC-MED-02 |
| FINDING-DATA-02 (Hardcoded consent version) | MEDIUM | SEC-MED-03 |
| FINDING-DATA-03 (DSAR export UI-only) | HIGH | Section 5.3, SEC-BLK-03 |
| FINDING-DATA-04 (DSAR deletion UI-only) | HIGH | Section 5.3, SEC-BLK-04 |
| FINDING-DATA-05 (Firestore direct call) | LOW | Section 5.5 (documented) |
| FINDING-DATA-06 (Signature no size cap) | LOW | Section 6.1 |
| FINDING-API-01 (HMAC proxy vs route) | LOW | Section 6.5 (documented) |
| FINDING-API-02 (In-memory rate limiter) | MEDIUM | Section 3.6, SEC-HIGH-03 |
| FINDING-API-03 (Webhook GET handler) | LOW | Section 6.5 |
| FINDING-API-04 (No Content-Type check) | LOW | Section 6.5 |
| FINDING-API-05 (Login error leak) | LOW | Section 4.2 |
| FINDING-INFRA-01 (Firestore Rules) | CRITICAL | SEC-BLK-01 |
| FINDING-INFRA-02 (Storage Rules) | CRITICAL | SEC-BLK-02 |
| FINDING-INFRA-03 (App Check) | MEDIUM | SEC-HIGH-06 |
| FINDING-INFRA-04 (Supabase key exposure) | MEDIUM | Section 3.3 |
| FINDING-INFRA-05 (OAuth redirects) | MEDIUM | Section 4.4, SEC-MED-07 |
| FINDING-INFRA-06 (ComplianceLog unwired) | HIGH | Section 5.5, SEC-HIGH-04 |

---

*Guide prepared by Security Expert agent -- Lyriosa Setup Guide v1.0, 2026-03-14.*
*All SQL is ready to execute. Test in a staging environment before applying to production.*
