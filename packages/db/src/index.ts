import { RoleSchema, type Role } from '@interon/types';
import { sql, type ExtractTablesWithRelations } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase, type PostgresJsTransaction } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Schema = typeof schema;
export type Db = PostgresJsDatabase<Schema>;
export type Transaction = PostgresJsTransaction<Schema, ExtractTablesWithRelations<Schema>>;

export { and, desc, eq, sql } from 'drizzle-orm';

export type RlsContext = {
  actorId: string;
  role: Role;
};

export type CreateDbOptions = {
  max?: number;
};

export function createDb(url: string, options: CreateDbOptions = {}): Db {
  const client = postgres(url, { max: options.max ?? 10 });
  return drizzle(client, { schema });
}

export async function setRls(tx: Transaction, ctx: RlsContext): Promise<void> {
  RoleSchema.parse(ctx.role);
  await tx.execute(sql`select set_config('app.current_user_id', ${ctx.actorId}, true)`);
  await tx.execute(sql`select set_config('app.current_user_role', ${ctx.role}, true)`);
}

export { schema };
export * from './env';
