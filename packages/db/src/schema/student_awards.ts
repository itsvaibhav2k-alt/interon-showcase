import { integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { awardKindEnum, awardStatusEnum } from './enums';
import { students } from './students';

export const studentAwards = pgTable(
  'student_awards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    kind: awardKindEnum('kind').notNull(),
    amountCents: integer('amount_cents').notNull(),
    status: awardStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    studentKindUnique: unique('student_awards_student_kind_unique').on(table.studentId, table.kind),
  }),
);

export type StudentAward = typeof studentAwards.$inferSelect;
export type NewStudentAward = typeof studentAwards.$inferInsert;
