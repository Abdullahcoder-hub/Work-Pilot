import { api } from '../../lib/api';
import { ApiResponse, Project, ProjectColor, ProjectStatus } from '../../types';

export interface ProjectFormInput {
  name: string;
  description?: string;
  departmentId?: string | null;
  status?: ProjectStatus;
  color?: ProjectColor;
  members?: string[];
  startDate?: string;
  dueDate?: string;
}

export async function listProjects() {
  const { data } = await api.get<ApiResponse<Project[]>>('/projects');
  return data.data;
}

export async function getProject(id: string) {
  const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return data.data;
}

export async function createProject(input: ProjectFormInput) {
  const { data } = await api.post<ApiResponse<Project>>('/projects', input);
  return data.data;
}

export async function updateProject(id: string, input: Partial<ProjectFormInput>) {
  const { data } = await api.patch<ApiResponse<Project>>(`/projects/${id}`, input);
  return data.data;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}

export async function addMember(projectId: string, userId: string) {
  const { data } = await api.post<ApiResponse<Project>>(`/projects/${projectId}/members`, { userId });
  return data.data;
}

export async function removeMember(projectId: string, userId: string) {
  const { data } = await api.delete<ApiResponse<Project>>(`/projects/${projectId}/members`, { data: { userId } });
  return data.data;
}
