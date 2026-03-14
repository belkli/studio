<!-- SECTION: Security, RLS & Data Protection -->
<!-- Merge into master guide as a top-level section. Heading levels: ## = section, ### = subsection, #### = sub-subsection. -->
<!-- Sources: docs/architecture/06-security.md, docs/plans/qa/12-security-review.md,
     scripts/db/schema.sql, src/lib/auth-utils.ts, src/app/actions/consent.ts,
     src/app/actions/dsar.ts, src/app/actions/signatures.ts, src/app/actions/billing.ts,
     docs/legal/conservatorium-policies-analysis.md, docs/LEGAL-READINESS.md -->

## Security, RLS & Data Protection

> This section covers every security configuration needed before Harmonia can accept real user data. It includes complete SQL for Supabase Row Level Security on every table, parent-child data isolation, auth hardening, PDPPA compliance, input validation, demo gate security, and a pre-launch checklist. Follow each subsection in order. Every item has a checkbox -- do not skip any.
>
> **Companion docs:** `docs/architecture/06-security.md`, `docs/plans/qa/12-security-review.md`

---

### Supabase RLS Policies -- Table by Table

When the Supabase backend is active (`DB_BACKEND=supabase`), all tables **must** have RLS enabled. The service role key (used by Server Actions via `src/lib/db/supabase-adapter.ts`) bypasses RLS, but any direct client-side Supabase queries do not. RLS is defense-in-depth: even if the service key leaks, policies limit the blast radius.

#### RLS Prerequisites

- [ ] **Step 1.** Open the Supabase dashboard for your project.
- [ ] **Step 2.** Navigate to **SQL Editor**.
- [ ] **Step 3.** Confirm that all tables from `scripts/db/schema.sql` have been created.
- [ ] **Step 4.** Run all SQL blocks below in order. Each block is self-contained.

#### Helper Functions: Role from JWT

Every policy below reads the caller's role and conservatorium from the Supabase JWT. Create these helper functions first:

```sql
-- ============================================================
-- HELPER: Extract Harmonia claims from Supabase JWT
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

#### Table: `conservatoriums`

**Access rules:** Anyone can read (public landing page). Only admins can write.

```sql
ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conservatoriums_select_public"
  ON conservatoriums FOR SELECT
  USING (true);

CREATE POLICY "conservatoriums_update_own_admin"
  ON conservatoriums FOR UPDATE
  USING (
    is_site_admin()
    OR (is_conservatorium_admin() AND id::text = harmonia_conservatorium_id())
  )
  WITH CHECK (
    is_site_admin()
    OR (is_conservatorium_admin() AND id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "conservatoriums_insert_site_admin"
  ON conservatoriums FOR INSERT
  WITH CHECK (is_site_admin());

CREATE POLICY "conservatoriums_delete_site_admin"
  ON conservatoriums FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 6.** Run the `conservatoriums` RLS block.

---

#### Table: `users`

**Access rules:** Own row, parent-child, teacher-student, conservatorium admin scoping, site_admin global. Self-update prevents role escalation.

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Parents can read their children
CREATE POLICY "users_select_parent_children"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = users.id
        AND sp.parent_id = auth.uid()
    )
  );

-- Teachers can read their assigned students
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

-- Conservatorium admins can read users in their conservatorium
CREATE POLICY "users_select_conservatorium_admin"
  ON users FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Users can update their own row (role escalation prevented)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT u.role FROM users u WHERE u.id = auth.uid())
  );

-- Admins can update users in their conservatorium
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

-- Only admins can insert users
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT
  WITH CHECK (is_conservatorium_admin());

-- Only site_admin can delete users (DSAR erasure)
CREATE POLICY "users_delete_site_admin"
  ON users FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 7.** Run the `users` RLS block.

---

#### Table: `student_profiles`

```sql
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_profiles_select_own"
  ON student_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "student_profiles_select_parent"
  ON student_profiles FOR SELECT
  USING (parent_id = auth.uid());

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

CREATE POLICY "student_profiles_insert_admin"
  ON student_profiles FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "student_profiles_update_admin"
  ON student_profiles FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "student_profiles_delete_site_admin"
  ON student_profiles FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 8.** Run the `student_profiles` RLS block.

---

#### Table: `teacher_profiles`

```sql
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_profiles_select_own"
  ON teacher_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Public read for teacher directory (landing page)
CREATE POLICY "teacher_profiles_select_public"
  ON teacher_profiles FOR SELECT
  USING (available_for_new_students = true);

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

CREATE POLICY "teacher_profiles_update_own"
  ON teacher_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "teacher_profiles_update_admin"
  ON teacher_profiles FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "teacher_profiles_insert_admin"
  ON teacher_profiles FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "teacher_profiles_delete_site_admin"
  ON teacher_profiles FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 9.** Run the `teacher_profiles` RLS block.

