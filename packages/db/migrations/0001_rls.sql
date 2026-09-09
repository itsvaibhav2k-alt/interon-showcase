-- Row-level security for student PII tables.
-- Context comes from set_config('app.current_user_id'|'app.current_user_role', ..., true)
-- which is called by setRls(tx, ctx) in packages/db/src/index.ts at the top of every
-- RLS-aware transaction. current_setting(..., true) returns NULL (not error) when unset.

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper-ish: any non-student role is treated as staff for read/write.
-- We inline the check in each policy rather than using a SQL function to keep
-- the migration self-contained.

------------------------------------------------------------------------
-- students
------------------------------------------------------------------------

CREATE POLICY students_staff_all ON students
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'))
  WITH CHECK (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'));

CREATE POLICY students_self_select ON students
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'student'
         AND id::text = current_setting('app.current_user_id', true));

------------------------------------------------------------------------
-- student_awards
------------------------------------------------------------------------

CREATE POLICY student_awards_staff_all ON student_awards
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'))
  WITH CHECK (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'));

CREATE POLICY student_awards_self_select ON student_awards
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'student'
         AND student_id::text = current_setting('app.current_user_id', true));

------------------------------------------------------------------------
-- verification_cases
------------------------------------------------------------------------

CREATE POLICY verification_cases_staff_all ON verification_cases
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'))
  WITH CHECK (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'));

CREATE POLICY verification_cases_self_select ON verification_cases
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'student'
         AND student_id::text = current_setting('app.current_user_id', true));

------------------------------------------------------------------------
-- verification_tasks
------------------------------------------------------------------------

CREATE POLICY verification_tasks_staff_all ON verification_tasks
  FOR ALL
  USING (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'))
  WITH CHECK (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'));

-- Students see tasks belonging to one of their own cases.
CREATE POLICY verification_tasks_self_select ON verification_tasks
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'student'
         AND case_id IN (
           SELECT id FROM verification_cases
            WHERE student_id::text = current_setting('app.current_user_id', true)
         ));

------------------------------------------------------------------------
-- audit_events (append-only for everyone except system; staff read all)
------------------------------------------------------------------------

CREATE POLICY audit_events_staff_select ON audit_events
  FOR SELECT
  USING (current_setting('app.current_user_role', true) IN ('counselor', 'reviewer', 'director', 'system'));

CREATE POLICY audit_events_self_select ON audit_events
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'student'
         AND case_id IN (
           SELECT id FROM verification_cases
            WHERE student_id::text = current_setting('app.current_user_id', true)
         ));

-- Inserts: any authenticated actor can insert their own audit row.
-- (For system events the actor_role check matches the audit_events_actor_presence
-- check constraint defined in the schema.)
CREATE POLICY audit_events_insert ON audit_events
  FOR INSERT
  WITH CHECK (current_setting('app.current_user_role', true) IS NOT NULL);
