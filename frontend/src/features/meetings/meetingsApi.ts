import { api } from '../../lib/api';
import { ApiResponse, Meeting, MeetingStatus } from '../../types';

export interface MeetingFormInput {
  title: string;
  description?: string;
  projectId?: string | null;
  attendees?: string[];
  startTime: string;
  endTime: string;
  location?: string;
  status?: MeetingStatus;
}

export async function listMeetings(params?: { from?: string; to?: string; projectId?: string }) {
  const { data } = await api.get<ApiResponse<Meeting[]>>('/meetings', { params });
  return data.data;
}

export async function createMeeting(input: MeetingFormInput) {
  const { data } = await api.post<ApiResponse<Meeting>>('/meetings', input);
  return data.data;
}

export async function updateMeeting(id: string, input: Partial<MeetingFormInput>) {
  const { data } = await api.patch<ApiResponse<Meeting>>(`/meetings/${id}`, input);
  return data.data;
}

export async function deleteMeeting(id: string) {
  await api.delete(`/meetings/${id}`);
}
