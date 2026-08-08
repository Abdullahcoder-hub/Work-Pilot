import { api } from '../../lib/api';
import { ActivityLogEntry, ApiResponse, Task } from '../../types';

export async function getTaskActivity(taskId: string) {
  const { data } = await api.get<ApiResponse<ActivityLogEntry[]>>(`/tasks/${taskId}/activity`);
  return data.data;
}

export async function approveTask(taskId: string) {
  const { data } = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/approve`);
  return data.data;
}
