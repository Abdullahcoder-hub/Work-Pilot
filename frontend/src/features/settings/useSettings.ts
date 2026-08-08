import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from './settingsApi';

export function useMyCompanySettings() {
  return useQuery({ queryKey: ['company', 'me'], queryFn: settingsApi.getMyCompany });
}

export function useUpdateMyCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => settingsApi.updateMyCompany(name),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['company', 'me'] }),
  });
}

export function useUpdateProfile() {
  return useMutation({ mutationFn: (name: string) => settingsApi.updateProfile(name) });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      settingsApi.changePassword(currentPassword, newPassword),
  });
}
