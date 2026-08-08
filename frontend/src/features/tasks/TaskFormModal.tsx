import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Task, TaskCategory, TaskPriority, TaskStatus, User } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { useCreateTask, useUpdateTask } from './useTasks';

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Personal', 'Shopping', 'Fitness'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  assignableMembers: User[];
  /** When set, a new task is created inside this project (unused when editing). */
  projectId?: string;
  /** Kanban column a new project task should start in. Ignored outside a project context. */
  defaultStatus?: TaskStatus;
}

export function TaskFormModal({ isOpen, onClose, task, assignableMembers, projectId, defaultStatus }: TaskFormModalProps) {
  const { user, hasRole } = useAuth();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = !!task;
  const canAssignOthers = hasRole('company_admin', 'team_lead');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Work' as TaskCategory,
    priority: 'Medium' as TaskPriority,
    dueDate: '',
    assigneeId: user?._id ?? '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: typeof task.assigneeId === 'object' ? task.assigneeId?._id ?? '' : task.assigneeId ?? '',
      });
    } else {
      setForm({ title: '', description: '', category: 'Work', priority: 'Medium', dueDate: '', assigneeId: user?._id ?? '' });
    }
  }, [task, user, isOpen]);

  const isSubmitting = createTask.isPending || updateTask.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task._id,
          input: { ...form, assigneeId: form.assigneeId || null },
        });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync({
          ...form,
          assigneeId: form.assigneeId || undefined,
          projectId: projectId ?? undefined,
          status: projectId ? defaultStatus ?? 'todo' : undefined,
        });
        toast.success('Task created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="task-title">
            Title
          </label>
          <input
            id="task-title"
            required
            maxLength={200}
            className="input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-description">
            Description
          </label>
          <textarea
            id="task-description"
            rows={3}
            maxLength={2000}
            className="input"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-category">
              Category
            </label>
            <select
              id="task-category"
              className="input"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TaskCategory }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="input"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-due">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="task-assignee">
              Assignee
            </label>
            <select
              id="task-assignee"
              className="input"
              disabled={!canAssignOthers}
              value={form.assigneeId}
              onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}
            >
              <option value={user?._id}>{user?.name} (me)</option>
              {canAssignOthers &&
                assignableMembers
                  .filter((m) => m._id !== user?._id)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </Modal>
  );
}
