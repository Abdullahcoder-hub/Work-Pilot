import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as chatApi from './chatApi';
import { onSocketReady } from '../../lib/socket';
import { useAuth } from '../auth/AuthContext';
import { ChatMessage } from '../../types';

const key = (channelId: string) => ['chat', channelId];
const DM_THREADS_KEY = ['chat', 'dm-threads'];

function senderId(sender: ChatMessage['senderId']): string {
  // Defensive String() coercion: senderId arrives as a populated
  // {_id, name, email} object from the API/socket, but normalizing to a
  // plain string here means this comparison can never be tripped up by a
  // stray non-string id type sneaking in from a cache or an older payload
  // shape.
  return String(typeof sender === 'object' ? sender._id : sender);
}

export function useChatMessages(channelId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const tempCounter = useRef(0);

  const query = useQuery({
    queryKey: key(channelId),
    queryFn: () => chatApi.listMessages(channelId),
    enabled: !!channelId,
  });

  // Join the channel room for the lifetime of this hook instance, and
  // append live messages as they arrive. Uses onSocketReady rather than
  // getSocket() so it still works if this mounts before the socket has
  // finished connecting.
  useEffect(() => {
    if (!channelId) return;

    let joinedChannel: string | null = null;
    let detach: (() => void) | null = null;

    const unsubscribeReady = onSocketReady((socket) => {
      socket.emit('channel:join', channelId);
      joinedChannel = channelId;

      function handleMessage(message: ChatMessage) {
        if (message.channelId !== channelId) return;
        queryClient.setQueryData<ChatMessage[] | undefined>(key(channelId), (prev) => {
          if (!prev) return [message];
          if (prev.some((m) => m._id === message._id)) return prev;

          // Reconcile with our own optimistic placeholder, if this is the echo of it.
          if (user && senderId(message.senderId) === String(user._id)) {
            const tempIndex = prev.findIndex((m) => m._id.startsWith('temp-') && m.text === message.text);
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = message;
              return next;
            }
          }
          return [...prev, message];
        });
        // A new DM message changes the recent-conversations list (order,
        // preview text) — keep it in sync without a manual refresh.
        void queryClient.invalidateQueries({ queryKey: DM_THREADS_KEY });
      }

      socket.on('chat:message', handleMessage);
      detach = () => socket.off('chat:message', handleMessage);
    });

    return () => {
      unsubscribeReady();
      detach?.();
      if (joinedChannel) {
        onSocketReady((socket) => socket.emit('channel:leave', joinedChannel as string));
      }
    };
  }, [channelId, queryClient, user]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatApi.sendMessage(channelId, text),
    onMutate: async (text: string) => {
      if (!user) return;
      tempCounter.current += 1;
      const tempMessage: ChatMessage = {
        _id: `temp-${tempCounter.current}`,
        companyId: '',
        channelId,
        senderId: { _id: user._id, name: user.name, email: user.email },
        text,
        attachment: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[] | undefined>(key(channelId), (prev) => [...(prev ?? []), tempMessage]);
      return { tempId: tempMessage._id };
    },
    onError: (_err, _text, context) => {
      if (!context) return;
      queryClient.setQueryData<ChatMessage[] | undefined>(key(channelId), (prev) =>
        (prev ?? []).filter((m) => m._id !== context.tempId)
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DM_THREADS_KEY });
    },
    onSettled: () => setSending(false),
  });

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setSending(true);
    sendMutation.mutate(text.trim());
  }

  /** True if this message was sent by the person currently looking at the screen. */
  function isMine(message: ChatMessage): boolean {
    return !!user && senderId(message.senderId) === String(user._id);
  }

  return { messages: query.data ?? [], isLoading: query.isLoading, sendMessage, sending, isMine };
}

export function useDmThreads() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: DM_THREADS_KEY,
    queryFn: chatApi.listDmThreads,
    enabled: isAuthenticated,
  });
}
