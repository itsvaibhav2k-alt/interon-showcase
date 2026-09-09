'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui';

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">{t('common.appName')}</h1>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/student">{t('student.nav')}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin">{t('admin.nav')}</Link>
        </Button>
      </div>
    </main>
  );
}
