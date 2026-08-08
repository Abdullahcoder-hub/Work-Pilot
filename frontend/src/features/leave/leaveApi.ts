import { api } from '../../lib/api';
import { ApiResponse, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '../../types';

export interface CreateLeaveInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function listLeaveRequests(params?: { status?: LeaveStatus; userId?: string }) {
  const { data } = await api.get<ApiResponse<LeaveRequest[]>>('/leave', { params });
  return data.data;
}

export async function getBalance(userId?: string) {
  const { data } = await api.get<ApiResponse<LeaveBalance[]>>('/leave/balance', { params: userId ? { userId } : undefined });
  return data.data;
}

export async function createLeaveRequest(input: CreateLeaveInput) {
  const { data } = await api.post<ApiResponse<LeaveRequest>>('/leave', input);
  return data.data;
}

export async function reviewLeaveRequest(id: string, status: 'approved' | 'rejected', reviewNote?: string) {
  const { data } = await api.patch<ApiResponse<LeaveRequest>>(`/leave/${id}/review`, { status, reviewNote });
  return data.data;
}

export async function cancelLeaveRequest(id: string) {
  const { data } = await api.patch<ApiResponse<LeaveRequest>>(`/leave/${id}/cancel`);
  return data.data;
}
