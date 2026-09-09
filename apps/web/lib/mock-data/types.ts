export type VerificationGroup = 'V1' | 'V4' | 'V5'

export type CaseStatus =
  | 'pending_student'
  | 'in_review'
  | 'awaiting_correction'
  | 'approved'
  | 'escalated'
  | 'rejected'

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'

export type TaskType =
  | 'verify_family_size'
  | 'verify_identity'
  | 'upload_tax_return'
  | 'upload_w2'
  | 'verify_untaxed_income'
  | 'verify_high_school_completion'
  | 'identity_video_call'
  | 'identity_third_party'

export type StaffRole = 'counselor' | 'reviewer' | 'director'

export type IdentityMethod =
  | 'in_person'
  | 'video_call'
  | 'third_party'
  | 'incarcerated'

export type AwardKind = 'pell' | 'tops' | 'go_grant'

export type AwardStatus = 'estimated' | 'awarded' | 'disbursed'

export type EnrollmentStatus = 'enrolled' | 'admitted' | 'inactive'

export type PreferredLanguage = 'en' | 'es' | 'vi'

export type AuditActorRole = StaffRole | 'student' | 'system'

export interface MockAward {
  kind: AwardKind
  amount: number
  status: AwardStatus
}

export interface MockStudent {
  id: string
  bannerId: string
  firstName: string
  lastName: string
  preferredName?: string
  ssnLast4: string
  ssnMasked: string
  dob: string
  email: string
  phoneMasked: string
  enrollmentStatus: EnrollmentStatus
  program: string
  preferredLanguage: PreferredLanguage
  faDdxPopulated: boolean
  awards: MockAward[]
}

export interface MockTask {
  id: string
  caseId: string
  type: TaskType
  status: TaskStatus
  required: boolean
  requestedAt: string
  dueAt: string
  completedAt?: string
  notes?: string
}

export interface MockStaff {
  id: string
  name: string
  role: StaffRole
  initials: string
}

export interface MockCase {
  id: string
  studentId: string
  group: VerificationGroup
  status: CaseStatus
  assignedTo?: string
  createdAt: string
  deadline: string
  lastActionAt: string
  identityMethod?: IdentityMethod
  taxYear: number
  awardYear: string
}

export interface MockAuditEvent {
  id: string
  caseId: string
  actorName: string
  actorRole: AuditActorRole
  action: string
  timestamp: string
  details?: string
}
