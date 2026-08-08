import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useProjects, useDeleteProject } from './useProjects';
import { ProjectFormModal } from './ProjectFormModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Project } from '../../types';

const COLOR_BG: Record<string, string> = {
  brand: 'bg-brand-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
};

const STATUS_BADGE: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-50 text-emerald-700',
  on_hold: 'bg-amber-50 text-amber-700',
  completed: 'bg-brand-50 text-brand-700',
  archived: 'bg-slate-100 text-slate-500',
};

export function ProjectsPage() {
  const { hasRole } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const canCreate = hasRole('company_admin', 'team_lead');

  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(e: React.MouseEvent, project: Project) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    try {
      await deleteProject.mutateAsync(project._id);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">Kanban boards for everything your team is building.</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={canCreate ? 'Create a project to start a Kanban board for your team.' : 'You have not been added to any projects yet.'}
          action={
            canCreate ? (
              <button className="btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> New project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const total = project.taskCount ?? 0;
            const done = project.doneCount ?? 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Link key={project._id} to={`/projects/${project._id}`} className="card group block p-4 hover:border-brand-200">
                <div className="flex items-start justify-between">
                  <div className={clsx('h-2.5 w-2.5 rounded-full', COLOR_BG[project.color])} />
                  {canCreate && (
                    <button
                      onClick={(e) => handleDelete(e, project)}
                      aria-label="Delete project"
                      className="rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <h3 className="mt-2 truncate text-sm font-semibold text-slate-800">{project.name}</h3>
                {project.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>}

                <div className="mt-3 flex items-center gap-2">
                  <span className={clsx('badge', STATUS_BADGE[project.status])}>{project.status.replace('_', ' ')}</span>
                  {typeof project.departmentId === 'object' && project.departmentId && (
                    <span className="badge bg-slate-100 text-slate-600">{project.departmentId.name}</span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {done}/{total} tasks
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                    <div className={clsx('h-full rounded-full', COLOR_BG[project.color])} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                  <Users size={12} /> {project.members.length} member{project.members.length === 1 ? '' : 's'}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ProjectFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
