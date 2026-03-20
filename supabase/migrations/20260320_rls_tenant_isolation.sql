-- Tenant isolation RLS policies for all Lyriosa tables
-- These policies ensure no row is readable/writable by a JWT belonging to a different conservatorium
-- JWT claim key: 'conservatorium_id' (full word, snake_case, as set by proxy.ts)
-- IMPORTANT: Verify the JWT claim key with: SELECT auth.jwt() in Supabase SQL editor before deploying
-- The Supabase adapter is currently read-only; these policies are forward-looking protection.

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent)
DROP POLICY IF EXISTS tenant_isolation ON users;
DROP POLICY IF EXISTS tenant_isolation ON teachers;
DROP POLICY IF EXISTS tenant_isolation ON students;
DROP POLICY IF EXISTS tenant_isolation ON lessons;
DROP POLICY IF EXISTS tenant_isolation ON packages;
DROP POLICY IF EXISTS tenant_isolation ON invoices;
DROP POLICY IF EXISTS tenant_isolation ON scholarship_applications;
DROP POLICY IF EXISTS tenant_isolation ON compliance_logs;
DROP POLICY IF EXISTS tenant_insert ON compliance_logs;

-- Apply tenant isolation: each row is visible/editable only to its own conservatorium
-- site_admin bypasses the check (can see all data)
CREATE POLICY tenant_isolation ON users
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON teachers
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON students
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON lessons
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON packages
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON invoices
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

CREATE POLICY tenant_isolation ON scholarship_applications
  FOR ALL USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );

-- compliance_logs: site_admin and dso can read all; tenant admins see own only
CREATE POLICY tenant_isolation ON compliance_logs
  FOR SELECT USING (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') IN ('site_admin', 'dso')
  );

CREATE POLICY tenant_insert ON compliance_logs
  FOR INSERT WITH CHECK (
    conservatorium_id = (auth.jwt() ->> 'conservatorium_id')
    OR (auth.jwt() ->> 'role') = 'site_admin'
  );
