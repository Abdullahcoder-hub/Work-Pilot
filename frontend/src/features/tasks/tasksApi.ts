import { api } from '../../lib/api';
import { ApiResponse, Pagination, Task, TaskCategory, TaskPriority, TaskStats, TaskStatus } from '../../types';

export interface TaskFilters {
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  projectId?: string;
  completed?: boolean;
  scope?: 'mine' | 'assigned' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskFormInput {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  projectId?: string | null;
  dueDate?: string;
  assigneeId?: string | null;
}

export async function listTasks(filters: TaskFilters) {
  const { data } = await api.get<ApiResponse<Task[]> & { pagination: Pagination }>('/tasks', { params: filters });
  return { tasks: data.data, pagination: data.pagination };
}

export async function getStats() {
  const { data } = await api.get<ApiResponse<TaskStats>>('/tasks/stats');
  return data.data;
}

export async function createTask(input: TaskFormInput) {
  const { data } = await api.post<ApiResponse<Task>>('/tasks', input);
  return data.data;
}

export async function updateTask(id: string, input: Partial<TaskFormInput> & { completed?: boolean; pinned?: boolean }) {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, input);
  return data.data;
}

export async function moveTask(id: string, status: TaskStatus, index: number) {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/move`, { status, index });
  return data.data;
}

export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`);
}
