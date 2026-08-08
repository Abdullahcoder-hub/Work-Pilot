import { api } from '../../lib/api';
import { ApiResponse, ReportsOverview } from '../../types';

export async function getOverview() {
  const { data } = await api.get<ApiResponse<ReportsOverview>>('/reports/overview');
  return data.data;
}