---

#### Table: `teacher_ratings`

```sql
ALTER TABLE teacher_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_ratings_select_same_conservatorium"
  ON teacher_ratings FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

CREATE POLICY "teacher_ratings_insert_authenticated"
  ON teacher_ratings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reviewer_user_id = auth.uid()
  );

CREATE POLICY "teacher_ratings_update_own"
  ON teacher_ratings FOR UPDATE
  USING (reviewer_user_id = auth.uid());

CREATE POLICY "teacher_ratings_delete_site_admin"
  ON teacher_ratings FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 10.** Run the `teacher_ratings` RLS block.

---

#### Table: `instrument_catalog`

```sql
ALTER TABLE instrument_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instrument_catalog_select_public"
  ON instrument_catalog FOR SELECT
  USING (true);

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

#### Table: `conservatorium_instruments`

```sql
ALTER TABLE conservatorium_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conservatorium_instruments_select_public"
  ON conservatorium_instruments FOR SELECT
  USING (true);

CREATE POLICY "conservatorium_instruments_insert_admin"
  ON conservatorium_instruments FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "conservatorium_instruments_update_admin"
  ON conservatorium_instruments FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "conservatorium_instruments_delete_admin"
  ON conservatorium_instruments FOR DELETE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );
```

- [ ] **Step 12.** Run the `conservatorium_instruments` RLS block.

---

#### Table: `teacher_profile_instruments`

```sql
ALTER TABLE teacher_profile_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_profile_instruments_select_public"
  ON teacher_profile_instruments FOR SELECT
  USING (true);

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

#### Table: `teacher_assignments`

```sql
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_assignments_select_teacher"
  ON teacher_assignments FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "teacher_assignments_select_student"
  ON teacher_assignments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "teacher_assignments_select_parent"
  ON teacher_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = teacher_assignments.student_id
        AND sp.parent_id = auth.uid()
    )
  );

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

#### Tables: `branches`, `rooms`, `room_blocks`

```sql
-- branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select_same_conservatorium"
  ON branches FOR SELECT
  USING (conservatorium_id::text = harmonia_conservatorium_id() OR is_site_admin());

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

-- rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_same_conservatorium"
  ON rooms FOR SELECT
  USING (conservatorium_id::text = harmonia_conservatorium_id() OR is_site_admin());

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

-- room_blocks
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

#### Table: `lessons`

```sql
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_teacher"
  ON lessons FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "lessons_select_student"
  ON lessons FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "lessons_select_parent"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = lessons.student_id
        AND sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "lessons_select_admin"
  ON lessons FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lessons_update_teacher"
  ON lessons FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "lessons_update_admin"
  ON lessons FOR UPDATE
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lessons_insert_admin"
  ON lessons FOR INSERT
  WITH CHECK (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lessons_delete_site_admin"
  ON lessons FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 16.** Run the `lessons` RLS block.

---

#### Table: `lesson_packages` and `lesson_package_instruments`

```sql
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_packages_select_public"
  ON lesson_packages FOR SELECT
  USING (is_active = true OR is_conservatorium_admin());

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

-- lesson_package_instruments
ALTER TABLE lesson_package_instruments ENABLE ROW LEVEL SECURITY;

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

- [ ] **Step 17.** Run the `lesson_packages` and `lesson_package_instruments` RLS block.

---

#### Table: `events`

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_published"
  ON events FOR SELECT
  USING (status = 'published' OR is_conservatorium_admin());

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

- [ ] **Step 18.** Run the `events` RLS block.

---

#### Table: `forms`

```sql
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_select_submitter"
  ON forms FOR SELECT
  USING (submitted_by_user_id = auth.uid());

CREATE POLICY "forms_select_subject"
  ON forms FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "forms_select_parent"
  ON forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = forms.student_id
        AND sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "forms_select_approver"
  ON forms FOR SELECT
  USING (assigned_to_user_id = auth.uid());

CREATE POLICY "forms_select_admin"
  ON forms FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "forms_insert_authenticated"
  ON forms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by_user_id = auth.uid()
  );

CREATE POLICY "forms_update_admin_or_approver"
  ON forms FOR UPDATE
  USING (
    assigned_to_user_id = auth.uid()
    OR is_conservatorium_admin()
  );

CREATE POLICY "forms_delete_site_admin"
  ON forms FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 19.** Run the `forms` RLS block.

---

#### Table: `announcements`

