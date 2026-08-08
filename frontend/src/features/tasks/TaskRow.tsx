import { Pin, Pencil, Trash2, Calendar, History, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { Task } from '../../types';

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
};

const CATEGORY_STYLES: Record<string, string> = {
  Work: 'bg-brand-50 text-brand-700',
  Study: 'bg-sky-50 text-sky-700',
  Personal: 'bg-violet-50 text-violet-700',
  Shopping: 'bg-orange-50 text-orange-700',
  Fitness: 'bg-teal-50 text-teal-700',
};

function nameOf(entity: Task['assigneeId']): string | null {
  if (!entity) return null;
  return typeof entity === 'object' ? entity.name : null;
}

interface TaskRowProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onTogglePin: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewActivity: (task: Task) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskRow({
  task,
  onToggleComplete,
  onTogglePin,
  onEdit,
  onDelete,
  onViewActivity,
  canEdit,
  canDelete,
}: TaskRowProps) {
  const isOverdue = !task.completed && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
  const assigneeName = nameOf(task.assigneeId);

  return (
    <div className="card flex items-start gap-3 p-4">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
        className="mt-1 h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-400"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={clsx('text-sm font-medium text-slate-800', task.completed && 'text-slate-400 line-through')}>
            {task.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onViewActivity(task)}
              aria-label="View activity"
              className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
            >
              <History size={14} />
            </button>
            <button
              onClick={() => onTogglePin(task)}
              aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
              className={clsx('rounded p-1 hover:bg-surface-subtle', task.pinned ? 'text-brand-500' : 'text-slate-300')}
            >
              <Pin size={14} fill={task.pinned ? 'currentColor' : 'none'} />
            </button>
            {canEdit && (
              <button onClick={() => onEdit(task)} aria-label="Edit task" className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600">
                <Pencil size={14} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(task)} aria-label="Delete task" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {task.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description}</p>}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={clsx('badge', CATEGORY_STYLES[task.category])}>{task.category}</span>
          <span className={clsx('badge', PRIORITY_STYLES[task.priority])}>{task.priority}</span>
          {task.dueDate && (
            <span className={clsx('badge inline-flex items-center gap-1', isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')}>
              <Calendar size={11} /> {task.dueDate}
            </span>
          )}
          {assigneeName && <span className="badge bg-slate-100 text-slate-600">Assigned: {assigneeName}</span>}
          {task.approvedBy && (
            <span className="badge inline-flex items-center gap-1 bg-violet-50 text-violet-700">
              <ShieldCheck size={11} /> Approved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
