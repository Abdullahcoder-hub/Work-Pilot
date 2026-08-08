import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as filesApi from './filesApi';

const LIST_KEY = (params?: Record<string, unknown>) => ['files', 'list', params ?? {}];

export function useFiles(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: LIST_KEY(params), queryFn: () => filesApi.listFiles(params) });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => filesApi.uploadFile(file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => filesApi.deleteFile(fileId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ fileId, fileName }: { fileId: string; fileName: string }) => filesApi.downloadFile(fileId, fileName),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Download failed'),
  });
}