```sql
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_same_conservatorium"
  ON announcements FOR SELECT
  USING (
    conservatorium_id::text = harmonia_conservatorium_id()
    OR is_site_admin()
  );

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

- [ ] **Step 20.** Run the `announcements` RLS block.

---

#### Table: `repertoire_library`

```sql
ALTER TABLE repertoire_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "repertoire_library_select_public"
  ON repertoire_library FOR SELECT
  USING (
    approved = true
    OR is_site_admin()
    OR harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR')
  );

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

- [ ] **Step 21.** Run the `repertoire_library` RLS block.

---

#### Table: `instrument_rentals`

```sql
ALTER TABLE instrument_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instrument_rentals_select_student"
  ON instrument_rentals FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "instrument_rentals_select_parent"
  ON instrument_rentals FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "instrument_rentals_select_admin"
  ON instrument_rentals FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "instrument_rentals_update_parent_sign"
  ON instrument_rentals FOR UPDATE
  USING (parent_id = auth.uid());

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

- [ ] **Step 22.** Run the `instrument_rentals` RLS block.

---

#### Table: `scholarship_applications`

```sql
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholarship_applications_select_student"
  ON scholarship_applications FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "scholarship_applications_select_parent"
  ON scholarship_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = scholarship_applications.student_id
        AND sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "scholarship_applications_select_admin"
  ON scholarship_applications FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "scholarship_applications_insert_authenticated"
  ON scholarship_applications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "scholarship_applications_update_admin"
  ON scholarship_applications FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "scholarship_applications_delete_site_admin"
  ON scholarship_applications FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 23.** Run the `scholarship_applications` RLS block.

---

#### Tables: `donation_causes` and `donation_records`

```sql
ALTER TABLE donation_causes ENABLE ROW LEVEL SECURITY;

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

-- donation_records
ALTER TABLE donation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donation_records_select_donor"
  ON donation_records FOR SELECT
  USING (donor_user_id = auth.uid());

CREATE POLICY "donation_records_select_admin"
  ON donation_records FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "donation_records_insert_public"
  ON donation_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "donation_records_update_admin"
  ON donation_records FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "donation_records_delete_admin"
  ON donation_records FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 24.** Run the `donation_causes` and `donation_records` RLS block.

---

#### Table: `invoices`

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_payer"
  ON invoices FOR SELECT
  USING (payer_id = auth.uid());

CREATE POLICY "invoices_select_parent"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.parent_id = auth.uid()
        AND sp.user_id = invoices.payer_id
    )
  );

CREATE POLICY "invoices_select_admin"
  ON invoices FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "invoices_insert_admin"
  ON invoices FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "invoices_update_admin"
  ON invoices FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "invoices_delete_site_admin"
  ON invoices FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 25.** Run the `invoices` RLS block.

---

#### Table: `alumni_profiles`

```sql
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumni_profiles_select_public"
  ON alumni_profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "alumni_profiles_select_own"
  ON alumni_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "alumni_profiles_select_admin"
  ON alumni_profiles FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "alumni_profiles_update_own"
  ON alumni_profiles FOR UPDATE
  USING (user_id = auth.uid());

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

- [ ] **Step 26.** Run the `alumni_profiles` RLS block.

---

#### Table: `master_classes`

```sql
ALTER TABLE master_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_classes_select_published"
  ON master_classes FOR SELECT
  USING (status IN ('published', 'completed') OR is_conservatorium_admin());

CREATE POLICY "master_classes_select_instructor"
  ON master_classes FOR SELECT
  USING (instructor_id = auth.uid());

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

- [ ] **Step 27.** Run the `master_classes` RLS block.

---

#### Table: `payroll_snapshots`

```sql
ALTER TABLE payroll_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_snapshots_select_teacher"
  ON payroll_snapshots FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "payroll_snapshots_select_admin"
  ON payroll_snapshots FOR SELECT
  USING (
    is_conservatorium_admin()
    AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "payroll_snapshots_insert_admin"
  ON payroll_snapshots FOR INSERT
  WITH CHECK (is_conservatorium_admin());

CREATE POLICY "payroll_snapshots_update_admin"
  ON payroll_snapshots FOR UPDATE
  USING (is_conservatorium_admin());

CREATE POLICY "payroll_snapshots_delete_site_admin"
  ON payroll_snapshots FOR DELETE
  USING (is_site_admin());
```

- [ ] **Step 28.** Run the `payroll_snapshots` RLS block.

---

#### Consent & Compliance Tables

These tables are not in `schema.sql` yet but are used via the memory/Firestore adapter. When migrating to Supabase, create and protect them:

```sql
-- consent_records
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

-- IMMUTABLE: No UPDATE or DELETE policies for non-service roles.
-- Revocation sets revoked_at via the service role key only.

CREATE POLICY "consent_records_select_own"
  ON consent_records FOR SELECT
  USING (user_id = auth.uid() OR given_by_user_id = auth.uid());

CREATE POLICY "consent_records_select_parent"
  ON consent_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = consent_records.user_id
        AND sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "consent_records_select_admin"
  ON consent_records FOR SELECT
  USING (is_site_admin());

CREATE POLICY "consent_records_insert_own"
  ON consent_records FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR given_by_user_id = auth.uid())
  );

