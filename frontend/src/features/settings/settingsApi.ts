import { api } from '../../lib/api';
import { ApiResponse, CompanySettings, User } from '../../types';

export async function getMyCompany() {
  const { data } = await api.get<ApiResponse<CompanySettings>>('/company/me');
  return data.data;
}

export async function updateMyCompany(name: string) {
  const { data } = await api.patch<ApiResponse<CompanySettings>>('/company/me', { name });
  return data.data;
}

export async function updateProfile(name: string) {
  const { data } = await api.patch<ApiResponse<User>>('/users/me', { name });
  return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.post('/users/me/change-password', { currentPassword, newPassword });
}
