import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as leaveApi from './leaveApi';
import { CreateLeaveInput } from './leaveApi';
import { LeaveStatus } from '../../types';

const LIST_KEY = (params?: Record<string, unknown>) => ['leave', 'list', params ?? {}];
const BALANCE_KEY = (userId?: string) => ['leave', 'balance', userId ?? 'self'];

export function useLeaveRequests(params?: { status?: LeaveStatus; userId?: string }) {
  return useQuery({ queryKey: LIST_KEY(params), queryFn: () => leaveApi.listLeaveRequests(params) });
}

export function useLeaveBalance(userId?: string) {
  return useQuery({ queryKey: BALANCE_KEY(userId), queryFn: () => leaveApi.getBalance(userId) });
}

function useInvalidateLeave() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ['leave'] });
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (input: CreateLeaveInput) => leaveApi.createLeaveRequest(input), onSuccess: invalidate });
}

export function useReviewLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: 'approved' | 'rejected'; reviewNote?: string }) =>
      leaveApi.reviewLeaveRequest(id, status, reviewNote),
    onSuccess: invalidate,
  });
}

export function useCancelLeaveRequest() {
  const invalidate = useInvalidateLeave();
  return useMutation({ mutationFn: (id: string) => leaveApi.cancelLeaveRequest(id), onSuccess: invalidate });
}
