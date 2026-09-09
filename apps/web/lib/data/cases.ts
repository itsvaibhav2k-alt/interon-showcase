'use server';

import { createDb, eq, setRls, type Transaction } from '@interon/db';
import {
  staff,
  studentAwards,
  students,
  verificationCases,
  type Staff,
} from '@interon/db/schema';

import { requireSession } from '@/lib/auth/session';

import type { DtoCase, DtoStudent } from './types';

function dbConn() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return createDb(url);
}

async function loadStudent(
  tx: Transaction,
  studentId: string,
): Promise<DtoStudent | null> {
  const rows = await tx.select().from(students).where(eq(students.id, studentId));
  const s = rows[0];
  if (!s) return null;
  const awards = await tx
    .select()
    .from(studentAwards)
    .where(eq(studentAwards.studentId, studentId));
  return { ...s, awards };
}

async function loadAssignee(
  tx: Transaction,
  assignedTo: string | null,
): Promise<Staff | null> {
  if (!assignedTo) return null;
  const rows = await tx.select().from(staff).where(eq(staff.id, assignedTo));
  return rows[0] ?? null;
}

export async function getAllCasesAction(): Promise<DtoCase[]> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    const cases = await tx.select().from(verificationCases);
    const results: DtoCase[] = [];
    for (const c of cases) {
      const student = await loadStudent(tx, c.studentId);
      if (!student) continue;
      const assignee = await loadAssignee(tx, c.assignedTo);
      results.push({ ...c, student, assignee });
    }
    return results;
  });
}

export async function getCaseByNumberAction(
  caseNumber: string,
): Promise<DtoCase | null> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    const rows = await tx
      .select()
      .from(verificationCases)
      .where(eq(verificationCases.caseNumber, caseNumber));
    const c = rows[0];
    if (!c) return null;
    const student = await loadStudent(tx, c.studentId);
    if (!student) return null;
    const assignee = await loadAssignee(tx, c.assignedTo);
    return { ...c, student, assignee };
  });
}

export async function getCasesForStudentAction(
  studentId: string,
): Promise<DtoCase[]> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    const cases = await tx
      .select()
      .from(verificationCases)
      .where(eq(verificationCases.studentId, studentId));
    const student = await loadStudent(tx, studentId);
    if (!student) return [];
    const results: DtoCase[] = [];
    for (const c of cases) {
      const assignee = await loadAssignee(tx, c.assignedTo);
      results.push({ ...c, student, assignee });
    }
    return results;
  });
}

export async function getAllStaffAction(): Promise<Staff[]> {
  const session = await requireSession();
  const db = dbConn();
  return db.transaction(async (tx) => {
    await setRls(tx, { actorId: session.userId, role: session.role });
    return tx.select().from(staff);
  });
}
