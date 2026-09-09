import type { Transaction } from '@interon/db';
import { auditEvents } from '@interon/db/schema';
import type { Session } from '@interon/types';

export type AuditEntry = {
  actor: Session;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  details?: string;
  caseId?: string;
};

export async function logAudit(tx: Transaction, entry: AuditEntry): Promise<void> {
  const actorStudentId = entry.actor.role === 'student' ? entry.actor.userId : null;
  const actorStaffId =
    entry.actor.role !== 'student' && entry.actor.role !== 'system' ? entry.actor.userId : null;

  await tx.insert(auditEvents).values({
    caseId: entry.caseId ?? null,
    actorStudentId,
    actorStaffId,
    actorRole: entry.actor.role,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    details: entry.details ?? null,
  });
}
