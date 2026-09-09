import { auditEvents } from './audit'
import { cases } from './cases'
import { staff } from './staff'
import { students } from './students'
import { tasks } from './tasks'
import type {
  MockAuditEvent,
  MockCase,
  MockStaff,
  MockStudent,
  MockTask,
} from './types'

export * from './types'
export { students } from './students'
export { staff } from './staff'
export { cases } from './cases'
export { tasks } from './tasks'
export { auditEvents } from './audit'

export function getStudent(id: string): MockStudent | undefined {
  return students.find((s) => s.id === id)
}

export function getCase(id: string): MockCase | undefined {
  return cases.find((c) => c.id === id)
}

export function getStaff(id: string): MockStaff | undefined {
  return staff.find((m) => m.id === id)
}

export function getCasesForStudent(studentId: string): MockCase[] {
  return cases.filter((c) => c.studentId === studentId)
}

export function getTasksForCase(caseId: string): MockTask[] {
  return tasks.filter((t) => t.caseId === caseId)
}

export function getAuditEventsForCase(caseId: string): MockAuditEvent[] {
  return auditEvents.filter((a) => a.caseId === caseId)
}

export function getAllCases(): MockCase[] {
  return cases
}

export function getAllStudents(): MockStudent[] {
  return students
}

export function getAllStaff(): MockStaff[] {
  return staff
}

/**
 * Returns the primary student for the demo `/student` route — the first
 * student that has at least one case in `pending_student` status, so the
 * demo surface always has something actionable.
 *
 * Falls back to the first student to keep the return type non-optional;
 * the dataset is hand-curated to guarantee a pending student exists.
 */
export function getDemoStudent(): MockStudent {
  const pendingCase = cases.find((c) => c.status === 'pending_student')
  if (pendingCase) {
    const student = students.find((s) => s.id === pendingCase.studentId)
    if (student) return student
  }
  const fallback = students[0]
  if (!fallback) {
    throw new Error('mock-data: no students defined')
  }
  return fallback
}

export function getDemoStudentCases(): MockCase[] {
  return getCasesForStudent(getDemoStudent().id)
}
