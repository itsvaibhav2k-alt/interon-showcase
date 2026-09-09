import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { auditActorRoleEnum } from './enums';
import { staff } from './staff';
import { students } from './students';
import { verificationCases } from './verification_cases';

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id').references(() => verificationCases.id, { onDelete: 'cascade' }),
    actorStudentId: uuid('actor_student_id').references(() => students.id, {
      onDelete: 'set null',
    }),
    actorStaffId: uuid('actor_staff_id').references(() => staff.id, { onDelete: 'set null' }),
    actorRole: auditActorRoleEnum('actor_role').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorPresence: check(
      'audit_events_actor_presence',
      sql`(${table.actorRole} = 'system') OR (${table.actorStudentId} IS NOT NULL) OR (${table.actorStaffId} IS NOT NULL)`,
    ),
    caseCreatedAtIdx: index('audit_events_case_created_at_idx').on(
      table.caseId,
      table.createdAt.desc(),
    ),
  }),
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