-- No UPDATE policy = denied by default (immutable)
-- No DELETE policy = denied by default (immutable)

-- compliance_logs
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

-- APPEND-ONLY: No UPDATE or DELETE policies.

CREATE POLICY "compliance_logs_select_site_admin"
  ON compliance_logs FOR SELECT
  USING (is_site_admin());

CREATE POLICY "compliance_logs_insert_authenticated"
  ON compliance_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE policy = denied by default (append-only)
-- No DELETE policy = denied by default (append-only)
```

- [ ] **Step 29.** Run the `consent_records` and `compliance_logs` block.

---

#### RLS Verification

- [ ] **Step 30.** In the Supabase Dashboard, go to **Authentication > Policies**.
- [ ] **Step 31.** Verify every table above shows RLS as **Enabled**.
- [ ] **Step 32.** Run this query to confirm no tables are missing RLS:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

The result should be **empty**. If any tables appear, add RLS policies for them.

- [ ] **Step 33.** Test as an anon user (no JWT): confirm SELECT on `users` returns 0 rows.
- [ ] **Step 34.** Test as an authenticated user: confirm they can only see their own data.

---

### Parent-Child Data Isolation

#### The Relationship Model

Parent-child links are stored in `student_profiles.parent_id`:

```
student_profiles.user_id  -->  users.id   (the student)
student_profiles.parent_id --> users.id   (the parent)
```

A parent can have multiple children (multiple rows with the same `parent_id`). A student has at most one parent.

#### Enforcement Layers

Data isolation is enforced at THREE layers:

| Layer | Mechanism | File |
|-------|-----------|------|
| **1. Database (RLS)** | Every SELECT policy for student data includes a `parent_id = auth.uid()` check | RLS section above |
| **2. Server Actions** | `requireRole()` + explicit ownership checks | `src/lib/auth-utils.ts` |
| **3. Client UI** | `useAuth()` filters data by current user's relationships | `src/providers/use-auth.tsx` |

#### Parent Access Rules

- [ ] **Step 35.** Verify: A parent can ONLY see data for students where `student_profiles.parent_id = parent.uid`.
- [ ] **Step 36.** Verify: A parent CANNOT see another parent's children by guessing student IDs.
- [ ] **Step 37.** Verify: Consent actions validate the parent-child relationship (`src/app/actions/consent.ts:139-146`).

#### Teacher Access Rules

- [ ] **Step 38.** Verify: A teacher can ONLY see students assigned to them via `teacher_assignments`.
- [ ] **Step 39.** Verify: A teacher from cons-15 CANNOT see students from cons-66.

#### Admin Access Rules

- [ ] **Step 40.** Verify: `conservatorium_admin` can see ALL users in their conservatorium but NONE in other conservatoriums.
- [ ] **Step 41.** Verify: `site_admin` can see ALL users across ALL conservatoriums.
- [ ] **Step 42.** Verify: `delegated_admin` follows the same conservatorium scoping as `conservatorium_admin`.

#### Under-13 Students

- [ ] **Step 43.** Under-13 students (role `STUDENT_UNDER_13`) do NOT have login credentials. The parent is the authenticated actor.
- [ ] **Step 44.** No direct email/SMS is sent to under-13 students.
- [ ] **Step 45.** Practice videos use signed URLs with expiry, not public URLs.
- [ ] **Step 46.** Parental consent is required via `isMinorConsent: true` in `saveConsentRecord`.

---

### API Security

#### Server Action Authentication

All Server Actions use one of two auth wrappers (`src/lib/auth-utils.ts`):

| Wrapper | Checks Auth? | Checks Role? | Use When |
|---------|-------------|-------------|----------|
| `withAuth(schema, action)` | Yes | No | Available to any authenticated user |
| `requireRole(roles, conservatoriumId?)` | Yes | Yes | Requires specific roles + optional tenant scoping |

- [ ] **Step 47.** Audit every Server Action in `src/app/actions/` and confirm each uses `withAuth()` or `requireRole()`:

| Action File | Auth Method |
|-------------|-------------|
| `consent.ts` -- `recordConsentAction` | `requireRole(all roles)` |
| `consent.ts` -- `saveConsentRecord` | `withAuth()` + manual ownership check |
| `consent.ts` -- `getConsentStatus` | `withAuth()` + manual ownership check |
| `dsar.ts` -- all 3 functions | `withAuth()` |
| `billing.ts` -- `cancelPackageAction` | `withAuth()` |
| `signatures.ts` -- `submitSignatureAction` | `requireRole(signing roles)` |
| `translate.ts`, `auth.ts`, `rental-otp.ts`, `reschedule-lesson.ts`, `makeup.ts`, `matchmaker.ts`, `sick-leave.ts`, `attendance.ts`, `practice-log.ts`, `waitlist.ts`, `storage.ts`, `user-preferences.ts` | Verify each |

#### No Raw SQL / No Secrets in Client Bundles

- [ ] **Step 48.** Confirm no Server Action constructs SQL from user input. All access goes through `getDb()` adapter methods.
- [ ] **Step 49.** After building (`npx next build`), search `.next/static/` for secret patterns:

```bash
grep -r "FIREBASE_SERVICE_ACCOUNT_KEY\|SUPABASE_SERVICE_KEY\|CARDCOM_WEBHOOK_SECRET" .next/static/ || echo "PASS"
```

- [ ] **Step 50.** Verify `.env.local` is in `.gitignore`. Only `NEXT_PUBLIC_*` vars reach client code.

#### Security Headers

- [ ] **Step 51.** Verify `next.config.ts` includes:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` allowing only Firebase, Google APIs, Cardcom

