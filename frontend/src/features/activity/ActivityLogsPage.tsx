import { useQuery } from '@tanstack/react-query';
import { ScrollText, UserPlus, CheckCircle2, ShieldCheck, RotateCcw, PlusCircle, Repeat } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ActivityAction } from '../../types';
import * as activityApi from './activityApi';

const ACTION_ICON: Record<ActivityAction, typeof UserPlus> = {
  task_created: PlusCircle,
  task_assigned: UserPlus,
  task_reassigned: Repeat,
  status_changed: Repeat,
  task_completed: CheckCircle2,
  task_reopened: RotateCcw,
  task_approved: ShieldCheck,
};

const ACTION_COLOR: Record<ActivityAction, string> = {
  task_created: 'bg-slate-100 text-slate-500',
  task_assigned: 'bg-brand-100 text-brand-600',
  task_reassigned: 'bg-brand-100 text-brand-600',
  status_changed: 'bg-slate-100 text-slate-500',
  task_completed: 'bg-emerald-100 text-emerald-600',
  task_reopened: 'bg-amber-100 text-amber-600',
  task_approved: 'bg-violet-100 text-violet-600',
};

export function ActivityLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'company'],
    queryFn: activityApi.listCompanyActivity,
  });

  const entries = data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Activity Logs</h1>
        <p className="mt-0.5 text-sm text-slate-500">Recent task activity across your company, newest first.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Task assignments, completions, and approvals will show up here." />
      ) : (
        <div className="card divide-y divide-border">
          {entries.map((entry) => {
            const Icon = ACTION_ICON[entry.action];
            const taskTitle = typeof entry.taskId === 'object' ? entry.taskId.title : null;
            return (
              <div key={entry._id} className="flex items-start gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ACTION_COLOR[entry.action]}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{entry.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                    {taskTitle && <span> · {taskTitle}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
