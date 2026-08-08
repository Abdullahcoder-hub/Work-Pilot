import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as meetingsApi from './meetingsApi';
import { MeetingFormInput } from './meetingsApi';

const KEY = ['meetings'];

export function useMeetings() {
  return useQuery({ queryKey: KEY, queryFn: () => meetingsApi.listMeetings() });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: KEY });
}

export function useCreateMeeting() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (input: MeetingFormInput) => meetingsApi.createMeeting(input), onSuccess: invalidate });
}

export function useUpdateMeeting() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MeetingFormInput> }) => meetingsApi.updateMeeting(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMeeting() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => meetingsApi.deleteMeeting(id), onSuccess: invalidate });
}