#### API Route Auth Audit

The Edge Proxy (`src/proxy.ts`) passes ALL `/api/*` routes without auth. Each route implements its own:

- [ ] **Step 52.** Audit each API route:

| Route | Auth | Mechanism |
|-------|------|-----------|
| `/api/auth/login` | Public | Rate limiting (10 req/15 min) |
| `/api/auth/logout` | Session cookie | Reads `__session` |
| `/api/cardcom-webhook` | HMAC | `timingSafeEqual` |
| `/api/bootstrap` | Dev only | Must return 404/403 in production |

- [ ] **Step 53.** Ensure `/api/bootstrap` is disabled when `NODE_ENV=production`.

#### Rate Limiting

- [ ] **Step 54.** Verify login rate limit: 10 requests per 15-minute window, returns HTTP 429 when exceeded.
- [ ] **Step 55.** **Production TODO:** Replace in-memory rate limiter with distributed store (Upstash Redis). Resets on restart; per-instance in multi-node deployments.

---

### Auth Security

#### Firebase Auth Configuration

- [ ] **Step 56.** Enable sign-in methods: Email/Password, Google OAuth, Microsoft OAuth.
- [ ] **Step 57.** Set password requirements: minimum 8 characters, at least one uppercase, one number.
- [ ] **Step 58.** Enable email verification for new accounts.

#### JWT Session Flow

```
Client                    Server
  |-- signInWith*() ------->| Firebase Auth
  |<-- ID Token ------------|
  |-- POST /api/auth/login -|
  |   { idToken }           |-- createSessionCookie(idToken, 14d)
  |<-- Set-Cookie: __session |
  |-- GET /dashboard ------>|
  |   Cookie: __session     |-- proxy.ts: lightweight JWT decode -> headers
  |                         |-- Server Action: verifyAuth() -> cryptographic verify
```

- [ ] **Step 59.** Verify `createSessionCookie` passes `SESSION_EXPIRY_MS / 1000` (14 days in seconds).
- [ ] **Step 60.** Verify HTTP cookie `maxAge` in login route matches `SESSION_MAX_AGE = 14 * 24 * 60 * 60`.

#### Session Cookie Attributes

- [ ] **Step 61.** Verify in production:

| Attribute | Required | Why |
|-----------|----------|-----|
| `HttpOnly` | `true` | Prevents JS access (XSS mitigation) |
| `Secure` | `true` | Only over HTTPS |
| `SameSite` | `lax` or `strict` | CSRF protection |
| `Path` | `/` | All routes |
| `maxAge` | `1209600` | 14-day expiry |

- [ ] **Step 62.** Verify logout calls `revokeUserSessions(uid)` and clears the cookie.

#### OAuth Redirect URI Lockdown

- [ ] **Step 63.** In Firebase Console > Authentication > Authorized domains, list ONLY:
  - `harmonia.co.il` (production)
  - `harmonia-staging.web.app` (staging)
  - `localhost` (dev only -- remove before production)
- [ ] **Step 64.** Lock OAuth redirect URIs in Google Cloud Console and Azure AD to your domains.

#### Dev Bypass Safety

The dev bypass activates when `NODE_ENV !== 'production'` AND no auth credentials are present.

- [ ] **Step 65.** Add a startup assertion:

