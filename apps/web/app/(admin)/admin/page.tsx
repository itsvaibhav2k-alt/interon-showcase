'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageShell } from '@/components/page-shell';
import { getAllCasesAction, getAllStaffAction } from '@/lib/data/cases';
import type { DtoCase } from '@/lib/data/types';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeProps,
  cn,
} from '@/ui';

type CaseStatus = DtoCase['status'];
type VerificationGroup = DtoCase['group'];
type GroupFilter = VerificationGroup | 'all';
type StatusFilter = CaseStatus | 'all';
type AssigneeFilter = string | 'all' | 'unassigned';

interface Filters {
  group: GroupFilter;
  status: StatusFilter;
  assignee: AssigneeFilter;
}

const STATUS_VARIANT: Record<CaseStatus, NonNullable<BadgeProps['variant']>> = {
  pending_student: 'outline',
  in_review: 'secondary',
  awaiting_correction: 'secondary',
  approved: 'default',
  escalated: 'destructive',
  rejected: 'destructive',
};

const STATUS_VALUES: ReadonlyArray<CaseStatus> = [
  'pending_student',
  'in_review',
  'awaiting_correction',
  'approved',
  'escalated',
  'rejected',
];

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Chicago',
});

function formatShortDate(value: Date | string): string {
  return shortDateFormatter.format(new Date(value));
}

function maskSsn(last4: string): string {
  return `***-**-${last4}`;
}

interface FilterChipOption {
  value: string;
  label: string;
}

interface FilterChipProps {
  label: string;
  value: string;
  options: ReadonlyArray<FilterChipOption>;
  onChange: (next: string) => void;
}

function FilterChip({ label, value, options, onChange }: FilterChipProps) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="bg-transparent text-foreground outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface CaseRowProps {
  caseData: DtoCase;
}

function CaseRow({ caseData }: CaseRowProps) {
  const { t } = useTranslation();
  const { student, assignee } = caseData;

  const statusClass =
    caseData.status === 'awaiting_correction' ? 'bg-amber-100 text-amber-900' : undefined;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        <Link
          href={`/admin/cases/${caseData.caseNumber}`}
          className="text-foreground hover:underline"
        >
          {caseData.caseNumber}
        </Link>
      </TableCell>
      <TableCell>
        <div>
          <div className="text-sm font-medium">
            {student.firstName} {student.lastName}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {maskSsn(student.ssnLast4)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{caseData.group}</span>
          {student.faDdxPopulated ? (
            <Badge variant="outline" className="text-[10px]">
              {t('admin.faDdx')}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[caseData.status]} className={cn(statusClass)}>
          {t(`admin.status.${caseData.status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        {assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {assignee.initials}
            </div>
            <span className="text-sm">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('admin.unassigned')}</span>
        )}
      </TableCell>
      <TableCell className="text-sm tabular-nums">{formatShortDate(caseData.deadline)}</TableCell>
      <TableCell className="text-sm tabular-nums">
        {formatShortDate(caseData.lastActionAt)}
      </TableCell>
    </TableRow>
  );
}

const INITIAL_FILTERS: Filters = {
  group: 'all',
  status: 'all',
  assignee: 'all',
};

export default function AdminCasesPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const { data: allCases = [], isLoading: isCasesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getAllCasesAction,
  });

  const { data: allStaff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: getAllStaffAction,
  });

  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      if (filters.group !== 'all' && c.group !== filters.group) return false;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned') {
          if (c.assignedTo) return false;
        } else if (c.assignedTo !== filters.assignee) {
          return false;
        }
      }
      return true;
    });
  }, [allCases, filters]);

  const stats = useMemo(() => {
    const open = allCases.filter(
      (c) =>
        c.status === 'pending_student' ||
        c.status === 'in_review' ||
        c.status === 'awaiting_correction',
    ).length;
    const inReview = allCases.filter((c) => c.status === 'in_review').length;
    const approved = allCases.filter((c) => c.status === 'approved').length;
    const escalated = allCases.filter(
      (c) => c.status === 'escalated' || c.status === 'rejected',
    ).length;
    return { open, inReview, approved, escalated };
  }, [allCases]);

  const groupOptions = useMemo<ReadonlyArray<FilterChipOption>>(
    () => [
      { value: 'all', label: t('admin.filter.all') },
      { value: 'V1', label: 'V1' },
      { value: 'V4', label: 'V4' },
      { value: 'V5', label: 'V5' },
    ],
    [t],
  );

  const statusOptions = useMemo<ReadonlyArray<FilterChipOption>>(
    () => [
      { value: 'all', label: t('admin.filter.all') },
      ...STATUS_VALUES.map((status) => ({
        value: status,
        label: t(`admin.status.${status}`),
      })),
    ],
    [t],
  );

  const assigneeOptions = useMemo<ReadonlyArray<FilterChipOption>>(
    () => [
      { value: 'all', label: t('admin.filter.all') },
      { value: 'unassigned', label: t('admin.unassigned') },
      ...allStaff.map((s) => ({ value: s.id, label: s.name })),
    ],
    [t, allStaff],
  );

  const hasActiveFilter =
    filters.group !== 'all' || filters.status !== 'all' || filters.assignee !== 'all';

  const resetFilters = (): void => setFilters(INITIAL_FILTERS);

  return (
    <PageShell
      title={t('admin.cases.title')}
      description={t('admin.cases.subtitle', { count: filteredCases.length })}
      actions={<Button size="sm">{t('admin.cases.exportCsv')}</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          label={t('admin.filter.group')}
          value={filters.group}
          options={groupOptions}
          onChange={(next) =>
            setFilters((prev) => ({ ...prev, group: next as GroupFilter }))
          }
        />
        <FilterChip
          label={t('admin.filter.status')}
          value={filters.status}
          options={statusOptions}
          onChange={(next) =>
            setFilters((prev) => ({ ...prev, status: next as StatusFilter }))
          }
        />
        <FilterChip
          label={t('admin.filter.assignee')}
          value={filters.assignee}
          options={assigneeOptions}
          onChange={(next) =>
            setFilters((prev) => ({ ...prev, assignee: next as AssigneeFilter }))
          }
        />
        {hasActiveFilter ? (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t('admin.filter.clear')}
          </Button>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.cases.stat.open')}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.cases.stat.inReview')}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.cases.stat.approved')}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('admin.cases.stat.escalated')}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.escalated}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.cases.column.id')}</TableHead>
              <TableHead>{t('admin.cases.column.student')}</TableHead>
              <TableHead>{t('admin.cases.column.group')}</TableHead>
              <TableHead>{t('admin.cases.column.status')}</TableHead>
              <TableHead>{t('admin.cases.column.assignee')}</TableHead>
              <TableHead>{t('admin.cases.column.deadline')}</TableHead>
              <TableHead>{t('admin.cases.column.lastAction')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCasesLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((c) => <CaseRow key={c.id} caseData={c} />)
            )}
          </TableBody>
        </Table>
      </Card>
    </PageShell>
  );
}
