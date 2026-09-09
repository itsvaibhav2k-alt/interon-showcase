'use client';

import type { Session } from '@interon/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslation } from 'react-i18next';

import { signInAsAction, signOutAction } from '@/lib/auth/actions';
import { DEMO_USERS, type DemoUserKey } from '@/lib/auth/users';
import { Button, Separator, cn } from '@/ui';

type NavItem = { key: string; labelKey: string; href: string; match: (path: string) => boolean };

const STUDENT_NAV: ReadonlyArray<NavItem> = [
  {
    key: 'dashboard',
    labelKey: 'nav.section.dashboard',
    href: '/student',
    match: (path) => path === '/student' || path.startsWith('/student/'),
  },
];

const STAFF_NAV: ReadonlyArray<NavItem> = [
  {
    key: 'cases',
    labelKey: 'nav.section.cases',
    href: '/admin',
    match: (path) => path === '/admin' || path.startsWith('/admin/'),
  },
];

const PRESETS: ReadonlyArray<{ key: DemoUserKey; labelKey: string; href: string }> = [
  { key: 'student', labelKey: 'nav.role.student', href: '/student' },
  { key: 'counselor', labelKey: 'nav.role.staff', href: '/admin' },
  { key: 'director', labelKey: 'nav.role.admin', href: '/admin' },
];

export function TopBar({ initialSession }: { initialSession: Session | null }) {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const role = initialSession?.role ?? null;
  const isStaff = role !== null && role !== 'student';
  const navItems = role === 'student' ? STUDENT_NAV : isStaff ? STAFF_NAV : [];

  const switchTo = (presetKey: DemoUserKey, href: string) => {
    startTransition(async () => {
      const user = DEMO_USERS[presetKey];
      const fd = new FormData();
      fd.set('userId', user.userId);
      fd.set('role', user.role);
      fd.set('displayName', user.displayName);
      await signInAsAction(fd);
      if (pathname !== href && !pathname.startsWith(href + '/')) {
        router.push(href);
      } else {
        router.refresh();
      }
    });
  };

  const signOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  // Which preset is currently active (so we can highlight the matching button)
  const activePreset: DemoUserKey | null =
    role === 'student'
      ? 'student'
      : role === 'counselor' || role === 'reviewer'
        ? 'counselor'
        : role === 'director'
          ? 'director'
          : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-6 border-b border-border bg-background px-6">
      <Link href="/" className="font-semibold tracking-tight">
        {t('common.appName')}
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {initialSession ? (
          <>
            <div className="flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 px-2 py-1">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.devRole')}
              </span>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  variant={activePreset === preset.key ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={isPending}
                  onClick={() => switchTo(preset.key, preset.href)}
                >
                  {t(preset.labelKey)}
                </Button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">{initialSession.displayName}</span>
            <Button variant="ghost" size="sm" disabled={isPending} onClick={signOut}>
              {t('nav.signOut')}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => switchTo('student', '/student')}
          >
            {t('nav.signIn')}
          </Button>
        )}
      </div>
    </header>
  );
}
