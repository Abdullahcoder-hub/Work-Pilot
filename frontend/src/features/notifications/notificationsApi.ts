import { api } from '../../lib/api';
import { ApiResponse, AppNotification, Pagination } from '../../types';

export async function listNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
  const { data } = await api.get<ApiResponse<AppNotification[]> & { pagination: Pagination; unreadCount: number }>(
    '/notifications',
    { params }
  );
  return { notifications: data.data, unreadCount: data.unreadCount, pagination: data.pagination };
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
