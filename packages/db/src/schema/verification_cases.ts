import { date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { caseStatusEnum, identityMethodEnum, verificationGroupEnum } from './enums';
import { staff } from './staff';
import { students } from './students';

export const verificationCases = pgTable(
  'verification_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseNumber: text('case_number').notNull().unique(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    group: verificationGroupEnum('group').notNull(),
    status: caseStatusEnum('status').notNull().default('pending_student'),
    assignedTo: uuid('assigned_to').references(() => staff.id, { onDelete: 'set null' }),
    taxYear: integer('tax_year').notNull(),
    awardYear: text('award_year').notNull(),
    identityMethod: identityMethodEnum('identity_method'),
    deadline: date('deadline').notNull(),
    lastActionAt: timestamp('last_action_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentAwardYearIdx: index('verification_cases_student_award_year_idx').on(
      table.studentId,
      table.awardYear,
    ),
  }),
);

export type VerificationCase = typeof verificationCases.$inferSelect;
export type NewVerificationCase = typeof verificationCases.$inferInsert;