```typescript
// In next.config.ts or server-side init
if (process.env.NODE_ENV === 'production') {
  const hasAuth = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    || process.env.SUPABASE_SERVICE_KEY;
  if (!hasAuth) {
    throw new Error(
      'FATAL: Production requires auth credentials. '
      + 'Without them, dev bypass grants site_admin to all.'
    );
  }
}
```

- [ ] **Step 66.** Verify Firebase App Hosting sets `NODE_ENV=production` automatically.

---

### Data Protection (PDPPA)

Harmonia stores Israeli ID numbers, children's audio/video, financial data, ministry exam results, and scholarship disclosures. The Israeli Protection of Privacy Law (PDPPA 5741-1981) applies.

#### Consent Records -- Immutable

- [ ] **Step 67.** Verify `consent_records` has NO UPDATE or DELETE RLS policies for non-service roles.
- [ ] **Step 68.** Verify consent is collected for these types separately:

| Consent Type | Purpose | Required? |
|-------------|---------|-----------|
| `DATA_PROCESSING` | Store and process personal data | Yes |
| `TERMS` | Accept terms of service | Yes |
| `MARKETING` | Marketing communications | Optional |
| `VIDEO_RECORDING` | Record practice sessions | Optional |
| `PHOTOS` | Photos for marketing | Optional |

- [ ] **Step 69.** Verify parental consent is collected separately for under-13 students.

#### Encryption

- [ ] **Step 70.** **At rest:** Supabase provides AES-256. Verify in Dashboard > Settings > Database > Encryption.
- [ ] **Step 71.** **In transit:** HSTS header set. No HTTP endpoints accessible.
- [ ] **Step 72.** **National IDs:** Consider application-level encryption for `users.national_id` using `pgcrypto`.

#### DSAR Compliance

PDPPA Section 13: right to access, correct, and delete data.

- [ ] **Step 73.** Verify DSAR export (`src/app/actions/dsar.ts:exportUserDataAction`) returns actual data (profile, consent, lessons, invoices, forms).
- [ ] **Step 74.** Verify DSAR deletion (`requestDataDeletionAction`) creates `PII_DELETED` ComplianceLog entry.
- [ ] **Step 75.** Verify consent withdrawal (`withdrawConsentAction`) marks records revoked + creates `CONSENT_REVOKED` log.
- [ ] **Step 76.** All three DSAR actions accessible from `/dashboard/settings` for ALL roles.

#### Minor Data Protection

- [ ] **Step 77.** Under-13 students have no login credentials.
- [ ] **Step 78.** Students 13-18 require parental consent for data processing.
- [ ] **Step 79.** Practice videos use signed URLs with expiry.
- [ ] **Step 80.** No marketing email/SMS to under-18 students.

#### Audit Logging

- [ ] **Step 81.** Verify ComplianceLog entries written for:

| Action | When | File |
|--------|------|------|
| `CONSENT_GIVEN` | New consent | `consent.ts:177` |
| `DATA_EXPORTED` | DSAR export | `dsar.ts:101` |
| `PII_DELETED` | Deletion request | `dsar.ts:131` |
| `CONSENT_REVOKED` | Withdrawal | `dsar.ts:176` |
| `SIGNATURE_CREATED` | Digital signature | `signatures.ts:132` |

- [ ] **Step 82.** Compliance log writes are non-fatal (try/catch) and append-only (no UPDATE/DELETE in RLS).

#### Data Retention

- [ ] **Step 83.** Implement retention schedules:

| Data Type | Retention | Basis |
|-----------|-----------|-------|
| User profiles | Active + 3 years | PDPPA Regulation 3 |
| Lesson records | 7 years | Tax record keeping |
| Practice videos | 1 year | Storage optimization |
| Financial records | 7 years | Israeli tax law |
| Consent records | Indefinite | Legal proof |
| Compliance logs | Indefinite | Audit trail |

- [ ] **Step 84.** Schedule Cloud Functions for automated data purge at retention boundaries.

#### Sub-Processors

- [ ] **Step 85.** Verify privacy page lists sub-processors: Firebase, Supabase, Vercel, Cardcom, Google Gemini.

---

### Input Validation

#### Zod Schemas

- [ ] **Step 86.** Verify every Server Action uses Zod. No `z.any()` should remain:

```bash
grep -r "z\.any()" src/app/actions/ || echo "PASS: No z.any() found"
```

- [ ] **Step 87.** Verify schemas enforce string length limits, UUID format, enum validation, numeric ranges.

#### XSS Prevention

- [ ] **Step 88.** Search for raw HTML rendering patterns:

```bash
grep -r "dangerously" src/ || echo "PASS"
```

