import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Task } from '../../types';

const PRIORITY_DOT: Record<string, string> = {
  High: 'bg-rose-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
};

function assigneeInitial(assignee: Task['assigneeId']): string | null {
  if (!assignee || typeof assignee !== 'object') return null;
  return assignee.name.charAt(0).toUpperCase();
}

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.status !== 'done' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
  const initial = assigneeInitial(task.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-border bg-white p-3 shadow-sm hover:border-brand-200 active:cursor-grabbing"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={clsx('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} />
        <span className="text-xs text-slate-400">{task.category}</span>
      </div>
      <p className="text-sm font-medium leading-snug text-slate-800">{task.title}</p>
      <div className="mt-2.5 flex items-center justify-between">
        {task.dueDate ? (
          <span className={clsx('inline-flex items-center gap-1 text-xs', isOverdue ? 'text-rose-600' : 'text-slate-400')}>
            <Calendar size={11} /> {task.dueDate.slice(5)}
          </span>
        ) : (
          <span />
        )}
        {initial && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}
