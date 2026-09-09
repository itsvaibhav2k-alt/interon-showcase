import type { Session } from '@interon/types';
import { v5 as uuidv5 } from 'uuid';


import { getAllStaff, getDemoStudent } from '../mock-data';

// Namespace UUID for stable v5 generation across runs. Do not change.
export const INTERON_UUID_NAMESPACE = '6f1e6a1f-9c4e-4a3e-8f5b-2d3f4a5b6c7d';

export function stableUuid(mockId: string): string {
  return uuidv5(mockId, INTERON_UUID_NAMESPACE);
}

const student = getDemoStudent();
const allStaff = getAllStaff();
const counselor = allStaff.find((s) => s.role === 'counselor');
const director = allStaff.find((s) => s.role === 'director');

if (!counselor || !director) {
  throw new Error('Mock data missing required counselor and director roles');
}

export const DEMO_USERS = {
  student: {
    userId: stableUuid(student.id),
    role: 'student',
    displayName: `${student.firstName} ${student.lastName}`,
  },
  counselor: {
    userId: stableUuid(counselor.id),
    role: 'counselor',
    displayName: counselor.name,
  },
  director: {
    userId: stableUuid(director.id),
    role: 'director',
    displayName: director.name,
  },
} as const satisfies Record<string, Session>;

export type DemoUserKey = keyof typeof DEMO_USERS;