- [ ] **Step 89.** If found, ensure content is sanitized with DOMPurify before rendering.
- [ ] **Step 90.** Verify user-generated text (lesson notes, announcements) renders as plain text, not HTML.

#### SQL Injection Prevention

- [ ] **Step 91.** All database access uses parameterized queries via `getDb()` adapter and Supabase client. No string concatenation builds SQL.

#### CSRF Protection

- [ ] **Step 92.** Next.js Server Actions include built-in CSRF protection. State-changing operations go through Server Actions. The `__session` cookie has `SameSite=lax` or `strict`.

#### Webhook Validation

- [ ] **Step 93.** Cardcom webhook (`src/app/api/cardcom-webhook/route.ts`):
  - HMAC verified with `timingSafeEqual`
  - `invoiceId` validated as UUID format before DB lookup
  - Only `application/json` and `application/x-www-form-urlencoded` accepted
  - Returns HTTP 500 when `CARDCOM_WEBHOOK_SECRET` not configured

---

### Demo Gate Security

#### Staging Protection

- [ ] **Step 94.** Choose one method:

**Option A: Vercel Password Protection (recommended)**
1. Vercel Dashboard > Project > Settings > Password Protection
2. Enable for staging deployment

**Option B: Custom Demo Gate**
1. Set `DEMO_TOKENS` env var with comma-separated tokens
2. `/demo-gate` page validates token before granting access

- [ ] **Step 95.** Verify unauthenticated users cannot access `/dashboard` on staging.

#### Demo Data Safety

- [ ] **Step 96.** Verify `seed.sql` contains NO real PII:
  - No real Israeli ID numbers (use `000000000` format)
  - No real emails (use `@harmonia.local`)
  - No real phone numbers (use `050-000-XXXX`)
  - No real names of actual people
- [ ] **Step 97.** `.env.local` is in `.gitignore` with no production credentials.
- [ ] **Step 98.** `/api/bootstrap` disabled when `NODE_ENV=production`.

#### Preview Deployments

- [ ] **Step 99.** Use separate Firebase project (DEV) for PR previews. Never use production credentials.

---

### Security Checklist (Pre-Launch)

#### BLOCKERS -- Before Any Real User Data

- [ ] **SEC-BLK-01** Supabase/Firestore Security Rules deployed in production. Cross-tenant tests pass.
- [ ] **SEC-BLK-02** Firebase Storage Security Rules deployed. Signed URLs for all downloads.
- [ ] **SEC-BLK-03** DSAR Export produces actual downloadable file (not just a toast).
- [ ] **SEC-BLK-04** DSAR Deletion writes trackable `DELETION_REQUEST` ComplianceLog entry.
- [ ] **SEC-BLK-05** `saveConsentRecord` rejects mismatched `userId` (unless valid parental flow).
- [ ] **SEC-BLK-06** `__session` cookie is `HttpOnly` and `Secure` in production.
- [ ] **SEC-BLK-07** Dev bypass cannot activate in production (`NODE_ENV=production` + no creds = no access).
- [ ] **SEC-BLK-08** All `z.any()` replaced with proper validators (done as of sprint 3).
- [ ] **SEC-BLK-09** No server secrets in client bundles.
- [ ] **SEC-BLK-10** Israeli IDs in seed/demo data are fictional.

#### HIGH -- Before Public Beta

- [ ] **SEC-HIGH-01** Cross-tenant isolation verified (cons-15 admin cannot see cons-66 data).
- [ ] **SEC-HIGH-02** XSS test passes for all user-generated content fields.
- [ ] **SEC-HIGH-03** Rate limiting uses distributed store (Upstash Redis), not in-memory.
- [ ] **SEC-HIGH-04** ComplianceLog written for ALL DSAR operations.
- [ ] **SEC-HIGH-05** `getConsentStatus` rejects cross-user queries (unless admin/parent).
- [ ] **SEC-HIGH-06** Firebase App Check enabled.
- [ ] **SEC-HIGH-07** All Server Action ownership checks in place.
- [ ] **SEC-HIGH-08** `recordConsentAction` validates `userId === claims.uid`.

#### MEDIUM -- Before General Availability

- [ ] **SEC-MED-01** `CARDCOM_WEBHOOK_SECRET` set in staging and production.
- [ ] **SEC-MED-02** `ipAddress` in ConsentRecord from server-side `x-forwarded-for`, not client.
- [ ] **SEC-MED-03** Consent version dynamically sourced (not hardcoded).
- [ ] **SEC-MED-04** Israeli Registrar of Databases registration submitted.
- [ ] **SEC-MED-05** Data Security Officer appointed; contact in privacy policy.
- [ ] **SEC-MED-06** Session cookie `SameSite` upgraded to `strict`.
- [ ] **SEC-MED-07** OAuth redirect URIs locked to production/staging domains only.
- [ ] **SEC-MED-08** `invoiceId` in webhook validated as UUID before DB lookup.

