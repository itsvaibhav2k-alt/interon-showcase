import { sql } from 'drizzle-orm';
import { boolean, check, date, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { enrollmentStatusEnum, preferredLanguageEnum } from './enums';

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bannerId: text('banner_id').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    preferredName: text('preferred_name'),
    ssnEncrypted: text('ssn_encrypted').notNull(),
    ssnLast4: varchar('ssn_last4', { length: 4 }).notNull(),
    dob: date('dob').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    enrollmentStatus: enrollmentStatusEnum('enrollment_status').notNull(),
    program: text('program').notNull(),
    preferredLanguage: preferredLanguageEnum('preferred_language').notNull().default('en'),
    faDdxPopulated: boolean('fa_ddx_populated').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ssnLast4Format: check('students_ssn_last4_format', sql`${table.ssnLast4} ~ '^[0-9]{4}$'`),
  }),
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
