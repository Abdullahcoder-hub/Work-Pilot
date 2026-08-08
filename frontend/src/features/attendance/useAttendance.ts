import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as attendanceApi from './attendanceApi';
import { ManualEntryInput } from './attendanceApi';

const TODAY_KEY = ['attendance', 'today'];
const LIST_KEY = (params?: Record<string, unknown>) => ['attendance', 'list', params ?? {}];
const SUMMARY_KEY = (params?: Record<string, unknown>) => ['attendance', 'summary', params ?? {}];

export function useTodayAttendance() {
  return useQuery({ queryKey: TODAY_KEY, queryFn: attendanceApi.getToday });
}

export function useAttendanceList(params?: { from?: string; to?: string; userId?: string }) {
  return useQuery({ queryKey: LIST_KEY(params), queryFn: () => attendanceApi.listAttendance(params) });
}

export function useAttendanceSummary(params?: { userId?: string; year?: number; month?: number }) {
  return useQuery({ queryKey: SUMMARY_KEY(params), queryFn: () => attendanceApi.getSummary(params) });
}

function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ['attendance'] });
}

export function useClockIn() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: attendanceApi.clockIn, onSuccess: invalidate });
}

export function useClockOut() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: attendanceApi.clockOut, onSuccess: invalidate });
}

export function useManualAttendanceEntry() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: (input: ManualEntryInput) => attendanceApi.manualEntry(input), onSuccess: invalidate });
}

export function useDeleteAttendance() {
  const invalidate = useInvalidateAttendance();
  return useMutation({ mutationFn: (id: string) => attendanceApi.deleteAttendance(id), onSuccess: invalidate });
}
