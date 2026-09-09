'use client';

import type { StudentAward } from '@interon/db/schema';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { PageShell } from '@/components/page-shell';
import { TaskRow } from '@/components/student/task-row';
import { getCurrentSessionAction } from '@/lib/auth/actions';
import { getCasesForStudentAction } from '@/lib/data/cases';
import { getTasksForCaseAction } from '@/lib/data/tasks';
import type { DtoCase, DtoStudent, DtoTask } from '@/lib/data/types';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@/ui';

type CaseStatus = DtoCase['status'];
type TaskStatus = DtoTask['status'];

const ACTIVE_CASE_STATUSES: ReadonlySet<CaseStatus> = new Set<CaseStatus>([
  'pending_student',
  'in_review',
  'awaiting_correction',
]);

const OPEN_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  'not_started',
  'in_progress',
]);

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Chicago',
});

function collectOpenTasks(
  cases: DtoCase[],
  tasksByCase: Record<string, DtoTask[]>,
): DtoTask[] {
  const activeCases = cases.filter((c) => ACTIVE_CASE_STATUSES.has(c.status));
  const all = activeCases.flatMap((c) => tasksByCase[c.id] ?? []);
  return all
    .filter((task) => OPEN_TASK_STATUSES.has(task.status))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

function formatNextDeadline(tasks: DtoTask[]): string {
  if (tasks.length === 0) return '—';
  const next = tasks[0];
  if (!next) return '—';
  return shortDateFormatter.format(new Date(next.dueAt));
}

function formatStudentName(student: DtoStudent): string {
  const first = student.preferredName ?? student.firstName;
  return `${first} ${student.lastName}`;
}

interface AwardRowProps {
  award: StudentAward;
  showSeparator: boolean;
}

function AwardRow({ award, showSeparator }: AwardRowProps) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between gap-4 py-3">
        <div>
          <p className="text-sm font-semibold">{t(`student.awardKind.${award.kind}`)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(`student.awardStatus.${award.status}`)}
          </p>
        </div>
        <p className="text-base font-medium tabular-nums">
          {currencyFormatter.format(award.amountCents / 100)}
        </p>
      </div>
      {showSeparator ? <Separator /> : null}
    </div>
  );
}

export default function StudentHomePage() {
  const { t } = useTranslation();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: getCurrentSessionAction,
  });

  const studentId = session?.role === 'student' ? session.userId : undefined;

  const { data: cases } = useQuery({
    queryKey: ['student-cases', studentId],
    queryFn: () => getCasesForStudentAction(studentId as string),
    enabled: !!studentId,
  });

  const caseIds = useMemo(() => cases?.map((c) => c.id) ?? [], [cases]);

  const { data: tasksByCase } = useQuery({
    queryKey: ['student-tasks', caseIds],
    queryFn: async () => {
      const result: Record<string, DtoTask[]> = {};
      for (const c of cases ?? []) {
        result[c.id] = await getTasksForCaseAction(c.id);
      }
      return result;
    },
    enabled: !!cases && cases.length > 0,
  });

  const student = cases?.[0]?.student ?? null;

  const safeCases = cases ?? [];
  const safeTasksByCase = tasksByCase ?? {};

  const activeCasesCount = safeCases.filter((c) => ACTIVE_CASE_STATUSES.has(c.status)).length;
  const openTasks = collectOpenTasks(safeCases, safeTasksByCase);
  const tasksOpenCount = openTasks.length;
  const nextDeadline = formatNextDeadline(openTasks);

  const primaryAwardYear = safeCases[0]?.awardYear ?? '2025-26';

  if (!student) {
    return (
      <PageShell
        title={session?.displayName ?? ''}
        description={t('student.dashboard.subtitle')}
      >
        <div />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={formatStudentName(student)}
      description={t('student.dashboard.subtitle')}
      actions={
        <Button variant="outline" size="sm">
          {t('student.dashboard.uploadDocument')}
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('student.stats.activeCase')}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{activeCasesCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t('student.stats.activeCaseHint')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('student.stats.tasksOpen')}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{tasksOpenCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t('student.stats.tasksOpenHint')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('student.stats.nextDeadline')}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{nextDeadline}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {t('student.stats.deadlineHint')}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('student.tasks.title')}</CardTitle>
          <CardDescription>{t('student.tasks.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {openTasks.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">{t('student.tasks.empty')}</p>
          ) : (
            <div>
              {openTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('student.awards.title')}</CardTitle>
          <CardDescription>
            {t('student.awards.subtitle', { awardYear: primaryAwardYear })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.awards.map((award, index) => (
            <AwardRow
              key={award.kind}
              award={award}
              showSeparator={index < student.awards.length - 1}
            />
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
