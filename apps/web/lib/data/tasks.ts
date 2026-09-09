'use server';

import { createDb, eq, setRls } from '@interon/db';
import { verificationTasks } from '@interon/db/schema';

import { requireSession } from '@/lib/auth/session';

import type { DtoTask } from './types';

function dbConn() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

export async function getTasksForCaseAction(caseId: string): Promise<DtoTask[]> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    return tx.select().from(verificationTasks).where(eq(verificationTasks.caseId, caseId));
  });
}
