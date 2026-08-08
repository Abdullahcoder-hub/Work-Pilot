import { api } from '../../lib/api';
import { ApiResponse, User } from '../../types';
import { InviteUserPayload } from '../auth/authApi';

export async function listTeam() {
  const { data } = await api.get<ApiResponse<User[]>>('/users');
  return data.data;
}

export async function setUserActive(userId: string, isActive: boolean) {
  const { data } = await api.patch<ApiResponse<User>>(`/users/${userId}/status`, { isActive });
  return data.data;
}

export type { InviteUserPayload };
