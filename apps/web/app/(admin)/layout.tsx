import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSession } from '@/lib/auth/session';

export default async function AdminGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role === 'student') {
    redirect('/');
  }
  return <>{children}</>;
}
