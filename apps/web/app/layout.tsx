import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { getSession } from '@/lib/auth/session';

import { Providers } from './providers';
import { TopBar } from '../components/top-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Interon',
  description: 'Financial aid verification platform',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <TopBar initialSession={session} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
