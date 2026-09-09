/**
 * Database seed script.
 *
 * Ports the hand-curated mock data in `apps/web/lib/mock-data/` into the
 * `interon_dev` Postgres instance. Connects as the `postgres` superuser so
 * RLS policies are bypassed (BYPASSRLS); does NOT call `setRls`.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/interon_dev \
 *     pnpm db:seed
 *
 * The cross-package import below is intentional for this scaffolding phase —
 * mock data lives in `apps/web` until the real ingest pipeline lands. The
 * import-order ESLint rule is suppressed for that line only.
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { v5 as uuidv5 } from 'uuid';

import {
  auditEvents,
  staff,
  studentAwards,
  students,
  verificationCases,
  verificationTasks,
} from './schema';
/* eslint-disable no-restricted-imports -- temporary cross-package read until real ingest exists */
import {
  auditEvents as mockAuditEvents,
  cases as mockCases,
  getCase,
  getStaff,
  getStudent,
  staff as mockStaff,
  students as mockStudents,
  tasks as mockTasks,
} from '../../../apps/web/lib/mock-data';
import type {
  MockAuditEvent,
  MockCase,
  MockStaff,
  MockStudent,
  MockTask,
  StaffRole,
} from '../../../apps/web/lib/mock-data/types';
/* eslint-enable no-restricted-imports */

const INTERON_UUID_NAMESPACE = '6f1e6a1f-9c4e-4a3e-8f5b-2d3f4a5b6c7d';

