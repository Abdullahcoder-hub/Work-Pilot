import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from './notificationsApi';
import { useAuth } from '../auth/AuthContext';
import { onSocketReady } from '../../lib/socket';
import { AppNotification } from '../../types';

const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsApi.listNotifications({ limit: 20 }),
    enabled: isAuthenticated,
    // Poll stays on as a fallback for anyone whose socket isn't connected
    // (briefly offline, proxy blocking websockets, etc) — the socket
    // listener below makes updates feel instant when it IS connected.
    refetchInterval: 30_000,
  });

  useNotificationSocket();

  return query;
}

function useNotificationSocket(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let detachListener: (() => void) | null = null;

    const unsubscribeReady = onSocketReady((socket) => {
      function handleNew(notification: AppNotification) {
        queryClient.setQueryData<{ notifications: AppNotification[]; unreadCount: number } | undefined>(
          NOTIFICATIONS_KEY,
          (prev) => {
            if (!prev) return prev;
            if (prev.notifications.some((n) => n._id === notification._id)) return prev;
            return {
              ...prev,
              notifications: [notification, ...prev.notifications].slice(0, 20),
              unreadCount: prev.unreadCount + 1,
            };
          }
        );
      }
      socket.on('notification:new', handleNew);
      detachListener = () => socket.off('notification:new', handleNew);
    });

    return () => {
      unsubscribeReady();
      detachListener?.();
    };
  }, [isAuthenticated, queryClient]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
