import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';
import { useProject, useDeleteProject } from './useProjects';
import { useProjectBoard, useMoveTask } from '../tasks/useTasks';
import { useAuth } from '../auth/AuthContext';
import { onSocketReady } from '../../lib/socket';
import { KanbanColumn } from './KanbanColumn';
import { ProjectFormModal } from './ProjectFormModal';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { Spinner, FullPageSpinner } from '../../components/ui/Spinner';
import { Task, TaskStatus, User } from '../../types';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'in_review', title: 'In Review' },
  { status: 'done', title: 'Done' },
];

const STATUS_SET = new Set<TaskStatus>(COLUMNS.map((c) => c.status));

const COLOR_TEXT: Record<string, string> = {
  brand: 'text-brand-600 bg-brand-50',
  teal: 'text-teal-600 bg-teal-50',
  amber: 'text-amber-600 bg-amber-50',
  rose: 'text-rose-600 bg-rose-50',
  violet: 'text-violet-600 bg-violet-50',
  sky: 'text-sky-600 bg-sky-50',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: board, isLoading: boardLoading } = useProjectBoard(id);
  const moveTask = useMoveTask(id ?? '');
  const deleteProject = useDeleteProject();

  // Live board sync: other users dragging cards, creating, or deleting
  // tasks on this project trigger a 'board:changed' event server-side,
  // which we use to refetch rather than trying to merge partial diffs.
  useEffect(() => {
    if (!id) return;

    let joinedProject: string | null = null;
    let detach: (() => void) | null = null;

    const unsubscribeReady = onSocketReady((socket) => {
      socket.emit('project:join', id);
      joinedProject = id;

      function handleBoardChange() {
        void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
      socket.on('board:changed', handleBoardChange);
      detach = () => socket.off('board:changed', handleBoardChange);
    });

    return () => {
      unsubscribeReady();
      detach?.();
      if (joinedProject) {
        onSocketReady((socket) => socket.emit('project:leave', joinedProject as string));
      }
    };
  }, [id, queryClient]);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [taskModalState, setTaskModalState] = useState<{ open: boolean; task: Task | null; defaultStatus: TaskStatus }>({
    open: false,
    task: null,
    defaultStatus: 'todo',
  });

  const canManage = hasRole('company_admin', 'team_lead');

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    for (const task of board?.tasks ?? []) {
      grouped[task.status].push(task);
    }
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => grouped[status].sort((a, b) => a.order - b.order));
    return grouped;
  }, [board]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    let sourceStatus: TaskStatus | null = null;
    for (const status of COLUMNS.map((c) => c.status)) {
      if (columns[status].some((t) => t._id === activeId)) sourceStatus = status;
    }
    if (!sourceStatus) return;

    let destStatus: TaskStatus;
    let destIndex: number;

    if (STATUS_SET.has(overId as TaskStatus)) {
      destStatus = overId as TaskStatus;
      destIndex = columns[destStatus].length;
    } else {
      let found: TaskStatus | null = null;
      let idx = 0;
      for (const status of COLUMNS.map((c) => c.status)) {
        const pos = columns[status].findIndex((t) => t._id === overId);
        if (pos !== -1) {
          found = status;
          idx = pos;
        }
      }
      if (!found) return;
      destStatus = found;
      destIndex = idx;
    }

    if (sourceStatus === destStatus) {
      const currentIndex = columns[sourceStatus].findIndex((t) => t._id === activeId);
      if (currentIndex === destIndex) return;
    }

    moveTask.mutate({ id: activeId, status: destStatus, index: destIndex });
  }

  async function handleDeleteProject() {
    if (!project) return;
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    try {
      await deleteProject.mutateAsync(project._id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (projectLoading || !project) return <FullPageSpinner />;

  const members = project.members.filter((m): m is User => typeof m === 'object');

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft size={12} /> All projects
        </Link>
      </div>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={clsx('badge', COLOR_TEXT[project.color])}>{project.status.replace('_', ' ')}</span>
            <h1 className="text-lg font-semibold text-slate-900">{project.name}</h1>
          </div>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>}
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <Users size={12} /> {members.map((m) => m.name).join(', ') || 'No members yet'}
          </div>
        </div>

        {canManage && (
          <div className="flex gap-1.5">
            <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => setEditProjectOpen(true)} aria-label="Edit project">
              <Pencil size={14} />
            </button>
            <button className="btn-secondary !px-2.5 !py-1.5 hover:!bg-rose-50 hover:!text-rose-600" onClick={handleDeleteProject} aria-label="Delete project">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {boardLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  tasks={columns[col.status]}
                  onCardClick={(task) => setTaskModalState({ open: true, task, defaultStatus: col.status })}
                  onAddClick={() => setTaskModalState({ open: true, task: null, defaultStatus: col.status })}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}

      <ProjectFormModal isOpen={editProjectOpen} onClose={() => setEditProjectOpen(false)} project={project} />

      <TaskFormModal
        isOpen={taskModalState.open}
        onClose={() => setTaskModalState((p) => ({ ...p, open: false }))}
        task={taskModalState.task}
        assignableMembers={members}
        projectId={id}
        defaultStatus={taskModalState.defaultStatus}
      />
    </div>
  );
}