function stableUuid(mockId: string): string {
  return uuidv5(mockId, INTERON_UUID_NAMESPACE);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

/**
 * Resolve a staff-role audit actor (counselor/reviewer/director) to a staff
 * UUID. Tries an exact name match first, then falls back to any staff member
 * with the same role. Throws if nothing matches — the CHECK constraint
 * `audit_events_actor_presence` would fail anyway, so fail fast with context.
 */
function resolveStaffActor(event: MockAuditEvent, role: StaffRole): string {
  const byName = mockStaff.find((s) => s.name === event.actorName && s.role === role);
  if (byName) {
    return stableUuid(byName.id);
  }
  const byRole = mockStaff.find((s) => s.role === role);
  if (byRole) {
    return stableUuid(byRole.id);
  }
  throw new Error(
    `Cannot resolve staff actor for audit event ${event.id} ` +
      `(actorName="${event.actorName}", role="${role}")`,
  );
}

/**
 * Resolve a student audit actor by looking up the case the event belongs to,
 * then the student that owns the case. Throws if the case or student is
 * missing — should never happen for hand-curated mock data, but fail fast.
 */
function resolveStudentActor(event: MockAuditEvent): string {
  if (!event.caseId) {
    throw new Error(`Student audit event ${event.id} has no caseId to resolve student from`);
  }
  const mockCase = getCase(event.caseId);
  if (!mockCase) {
    throw new Error(`Audit event ${event.id} references missing case ${event.caseId}`);
  }
  const mockStudent = getStudent(mockCase.studentId);
  if (!mockStudent) {
    throw new Error(
      `Audit event ${event.id} resolves to missing student ${mockCase.studentId}`,
    );
  }
  return stableUuid(mockStudent.id);
}

function buildStudentRow(student: MockStudent): typeof students.$inferInsert {
  return {
    id: stableUuid(student.id),
    bannerId: student.bannerId,
    firstName: student.firstName,
    lastName: student.lastName,
    preferredName: student.preferredName ?? null,
    // Real KMS envelope encryption is out of scope for the scaffold seed.
    ssnEncrypted: `placeholder-ssn-encrypted-${student.ssnLast4}`,
    ssnLast4: student.ssnLast4,
    dob: student.dob,
    email: student.email,
    // The unmasked phone is not present in mock data; the mask is fine for the seed.
    phone: student.phoneMasked,
    enrollmentStatus: student.enrollmentStatus,
    program: student.program,
    preferredLanguage: student.preferredLanguage,
    faDdxPopulated: student.faDdxPopulated,
  };
}

function buildStaffRow(member: MockStaff): typeof staff.$inferInsert {
  return {
    id: stableUuid(member.id),
    name: member.name,
    initials: member.initials,
    role: member.role,
    // Mock staff don't carry emails; leave null so the unique constraint
    // remains usable for real data.
    email: null,
  };
}

function buildAwardRows(student: MockStudent): (typeof studentAwards.$inferInsert)[] {
  return student.awards.map((award) => ({
    id: stableUuid(`${student.id}:award:${award.kind}`),
    studentId: stableUuid(student.id),
    kind: award.kind,
    // Mock amounts are whole dollars — convert to cents.
    amountCents: Math.round(award.amount * 100),
    status: award.status,
  }));
}

function buildCaseRow(mockCase: MockCase): typeof verificationCases.$inferInsert {
  return {
    id: stableUuid(mockCase.id),
    caseNumber: mockCase.id,
    studentId: stableUuid(mockCase.studentId),
    group: mockCase.group,
    status: mockCase.status,
    assignedTo: mockCase.assignedTo ? stableUuid(mockCase.assignedTo) : null,
    taxYear: mockCase.taxYear,
    awardYear: mockCase.awardYear,
    identityMethod: mockCase.identityMethod ?? null,
    deadline: mockCase.deadline.slice(0, 10),
    lastActionAt: new Date(mockCase.lastActionAt),
    createdAt: new Date(mockCase.createdAt),
    updatedAt: new Date(mockCase.lastActionAt),
  };
}

function buildTaskRow(task: MockTask): typeof verificationTasks.$inferInsert {
  return {
    id: stableUuid(task.id),
    caseId: stableUuid(task.caseId),
    type: task.type,
    status: task.status,
    required: task.required,
    requestedAt: new Date(task.requestedAt),
    dueAt: new Date(task.dueAt),
    completedAt: task.completedAt ? new Date(task.completedAt) : null,
    notes: task.notes ?? null,
  };
}

function buildAuditRow(event: MockAuditEvent): typeof auditEvents.$inferInsert {
  const caseUuid = stableUuid(event.caseId);
  let actorStudentId: string | null = null;
  let actorStaffId: string | null = null;

  switch (event.actorRole) {
    case 'student':
      actorStudentId = resolveStudentActor(event);
      break;
    case 'counselor':
    case 'reviewer':
    case 'director':
      actorStaffId = resolveStaffActor(event, event.actorRole);
      break;
    case 'system':
      // Both actor IDs stay null; CHECK allows that for system events.
      break;
  }

  return {
    id: stableUuid(event.id),
    caseId: caseUuid,
    actorStudentId,
    actorStaffId,
    actorRole: event.actorRole,
    action: event.action,
    entityType: 'verification_case',
    entityId: caseUuid,
    before: null,
    after: null,
    details: event.details ?? null,
    createdAt: new Date(event.timestamp),
  };
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    // Validate audit actor mappings up front so we don't truncate then crash mid-insert.
    for (const event of mockAuditEvents) {
      if (event.actorRole === 'counselor' || event.actorRole === 'reviewer' || event.actorRole === 'director') {
        resolveStaffActor(event, event.actorRole);
      } else if (event.actorRole === 'student') {
        resolveStudentActor(event);
      }
    }

    // Spot-check that every case-assigned-to references a known staff member.
    for (const mockCase of mockCases) {
      if (mockCase.assignedTo && !getStaff(mockCase.assignedTo)) {
        throw new Error(
          `Case ${mockCase.id} assigned to unknown staff ${mockCase.assignedTo}`,
        );
      }
    }

    await db.transaction(async (tx) => {
      // Truncate in dependency order; CASCADE handles the FKs but being explicit
      // also resets identity sequences (none here, but harmless).
      await tx.execute(
        sql`TRUNCATE TABLE audit_events, verification_tasks, verification_cases, student_awards, staff, students RESTART IDENTITY CASCADE`,
      );

      const studentRows = mockStudents.map(buildStudentRow);
      await tx.insert(students).values(studentRows);

      const staffRows = mockStaff.map(buildStaffRow);
      await tx.insert(staff).values(staffRows);

      const awardRows = mockStudents.flatMap(buildAwardRows);
      if (awardRows.length > 0) {
        await tx.insert(studentAwards).values(awardRows);
      }

      const caseRows = mockCases.map(buildCaseRow);
      await tx.insert(verificationCases).values(caseRows);

      const taskRows = mockTasks.map(buildTaskRow);
      await tx.insert(verificationTasks).values(taskRows);

      const auditRows = mockAuditEvents.map(buildAuditRow);
      await tx.insert(auditEvents).values(auditRows);
    });

    const counts = await Promise.all([
      db.execute(sql`SELECT count(*)::int AS count FROM students`),
      db.execute(sql`SELECT count(*)::int AS count FROM staff`),
      db.execute(sql`SELECT count(*)::int AS count FROM student_awards`),
      db.execute(sql`SELECT count(*)::int AS count FROM verification_cases`),
      db.execute(sql`SELECT count(*)::int AS count FROM verification_tasks`),
      db.execute(sql`SELECT count(*)::int AS count FROM audit_events`),
    ]);

    const [
      studentsCount,
      staffCount,
      awardsCount,
      casesCount,
      tasksCount,
      auditCount,
    ] = counts.map((r) => (r[0] as { count: number } | undefined)?.count ?? 0);

    process.stdout.write(
      [
        'seed: completed',
        `  students:           ${studentsCount}`,
        `  staff:              ${staffCount}`,
        `  student_awards:     ${awardsCount}`,
        `  verification_cases: ${casesCount}`,
        `  verification_tasks: ${tasksCount}`,
        `  audit_events:       ${auditCount}`,
        '',
      ].join('\n'),
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`seed: failed — ${message}\n`);
  if (error instanceof Error && error.stack) {
    process.stderr.write(`${error.stack}\n`);
  }
  process.exit(1);
});
