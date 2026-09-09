import type {
  AuditEvent,
  Staff,
  Student,
  StudentAward,
  VerificationCase,
  VerificationTask,
} from '@interon/db/schema';

export interface DtoStudent extends Student {
  awards: StudentAward[];
}

export interface DtoCase extends VerificationCase {
  student: DtoStudent;
  assignee: Staff | null;
}

export type DtoTask = VerificationTask;

export interface DtoAuditEvent extends AuditEvent {
  actorName: string;
}
