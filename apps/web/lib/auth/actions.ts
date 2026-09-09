'use server';

import { SessionSchema, type Session } from '@interon/types';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


import { getSession, SESSION_COOKIE_NAME } from './session';

function getPassword(): string {
  const pw = process.env.AUTH_SESSION_SECRET;
  if (!pw || pw.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be set and at least 32 characters');
  }
  return pw;
}

export async function signInAsAction(formData: FormData): Promise<void> {
  const parsed = SessionSchema.parse({
    userId: formData.get('userId'),
    role: formData.get('role'),
    displayName: formData.get('displayName'),
  });
  const session = await getIronSession<Session>(cookies(), {
    password: getPassword(),
    cookieName: SESSION_COOKIE_NAME,
  });
  session.userId = parsed.userId;
  session.role = parsed.role;
  session.displayName = parsed.displayName;
  await session.save();
}

export async function getCurrentSessionAction(): Promise<Session | null> {
  return getSession();
}

export async function signOutAction(): Promise<void> {
  const session = await getIronSession<Session>(cookies(), {
    password: getPassword(),
    cookieName: SESSION_COOKIE_NAME,
  });
  session.destroy();
  redirect('/');
}
