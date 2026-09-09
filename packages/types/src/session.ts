import { z } from 'zod';

export const RoleSchema = z.enum(['student', 'counselor', 'reviewer', 'director', 'system']);
export type Role = z.infer<typeof RoleSchema>;

export const StaffRoleSchema = z.enum(['counselor', 'reviewer', 'director']);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const SessionSchema = z.object({
  userId: z.string().uuid(),
  role: RoleSchema,
  displayName: z.string().min(1),
});
export type Session = z.infer<typeof SessionSchema>;
