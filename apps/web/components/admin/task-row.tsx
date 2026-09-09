'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { approveTaskAction, rejectTaskAction } from '@/lib/actions/case-actions';
import type { DtoTask } from '@/lib/data/types';
import { Badge, Button, type BadgeProps } from '@/ui';

interface AdminTaskRowProps {
  task: DtoTask;
  caseNumber: string;
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

export function AdminTaskRow({ task, caseNumber }: AdminTaskRowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['case', caseNumber] });
    queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['case-audit'] });
  };

  const approve = useMutation({
    mutationFn: () => approveTaskAction(task.id),
    onSuccess: (result) => {
      if (!result.ok) {
        window.alert(t(result.errorKey));
        return;
      }
      invalidate();
    },
    onError: () => {
      window.alert(t('cases.errors.unknown'));
    },
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectTaskAction(task.id, reason),
    onSuccess: (result) => {
      if (!result.ok) {
        window.alert(t(result.errorKey));
        return;
      }
      invalidate();
    },
    onError: () => {
      window.alert(t('cases.errors.unknown'));
    },
  });

  const handleReject = (): void => {
    const reason = window.prompt(t('cases.errors.rejectReasonPrompt'));
    if (!reason) return;
    reject.mutate(reason);
  };

  const showReviewActions = task.status === 'submitted' || task.status === 'in_progress';
  const showViewAction = task.status === 'approved' || task.status === 'rejected';
  const isPending = approve.isPending || reject.isPending;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t(`admin.taskType.${task.type}`)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {formatDue(task.dueAt)}
        </p>
        {task.notes ? (
          <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[task.status]}>
          {t(`admin.taskStatus.${task.status}`)}
        </Badge>
        {showReviewActions ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleReject}
            >
              {t('admin.case.tasks.reject')}
            </Button>
            <Button size="sm" disabled={isPending} onClick={() => approve.mutate()}>
              {t('admin.case.tasks.approve')}
            </Button>
          </>
        ) : null}
        {showViewAction ? (
          <Button size="sm" variant="ghost">
            {t('admin.case.tasks.view')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
