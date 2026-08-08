import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Project, ProjectColor, ProjectStatus } from '../../types';
import { useDepartments } from '../departments/useDepartments';
import { useTeam } from '../team/useTeam';
import { useCreateProject, useUpdateProject } from './useProjects';

const COLORS: { value: ProjectColor; swatch: string }[] = [
  { value: 'brand', swatch: 'bg-brand-500' },
  { value: 'teal', swatch: 'bg-teal-500' },
  { value: 'amber', swatch: 'bg-amber-500' },
  { value: 'rose', swatch: 'bg-rose-500' },
  { value: 'violet', swatch: 'bg-violet-500' },
  { value: 'sky', swatch: 'bg-sky-500' },
];

const STATUSES: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived'];

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({ isOpen, onClose, project }: ProjectFormModalProps) {
  const { data: departments } = useDepartments();
  const { data: members } = useTeam();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(project?._id ?? '');
  const isEditing = !!project;

  const [form, setForm] = useState({
    name: '',
    description: '',
    departmentId: '',
    color: 'brand' as ProjectColor,
    status: 'planning' as ProjectStatus,
    startDate: '',
    dueDate: '',
    members: [] as string[],
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description,
        departmentId: typeof project.departmentId === 'object' ? project.departmentId?._id ?? '' : project.departmentId ?? '',
        color: project.color,
        status: project.status,
        startDate: project.startDate,
        dueDate: project.dueDate,
        members: project.members.map((m) => (typeof m === 'object' ? m._id : m)),
      });
    } else {
      setForm({ name: '', description: '', departmentId: '', color: 'brand', status: 'planning', startDate: '', dueDate: '', members: [] });
    }
  }, [project, isOpen]);

  const isSubmitting = createProject.isPending || updateProject.isPending;

  function toggleMember(userId: string) {
    setForm((p) => ({
      ...p,
      members: p.members.includes(userId) ? p.members.filter((m) => m !== userId) : [...p.members, userId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        departmentId: form.departmentId || null,
        color: form.color,
        status: form.status,
        startDate: form.startDate,
        dueDate: form.dueDate,
        members: form.members,
      };
      if (isEditing && project) {
        await updateProject.mutateAsync(payload);
        toast.success('Project updated');
      } else {
        await createProject.mutateAsync(payload);
        toast.success('Project created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit project' : 'New project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="project-name">
            Project name
          </label>
          <input
            id="project-name"
            required
            maxLength={150}
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="project-description">
            Description
          </label>
          <textarea
            id="project-description"
            rows={3}
            maxLength={2000}
            className="input"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="project-department">
              Department
            </label>
            <select
              id="project-department"
              className="input"
              value={form.departmentId}
              onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
            >
              <option value="">No department</option>
              {(departments ?? []).map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          {isEditing && (
            <div>
              <label className="label" htmlFor="project-status">
                Status
              </label>
              <select
                id="project-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="project-start">
              Start date
            </label>
            <input
              id="project-start"
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="project-due">
              Due date
            </label>
            <input
              id="project-due"
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <span className="label">Color</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.value}
                aria-label={`Color ${c.value}`}
                onClick={() => setForm((p) => ({ ...p, color: c.value }))}
                className={`h-7 w-7 rounded-full ${c.swatch} ${form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="label">Members</span>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {(members ?? []).map((m) => (
              <label key={m._id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-subtle">
                <input
                  type="checkbox"
                  checked={form.members.includes(m._id)}
                  onChange={() => toggleMember(m._id)}
                  className="h-3.5 w-3.5 rounded border-border text-brand-500 focus:ring-brand-400"
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Save changes' : 'Create project'}
        </button>
      </form>
    </Modal>
  );
}
