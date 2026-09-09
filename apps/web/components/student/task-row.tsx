'use client';

import { useTranslation } from 'react-i18next';

import type { DtoTask } from '@/lib/data/types';
import { Badge, Button, type BadgeProps } from '@/ui';

interface TaskRowProps {
  task: DtoTask;
}

type TaskStatus = DtoTask['status'];

const STATUS_VARIANT: Record<TaskStatus, NonNullable<BadgeProps['variant']>> = {
  not_started: 'outline',
  in_progress: 'secondary',
  submitted: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const dueDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'America/Chicago',
});

function formatDue(value: Date | string): string {
  return dueDateFormatter.format(new Date(value));
}

export function TaskRow({ task }: TaskRowProps) {
  const { t } = useTranslation();

  const showAction = task.status === 'not_started' || task.status === 'in_progress';
  const actionLabel =
    task.status === 'in_progress' ? t('student.tasks.resume') : t('student.tasks.start');

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t(`student.taskType.${task.type}`)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {formatDue(task.dueAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={STATUS_VARIANT[task.status]}>
          {t(`student.taskStatus.${task.status}`)}
        </Badge>
        {showAction ? (
          <Button size="sm" variant="outline">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
