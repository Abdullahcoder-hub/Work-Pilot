import toast from 'react-hot-toast';
import { UserPlus, CheckCircle2, ShieldCheck, RotateCcw, PlusCircle, Repeat } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { ActivityAction, Task } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { useApproveTask, useTaskActivity } from './useTasks';

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

interface TaskActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskActivityModal({ isOpen, onClose, task }: TaskActivityModalProps) {
  const { hasRole } = useAuth();
  const { data: activity, isLoading } = useTaskActivity(task?._id);
  const approve = useApproveTask();

  const canApprove = hasRole('company_admin', 'team_lead');
  const showApproveButton = !!task && task.completed && !task.approvedBy;

  async function handleApprove() {
    if (!task) return;
    try {
      await approve.mutateAsync(task._id);
      toast.success('Task approved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve task');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? `Activity — ${task.title}` : 'Activity'}>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !activity || activity.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">No activity yet.</p>
      ) : (
        <ol className="space-y-0">
          {activity.map((entry, idx) => {
            const Icon = ACTION_ICON[entry.action];
            const isLast = idx === activity.length - 1;
            return (
              <li key={entry._id} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast && <span className="absolute left-3.5 top-8 h-full w-px bg-border" />}
                <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ACTION_COLOR[entry.action]}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm text-slate-700">{entry.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canApprove && showApproveButton && (
        <button
          onClick={handleApprove}
          disabled={approve.isPending}
          className="btn-primary mt-4 w-full"
        >
          {approve.isPending ? <Spinner className="h-4 w-4 text-white" /> : (
            <>
              <ShieldCheck size={16} /> Approve this task
            </>
          )}
        </button>
      )}
      {task?.approvedBy && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-violet-600">
          <ShieldCheck size={13} /> Approved{typeof task.approvedBy === 'object' ? ` by ${task.approvedBy.name}` : ''}
        </p>
      )}
    </Modal>
  );
}
