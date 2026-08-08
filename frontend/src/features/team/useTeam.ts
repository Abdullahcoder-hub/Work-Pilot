import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as teamApi from './teamApi';
import * as authApi from '../auth/authApi';

const TEAM_KEY = ['team'];

export function useTeam() {
  return useQuery({ queryKey: TEAM_KEY, queryFn: teamApi.listTeam });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.inviteUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      teamApi.setUserActive(userId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEAM_KEY });
    },
  });
}
