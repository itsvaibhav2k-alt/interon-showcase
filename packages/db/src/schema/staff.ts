import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { staffRoleEnum } from './enums';

export const staff = pgTable('staff', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  initials: varchar('initials', { length: 4 }).notNull(),
  role: staffRoleEnum('role').notNull(),
  email: text('email').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
