import type { Session } from '@interon/types';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';


const COOKIE_NAME = 'interon-session';

function getPassword(): string {
  const pw = process.env.AUTH_SESSION_SECRET;
  if (!pw || pw.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must be set and at least 32 characters');
  }
  return pw;
}

export async function getSession(): Promise<Session | null> {
  const session = await getIronSession<Partial<Session>>(cookies(), {
    password: getPassword(),
    cookieName: COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  });
  if (!session.userId || !session.role || !session.displayName) return null;
  return {
    userId: session.userId,
    role: session.role,
    displayName: session.displayName,
  };
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
