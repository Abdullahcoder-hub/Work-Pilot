import { api } from '../../lib/api';
import { ActivityLogEntry, ApiResponse } from '../../types';

export async function listCompanyActivity() {
  const { data } = await api.get<ApiResponse<ActivityLogEntry[]>>('/activity');
  return data.data;
}
