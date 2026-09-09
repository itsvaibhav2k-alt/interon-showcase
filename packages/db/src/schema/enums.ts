import { pgEnum } from 'drizzle-orm/pg-core';

export const verificationGroupEnum = pgEnum('verification_group', ['V1', 'V4', 'V5']);
export const caseStatusEnum = pgEnum('case_status', [
  'pending_student',
  'in_review',
  'awaiting_correction',
  'approved',
  'escalated',
  'rejected',
]);
export const taskStatusEnum = pgEnum('task_status', [
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
]);
export const taskTypeEnum = pgEnum('task_type', [
  'verify_family_size',
  'verify_identity',
  'upload_tax_return',
  'upload_w2',
  'verify_untaxed_income',
  'verify_high_school_completion',
  'identity_video_call',
  'identity_third_party',
]);
export const identityMethodEnum = pgEnum('identity_method', [
  'in_person',
  'video_call',
  'third_party',
  'incarcerated',
]);
export const staffRoleEnum = pgEnum('staff_role', ['counselor', 'reviewer', 'director']);
export const auditActorRoleEnum = pgEnum('audit_actor_role', [
  'student',
  'counselor',
  'reviewer',
  'director',
  'system',
]);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['enrolled', 'admitted', 'inactive']);
export const preferredLanguageEnum = pgEnum('preferred_language', ['en', 'es', 'vi']);
export const awardKindEnum = pgEnum('award_kind', ['pell', 'tops', 'go_grant']);
export const awardStatusEnum = pgEnum('award_status', ['estimated', 'awarded', 'disbursed']);
