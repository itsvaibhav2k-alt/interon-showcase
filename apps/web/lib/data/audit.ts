'use server';

import { createDb, desc, eq, setRls } from '@interon/db';
import { auditEvents, staff, students } from '@interon/db/schema';

import { requireSession } from '@/lib/auth/session';

import type { DtoAuditEvent } from './types';

function dbConn() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

export async function getAuditEventsForCaseAction(
  caseId: string,
): Promise<DtoAuditEvent[]> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    const events = await tx
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.caseId, caseId))
      .orderBy(desc(auditEvents.createdAt));
    const results: DtoAuditEvent[] = [];
    for (const ev of events) {
      let actorName = 'System';
      if (ev.actorRole === 'system') {
        actorName = 'System';
      } else if (ev.actorStaffId) {
        const sr = await tx.select().from(staff).where(eq(staff.id, ev.actorStaffId));
        actorName = sr[0]?.name ?? 'Unknown staff';
      } else if (ev.actorStudentId) {
        const sr = await tx
          .select()
          .from(students)
          .where(eq(students.id, ev.actorStudentId));
        actorName = sr[0] ? `${sr[0].firstName} ${sr[0].lastName}` : 'Unknown student';
      }
      results.push({ ...ev, actorName });
    }
    return results;
  });
}
