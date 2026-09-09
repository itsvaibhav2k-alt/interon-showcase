import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { taskStatusEnum, taskTypeEnum } from './enums';
import { verificationCases } from './verification_cases';

export const verificationTasks = pgTable(
  'verification_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => verificationCases.id, { onDelete: 'cascade' }),
    type: taskTypeEnum('type').notNull(),
    status: taskStatusEnum('status').notNull().default('not_started'),
    required: boolean('required').notNull().default(true),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    notes: text('notes'),
  },
  (table) => ({
    caseStatusIdx: index('verification_tasks_case_status_idx').on(table.caseId, table.status),
  }),
);

export type VerificationTask = typeof verificationTasks.$inferSelect;
export type NewVerificationTask = typeof verificationTasks.$inferInsert;
