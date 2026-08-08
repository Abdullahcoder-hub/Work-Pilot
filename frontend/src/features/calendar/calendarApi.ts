import { api } from '../../lib/api';
import { ApiResponse, CalendarEvent } from '../../types';

export async function getCalendarEvents(from: string, to: string) {
  const { data } = await api.get<ApiResponse<CalendarEvent[]>>('/calendar', { params: { from, to } });
  return data.data;
}
