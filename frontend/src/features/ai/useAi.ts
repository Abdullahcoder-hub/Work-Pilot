import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as aiApi from './aiApi';
import { AiChatMessage } from '../../types';

const HISTORY_KEY = ['ai', 'history'];

export function useAiHistory() {
  return useQuery({ queryKey: HISTORY_KEY, queryFn: aiApi.getHistory });
}

export function useClearAiHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiApi.clearHistory,
    onSuccess: () => queryClient.setQueryData<AiChatMessage[]>(HISTORY_KEY, []),
  });
}

interface SendChatInput {
  message: string;
  attachedFileId?: string;
}

/** Optimistically appends the user's message so the chat feels responsive while the (local, no-network-round-trip-to-an-LLM) command executes. */
export function useSendAiChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ message, attachedFileId }: SendChatInput) => aiApi.sendChat(message, attachedFileId),
    onMutate: ({ message }: SendChatInput) => {
      const optimisticUser: AiChatMessage = {
        _id: `temp-user-${Date.now()}`,
        role: 'user',
        content: message,
        intent: null,
        createdTaskId: null,
        completedTaskId: null,
        deletedTaskTitle: null,
        scheduledMeetingId: null,
        messagedChannelId: null,
        sentFileId: null,
        attendanceAction: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<AiChatMessage[]>(HISTORY_KEY, (prev) => [...(prev ?? []), optimisticUser]);
      return { tempId: optimisticUser._id };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<AiChatMessage[]>(HISTORY_KEY, (prev) => [...(prev ?? []), result.message]);
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData<AiChatMessage[]>(HISTORY_KEY, (prev) => (prev ?? []).filter((m) => m._id !== context?.tempId));
    },
  });
}
