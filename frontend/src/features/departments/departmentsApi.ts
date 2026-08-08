import { api } from '../../lib/api';
import { ApiResponse, Department } from '../../types';

export interface DepartmentFormInput {
  name: string;
  description?: string;
  headUserId?: string | null;
}

export async function listDepartments() {
  const { data } = await api.get<ApiResponse<Department[]>>('/departments');
  return data.data;
}

export async function createDepartment(input: DepartmentFormInput) {
  const { data } = await api.post<ApiResponse<Department>>('/departments', input);
  return data.data;
}

export async function updateDepartment(id: string, input: Partial<DepartmentFormInput>) {
  const { data } = await api.patch<ApiResponse<Department>>(`/departments/${id}`, input);
  return data.data;
}

export async function deleteDepartment(id: string) {
  await api.delete(`/departments/${id}`);
}
