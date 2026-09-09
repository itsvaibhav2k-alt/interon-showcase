'use server';

import { createDb, eq, setRls, type Transaction } from '@interon/db';
import { verificationCases, verificationTasks } from '@interon/db/schema';

import { logAudit } from '@/lib/audit/log-audit';
import { requireSession } from '@/lib/auth/session';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; errorKey: string };

function dbConn() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

export async function approveTaskAction(
  taskId: string,
): Promise<ActionResult<{ taskId: string }>> {
  const session = await requireSession();
  if (session.role === 'student') {
    return { ok: false, errorKey: 'cases.errors.forbidden' };
  }
  const db = dbConn();
  try {
    await db.transaction(async (tx: Transaction) => {
      await setRls(tx, { actorId: session.userId, role: session.role });
      const beforeRows = await tx
        .select()
        .from(verificationTasks)
        .where(eq(verificationTasks.id, taskId));
      const before = beforeRows[0];
      if (!before) throw new Error('not-found');
      const afterRows = await tx
        .update(verificationTasks)
        .set({ status: 'approved', completedAt: new Date() })
        .where(eq(verificationTasks.id, taskId))
        .returning();
      const after = afterRows[0]!;
      await logAudit(tx, {
        actor: session,
        action: 'Approved task',
        entityType: 'verification_task',
        entityId: taskId,
        caseId: before.caseId,
        before: before as unknown as Record<string, unknown>,
        after: after as unknown as Record<string, unknown>,
      });
    });
    return { ok: true, data: { taskId } };
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found') {
      return { ok: false, errorKey: 'cases.errors.notFound' };
    }
    return { ok: false, errorKey: 'cases.errors.unknown' };
  }
}

export async function rejectTaskAction(
  taskId: string,
  reason: string,
): Promise<ActionResult<{ taskId: string }>> {
  const session = await requireSession();
  if (session.role === 'student') {
    return { ok: false, errorKey: 'cases.errors.forbidden' };
  }
  const db = dbConn();
  try {
    await db.transaction(async (tx: Transaction) => {
      await setRls(tx, { actorId: session.userId, role: session.role });
      const beforeRows = await tx
        .select()
        .from(verificationTasks)
        .where(eq(verificationTasks.id, taskId));
      const before = beforeRows[0];
      if (!before) throw new Error('not-found');
      const afterRows = await tx
        .update(verificationTasks)
        .set({ status: 'rejected', notes: reason })
        .where(eq(verificationTasks.id, taskId))
        .returning();
      const after = afterRows[0]!;
      await logAudit(tx, {
        actor: session,
        action: 'Rejected task',
        entityType: 'verification_task',
        entityId: taskId,
        caseId: before.caseId,
        before: before as unknown as Record<string, unknown>,
        after: after as unknown as Record<string, unknown>,
        details: reason,
      });
    });
    return { ok: true, data: { taskId } };
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found') {
      return { ok: false, errorKey: 'cases.errors.notFound' };
    }
    return { ok: false, errorKey: 'cases.errors.unknown' };
  }
}

export async function reassignCaseAction(
  caseId: string,
  newAssigneeId: string,
): Promise<ActionResult<{ caseId: string }>> {
  const session = await requireSession();
  if (session.role === 'student') {
    return { ok: false, errorKey: 'cases.errors.forbidden' };
  }
  const db = dbConn();
  try {
    await db.transaction(async (tx: Transaction) => {
      await setRls(tx, { actorId: session.userId, role: session.role });
      const beforeRows = await tx
        .select()
        .from(verificationCases)
        .where(eq(verificationCases.id, caseId));
      const before = beforeRows[0];
      if (!before) throw new Error('not-found');
      const afterRows = await tx
        .update(verificationCases)
        .set({ assignedTo: newAssigneeId, lastActionAt: new Date() })
        .where(eq(verificationCases.id, caseId))
        .returning();
      const after = afterRows[0]!;
      await logAudit(tx, {
        actor: session,
        action: 'Reassigned case',
        entityType: 'verification_case',
        entityId: caseId,
        caseId,
        before: before as unknown as Record<string, unknown>,
        after: after as unknown as Record<string, unknown>,
      });
    });
    return { ok: true, data: { caseId } };
  } catch (err) {
    if (err instanceof Error && err.message === 'not-found') {
      return { ok: false, errorKey: 'cases.errors.notFound' };
    }
    return { ok: false, errorKey: 'cases.errors.unknown' };
  }
}
