import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onAddClick: () => void;
}

export function KanbanColumn({ status, title, tasks, onCardClick, onAddClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-subtle">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{tasks.length}</span>
        </div>
        <button onClick={onAddClick} aria-label={`Add task to ${title}`} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600">
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto rounded-lg p-2 pt-0 transition-colors ${isOver ? 'bg-brand-50/50' : ''}`}
        style={{ minHeight: 120 }}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task._id} task={task} onClick={() => onCardClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
