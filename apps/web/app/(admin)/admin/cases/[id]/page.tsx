'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AdminTaskRow } from '@/components/admin/task-row';
import { PageShell } from '@/components/page-shell';
import { getAuditEventsForCaseAction } from '@/lib/data/audit';
import { getCaseByNumberAction } from '@/lib/data/cases';
import { getTasksForCaseAction } from '@/lib/data/tasks';
import type { DtoCase } from '@/lib/data/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type BadgeProps,
  cn,
} from '@/ui';

interface CaseDetailPageProps {
  params: { id: string };
}

type CaseStatus = DtoCase['status'];

const STATUS_VARIANT: Record<CaseStatus, NonNullable<BadgeProps['variant']>> = {
  pending_student: 'outline',
  in_review: 'secondary',
  awaiting_correction: 'secondary',
  approved: 'default',
  escalated: 'destructive',
  rejected: 'destructive',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Chicago',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

function maskSsn(last4: string): string {
  return `***-**-${last4}`;
}

export default function AdminCaseDetailPage({ params }: CaseDetailPageProps) {
  const { t } = useTranslation();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', params.id],
    queryFn: () => getCaseByNumberAction(params.id),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['case-tasks', caseData?.id],
    queryFn: () => getTasksForCaseAction(caseData!.id),
    enabled: !!caseData,
  });

  const { data: audit = [] } = useQuery({
    queryKey: ['case-audit', caseData?.id],
    queryFn: () => getAuditEventsForCaseAction(caseData!.id),
    enabled: !!caseData,
  });

  if (isLoading) {
    return (
      <PageShell title={t('common.loading')} description="">
        <div />
      </PageShell>
    );
  }

  if (!caseData) {
    return (
      <PageShell
        title={t('admin.case.notFound.title')}
        description={t('admin.case.notFound.description')}
      >
        <div />
      </PageShell>
    );
  }

  const { student, assignee } = caseData;

  const statusBadgeClass =
    caseData.status === 'awaiting_correction' ? 'bg-amber-100 text-amber-900' : undefined;

  return (
    <PageShell
      title={`${t('admin.case.titlePrefix')} ${caseData.caseNumber}`}
      description={t('admin.case.subtitle', {
        group: caseData.group,
        awardYear: caseData.awardYear,
      })}
      actions={
        <>
          <Button variant="outline" size="sm">
            {t('admin.case.reassign')}
          </Button>
          <Button variant="outline" size="sm">
            {t('admin.case.escalate')}
          </Button>
          <Button size="sm">{t('admin.case.approve')}</Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {student.firstName} {student.lastName}
              </CardTitle>
              <CardDescription>
                {student.bannerId} • {student.program}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.ssn')}
                </div>
                <div className="tabular-nums">{maskSsn(student.ssnLast4)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.dob')}
                </div>
                <div className="tabular-nums">{formatDate(student.dob)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.email')}
                </div>
                <div className="truncate">{student.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.phone')}
                </div>
                <div className="tabular-nums">{student.phone}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.enrollment')}
                </div>
                <div>{t(`admin.enrollment.${student.enrollmentStatus}`)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.case.student.language')}
                </div>
                <div>{t(`admin.case.language.${student.preferredLanguage}`)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.case.tasks.title')}</CardTitle>
              <CardDescription>{t('admin.case.tasks.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {tasks.map((task) => (
                <AdminTaskRow key={task.id} task={task} caseNumber={caseData.caseNumber} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.case.summary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.status')}
                </span>
                <Badge
                  variant={STATUS_VARIANT[caseData.status]}
                  className={cn(statusBadgeClass)}
                >
                  {t(`admin.status.${caseData.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.group')}
                </span>
                <span className="font-medium">{caseData.group}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.faDdx')}
                </span>
                <span>
                  {student.faDdxPopulated
                    ? t('admin.case.summary.yes')
                    : t('admin.case.summary.no')}
                </span>
              </div>
              {caseData.identityMethod ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t('admin.case.summary.identity')}
                  </span>
                  <span className="text-right">
                    {t(`admin.case.identityMethod.${caseData.identityMethod}`)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.assignee')}
                </span>
                <span>{assignee ? assignee.name : t('admin.unassigned')}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.deadline')}
                </span>
                <span className="tabular-nums">{formatDate(caseData.deadline)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {t('admin.case.summary.taxYear')}
                </span>
                <span className="tabular-nums">{caseData.taxYear}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.case.awards.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {student.awards.map((award) => (
                <div
                  key={`${award.kind}-${award.status}`}
                  className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
                >
                  <div>
                    <div className="font-medium">
                      {t(`student.awardKind.${award.kind}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(`student.awardStatus.${award.status}`)}
                    </div>
                  </div>
                  <div className="tabular-nums font-medium">
                    {currencyFormatter.format(award.amountCents / 100)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.case.audit.title')}</CardTitle>
              <CardDescription>{t('admin.case.audit.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {audit.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <div className="flex-1">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.actorName} • {formatDateTime(event.createdAt)}
                      </div>
                      {event.details ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {event.details}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
