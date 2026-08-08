import { api } from '../../lib/api';
import { ApiResponse, AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../../types';

export interface ManualEntryInput {
  userId: string;
  date: string;
  status: AttendanceStatus;
  clockIn?: string;
  clockOut?: string;
  notes?: string;
}

export async function clockIn() {
  const { data } = await api.post<ApiResponse<AttendanceRecord>>('/attendance/clock-in');
  return data.data;
}

export async function clockOut() {
  const { data } = await api.post<ApiResponse<AttendanceRecord>>('/attendance/clock-out');
  return data.data;
}

export async function getToday() {
  const { data } = await api.get<ApiResponse<AttendanceRecord | null>>('/attendance/today');
  return data.data;
}

export async function listAttendance(params?: { from?: string; to?: string; userId?: string }) {
  const { data } = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance', { params });
  return data.data;
}

export async function getSummary(params?: { userId?: string; year?: number; month?: number }) {
  const { data } = await api.get<ApiResponse<AttendanceSummary>>('/attendance/summary', { params });
  return data.data;
}

export async function manualEntry(input: ManualEntryInput) {
  const { data } = await api.post<ApiResponse<AttendanceRecord>>('/attendance', input);
  return data.data;
}

export async function updateAttendance(id: string, input: Partial<ManualEntryInput>) {
  const { data } = await api.patch<ApiResponse<AttendanceRecord>>(`/attendance/${id}`, input);
  return data.data;
}

export async function deleteAttendance(id: string) {
  await api.delete(`/attendance/${id}`);
}
