import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from './tasksApi';
import * as taskActivityApi from './taskActivityApi';
import { TaskFilters, TaskFormInput } from './tasksApi';
import { Task, TaskStatus } from '../../types';

const TASKS_KEY = (filters: TaskFilters) => ['tasks', filters];
const PROJECT_BOARD_KEY = (projectId: string) => ['tasks', 'board', projectId];
const STATS_KEY = ['tasks', 'stats'];
const ACTIVITY_KEY = (taskId: string) => ['tasks', taskId, 'activity'];

export function useTasks(filters: TaskFilters) {
  return useQuery({ queryKey: TASKS_KEY(filters), queryFn: () => tasksApi.listTasks(filters) });
}

/** All tasks for a project's Kanban board, unpaginated and ordered for drag-and-drop. */
export function useProjectBoard(projectId: string | undefined) {
  return useQuery({
    queryKey: PROJECT_BOARD_KEY(projectId ?? ''),
    queryFn: () => tasksApi.listTasks({ projectId, limit: 500 }),
    enabled: !!projectId,
  });
}

export function useTaskStats() {
  return useQuery({ queryKey: STATS_KEY, queryFn: tasksApi.getStats });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: TaskFormInput) => tasksApi.createTask(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskFormInput> & { completed?: boolean; pinned?: boolean } }) =>
      tasksApi.updateTask(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: invalidate,
  });
}

export function useTaskActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: ACTIVITY_KEY(taskId ?? ''),
    queryFn: () => taskActivityApi.getTaskActivity(taskId as string),
    enabled: !!taskId,
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (taskId: string) => taskActivityApi.approveTask(taskId),
    onSuccess: (_data, taskId) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY(taskId) });
    },
  });
}

/**
 * Moves a task on a project board. Applies an optimistic update to the
 * board's cached task list first so the drag feels instant, then
 * reconciles with the server response (or rolls back on failure).
 */
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = PROJECT_BOARD_KEY(projectId);

  return useMutation({
    mutationFn: ({ id, status, index }: { id: string; status: TaskStatus; index: number }) =>
      tasksApi.moveTask(id, status, index),
    onMutate: async ({ id, status, index }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(queryKey);

      if (previous) {
        const tasks = [...previous.tasks];
        const movingIdx = tasks.findIndex((t) => t._id === id);
        if (movingIdx !== -1) {
          const [moving] = tasks.splice(movingIdx, 1);
          const updated: Task = { ...moving, status, completed: status === 'done' };
          const columnTasks = tasks.filter((t) => t.status === status);
          const others = tasks.filter((t) => t.status !== status);
          columnTasks.splice(index, 0, updated);
          queryClient.setQueryData(queryKey, { ...previous, tasks: [...others, ...columnTasks] });
        }
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}
