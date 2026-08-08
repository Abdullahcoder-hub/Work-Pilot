import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, ListTodo } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTasks, useUpdateTask, useDeleteTask } from './useTasks';
import { useTeam } from '../team/useTeam';
import { TaskFormModal } from './TaskFormModal';
import { TaskActivityModal } from './TaskActivityModal';
import { TaskRow } from './TaskRow';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Task, TaskCategory, TaskPriority } from '../../types';

function idOf(entity: Task['createdBy']): string {
  return typeof entity === 'object' ? entity._id : entity;
}

export function TasksPage() {
  const { user, hasRole } = useAuth();
  const { data: team } = useTeam();
  const isManager = hasRole('company_admin', 'team_lead');

  const [filters, setFilters] = useState<{
    scope: 'mine' | 'assigned' | 'all';
    category?: TaskCategory;
    priority?: TaskPriority;
    search: string;
    page: number;
  }>({ scope: isManager ? 'all' : 'mine', search: '', page: 1 });

  const { data, isLoading } = useTasks({
    scope: filters.scope,
    category: filters.category,
    priority: filters.priority,
    search: filters.search || undefined,
    page: filters.page,
    limit: 20,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activityTask, setActivityTask] = useState<Task | null>(null);

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }
  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function toggleComplete(task: Task) {
    try {
      await updateTask.mutateAsync({ id: task._id, input: { completed: !task.completed } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function togglePin(task: Task) {
    try {
      await updateTask.mutateAsync({ id: task._id, input: { pinned: !task.pinned } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await deleteTask.mutateAsync(task._id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const tasks = data?.tasks ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tasks</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track and manage work across your team.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> New task
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input w-64 pl-8"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="input w-auto"
          value={filters.scope}
          onChange={(e) => setFilters((p) => ({ ...p, scope: e.target.value as typeof p.scope, page: 1 }))}
        >
          <option value="mine">Created by me</option>
          <option value="assigned">Assigned to me</option>
          {isManager && <option value="all">All company tasks</option>}
        </select>

        <select
          className="input w-auto"
          value={filters.category ?? ''}
          onChange={(e) => setFilters((p) => ({ ...p, category: (e.target.value || undefined) as TaskCategory | undefined, page: 1 }))}
        >
          <option value="">All categories</option>
          {(['Work', 'Study', 'Personal', 'Shopping', 'Fitness'] as TaskCategory[]).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={filters.priority ?? ''}
          onChange={(e) => setFilters((p) => ({ ...p, priority: (e.target.value || undefined) as TaskPriority | undefined, page: 1 }))}
        >
          <option value="">All priorities</option>
          {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks here yet"
          description="Create a task to get your team moving."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> New task
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isCreator = idOf(task.createdBy) === user?._id;
            return (
              <TaskRow
                key={task._id}
                task={task}
                onToggleComplete={toggleComplete}
                onTogglePin={togglePin}
                onEdit={openEdit}
                onDelete={handleDelete}
                onViewActivity={setActivityTask}
                canEdit={isCreator || isManager}
                canDelete={isCreator || isManager}
              />
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            className="btn-secondary !px-3 !py-1.5 text-xs"
            disabled={filters.page <= 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn-secondary !px-3 !py-1.5 text-xs"
            disabled={filters.page >= pagination.totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      <TaskFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} task={editingTask} assignableMembers={team ?? []} />
      <TaskActivityModal isOpen={!!activityTask} onClose={() => setActivityTask(null)} task={activityTask} />
    </div>
  );
}