#### MONITORING -- Post-Launch

- [ ] **SEC-MON-01** Breach notification procedure documented (72-hour window, Israeli Privacy Authority contact).
- [ ] **SEC-MON-02** Independent penetration test within 90 days of launch.
- [ ] **SEC-MON-03** Data retention automation deployed (video auto-delete 1yr, financial archive 7yr).
- [ ] **SEC-MON-04** Security monitoring alerts for failed login spikes, cross-tenant attempts, unusual exports.
- [ ] **SEC-MON-05** Dependency vulnerability scanning (`npm audit` / Snyk) on every PR.
- [ ] **SEC-MON-06** All secrets in Google Secret Manager or Vercel encrypted env vars.

---

#### Security Findings Cross-Reference

This section addresses all findings from `docs/plans/qa/12-security-review.md`:

| Finding | Severity | Addressed In |
|---------|----------|-------------|
| FINDING-AUTH-01 (SameSite=lax) | MEDIUM | Session Cookie Attributes, SEC-MED-06 |
| FINDING-AUTH-02 (Lightweight JWT decode) | LOW | JWT Session Flow |
| FINDING-AUTH-03 (Dev bypass) | LOW | Dev Bypass Safety, SEC-BLK-07 |
| FINDING-AUTH-04 (Session expiry sync) | LOW | JWT Session Flow Steps 59-60 |
| FINDING-AUTH-05 (No session inventory) | LOW | Post-launch |
| FINDING-AUTHZ-01 (withAuth no role) | HIGH | Server Action Auth, SEC-HIGH-07 |
| FINDING-AUTHZ-02 (Consent forgery) | HIGH | Parent Access Rules, SEC-BLK-05 |
| FINDING-AUTHZ-03 (getConsentStatus leak) | MEDIUM | Parent Access Rules, SEC-HIGH-05 |
| FINDING-AUTHZ-04 (API routes no auth) | MEDIUM | API Route Auth Audit |
| FINDING-AUTHZ-05 (Tenant isolation untested) | MEDIUM | Admin Access Rules, SEC-HIGH-01 |
| FINDING-AUTHZ-06 (recordConsent all-roles) | LOW | Server Action Auth (documented) |
| FINDING-INPUT-01 (invoiceId unvalidated) | MEDIUM | Webhook Validation, SEC-MED-08 |
| FINDING-INPUT-02 (IP trusted from client) | LOW | Consent Records, SEC-MED-02 |
| FINDING-INPUT-03 (No HTML sanitization) | MEDIUM | XSS Prevention, SEC-HIGH-02 |
| FINDING-INPUT-04 (OTP injection) | LOW | Zod Schemas |
| FINDING-DATA-01 (Empty ipAddress) | MEDIUM | SEC-MED-02 |
| FINDING-DATA-02 (Hardcoded consent version) | MEDIUM | SEC-MED-03 |
| FINDING-DATA-03 (DSAR export UI-only) | HIGH | DSAR Compliance, SEC-BLK-03 |
| FINDING-DATA-04 (DSAR deletion UI-only) | HIGH | DSAR Compliance, SEC-BLK-04 |
| FINDING-DATA-05 (Firestore direct call) | LOW | Audit Logging (documented) |
| FINDING-DATA-06 (Signature no size cap) | LOW | Zod Schemas |
| FINDING-API-01 (HMAC proxy vs route) | LOW | Webhook Validation (documented) |
| FINDING-API-02 (In-memory rate limiter) | MEDIUM | Rate Limiting, SEC-HIGH-03 |
| FINDING-API-03 (Webhook GET handler) | LOW | Webhook Validation |
| FINDING-API-04 (No Content-Type check) | LOW | Webhook Validation |
| FINDING-API-05 (Login error leak) | LOW | JWT Session Flow |
| FINDING-INFRA-01 (Firestore Rules) | CRITICAL | SEC-BLK-01 |
| FINDING-INFRA-02 (Storage Rules) | CRITICAL | SEC-BLK-02 |
| FINDING-INFRA-03 (App Check) | MEDIUM | SEC-HIGH-06 |
| FINDING-INFRA-04 (Supabase key exposure) | MEDIUM | No Secrets in Client Bundles |
| FINDING-INFRA-05 (OAuth redirects) | MEDIUM | OAuth Redirect URI Lockdown, SEC-MED-07 |
| FINDING-INFRA-06 (ComplianceLog unwired) | HIGH | Audit Logging, SEC-HIGH-04 |
