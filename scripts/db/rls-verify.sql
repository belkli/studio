-- scripts/db/rls-verify.sql
--
-- Standalone Row Level Security verification script for Harmonia.
-- Run after schema.sql + seed.sql against any Postgres / Supabase instance.
--
-- EXPECTED OUTCOME
--   Every table in the Harmonia schema should have rowsecurity = true.
--   The "Tables WITHOUT RLS" query should return ZERO rows.
--   If it returns rows, those tables are unprotected and any authenticated
--   Postgres user can read or write any row — a critical tenant isolation
--   violation.
--
-- USAGE
--   psql "$DATABASE_URL" -f scripts/db/rls-verify.sql
--
-- EXIT CODE
--   This script always exits 0 (reports only — does not raise an error).
--   CI pipelines should pipe the output through grep to detect "MISSING RLS".
--   Example:
--     psql "$DATABASE_URL" -f scripts/db/rls-verify.sql | grep -c "MISSING RLS"
--     # Non-zero count = at least one table is unprotected.
--
-- NOTE ON EXEMPT TABLES
--   instrument_catalog and schema_migrations are intentionally excluded from
--   RLS because they contain public reference data / migration bookkeeping
--   that should be readable by all authenticated roles.

\echo ''
\echo '================================================================='
\echo ' Harmonia RLS Verification Report'
\echo '================================================================='
\echo ''

-- ── 1. RLS status for every Harmonia business table ─────────────────────────

\echo '--- [1] RLS enablement status per table ---'

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'OK — RLS enabled'
    ELSE '!!! MISSING RLS !!!'
  END AS rls_status
FROM pg_tables
WHERE
  schemaname = 'public'
  AND tablename IN (
    'conservatoriums',
    'users',
    'student_profiles',
    'teacher_profiles',
    'teacher_ratings',
    'teacher_assignments',
    'conservatorium_instruments',
    'branches',
    'rooms',
    'lessons',
    'lesson_packages',
    'events',
    'forms',
    'invoices',
    'instrument_rentals',
    'scholarship_applications',
    'announcements',
    'repertoire_library',
    'donation_causes',
    'donation_records',
    'payroll_snapshots',
    'alumni_profiles',
    'master_classes',
    'makeup_credits',
    'practice_logs',
    'notifications',
    'room_locks',
    'teacher_exceptions',
    'consent_records',
    'compliance_logs',
    'waitlist_entries',
    'achievements'
  )
ORDER BY tablename;

-- ── 2. Tables WITHOUT RLS (the actionable list — should be empty) ────────────

\echo ''
\echo '--- [2] Tables WITHOUT RLS (must be empty in production) ---'

SELECT tablename
FROM pg_tables
WHERE
  schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT IN (
    -- Exempt: public reference data, readable by all authenticated roles
    'instrument_catalog',
    'schema_migrations'
  )
ORDER BY tablename;

-- ── 3. Tables present in schema but missing from the expected list ───────────

\echo ''
\echo '--- [3] Business tables not in the expected list (may need RLS) ---'

SELECT tablename
FROM pg_tables
WHERE
  schemaname = 'public'
  AND tablename NOT IN (
    'conservatoriums', 'users', 'student_profiles', 'teacher_profiles',
    'teacher_ratings', 'teacher_assignments', 'conservatorium_instruments',
    'branches', 'rooms', 'lessons', 'lesson_packages', 'events', 'forms',
    'invoices', 'instrument_rentals', 'scholarship_applications',
    'announcements', 'repertoire_library', 'donation_causes',
    'donation_records', 'payroll_snapshots', 'alumni_profiles',
    'master_classes', 'makeup_credits', 'practice_logs', 'notifications',
    'room_locks', 'teacher_exceptions', 'consent_records', 'compliance_logs',
    'waitlist_entries', 'achievements',
    -- Exempt tables
    'instrument_catalog', 'schema_migrations'
  )
ORDER BY tablename;

-- ── 4. Helper functions existence check ─────────────────────────────────────

\echo ''
\echo '--- [4] Required RLS helper functions ---'

SELECT
  proname AS function_name,
  CASE WHEN prosrc IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM pg_proc
WHERE
  proname IN (
    'harmonia_role',
    'harmonia_conservatorium_id',
    'is_site_admin',
    'is_conservatorium_admin'
  )
ORDER BY proname;

-- Also flag any expected helper that does NOT exist yet
\echo ''
\echo '--- [4b] Expected helpers that are MISSING (should be empty) ---'

SELECT expected.fn AS missing_function
FROM (
  VALUES
    ('harmonia_role'),
    ('harmonia_conservatorium_id'),
    ('is_site_admin'),
    ('is_conservatorium_admin')
) AS expected(fn)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = expected.fn
)
ORDER BY missing_function;

-- ── 5. RLS policy count per table ────────────────────────────────────────────

\echo ''
\echo '--- [5] RLS policy count per table (0 = table has RLS but no policies) ---'

SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ── 6. Tables with RLS enabled but ZERO policies (effective lockout) ─────────
-- A table with RLS enabled but no policies denies ALL access by default.
-- This is a common misconfiguration that prevents any data access.

\echo ''
\echo '--- [6] Tables with RLS but zero policies (effective lockout — verify intent) ---'

SELECT t.tablename
FROM pg_tables t
WHERE
  t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- ── 7. Policy detail listing ─────────────────────────────────────────────────

\echo ''
\echo '--- [7] All RLS policies (full detail) ---'

SELECT
  tablename,
  policyname,
  cmd       AS command,
  roles,
  qual      AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── 8. Cross-tenant leakage test (data-level check) ─────────────────────────
-- If RLS is correctly configured and the invoker is NOT a site_admin,
-- selecting from `users` should only return rows for the invoker's own
-- conservatorium.  We cannot run this automatically without a test role,
-- but we document the manual check here.

\echo ''
\echo '--- [8] Manual cross-tenant check (run as a conservatorium_admin role) ---'
\echo '  SET LOCAL ROLE conservatorium_admin_test_role;'
\echo '  SELECT conservatorium_id, COUNT(*) FROM users GROUP BY 1;'
\echo '  -- Should return exactly ONE conservatorium_id row.'
\echo ''

-- ── Summary ──────────────────────────────────────────────────────────────────

\echo '================================================================='
\echo ' Summary: check section [2] — it must be empty in production.'
\echo ' Any table listed there is UNPROTECTED (no RLS = full table scan).'
\echo ' Run: psql "$DATABASE_URL" -f scripts/db/rls-verify.sql | grep "MISSING RLS"'
\echo '================================================================='
\echo ''
