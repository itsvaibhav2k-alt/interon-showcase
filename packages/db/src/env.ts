import { z } from 'zod';

export const DbEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type DbEnv = z.infer<typeof DbEnvSchema>;

export function parseDbEnv(env: NodeJS.ProcessEnv = process.env): DbEnv {
  return DbEnvSchema.parse(env);
}
