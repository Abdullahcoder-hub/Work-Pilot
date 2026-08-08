import { api } from '../../lib/api';
import { ApiResponse, ChatAttachment, FileLibraryItem, Pagination } from '../../types';

export async function uploadFile(file: File): Promise<ChatAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  // No explicit Content-Type header here on purpose — axios sets
  // multipart/form-data with the correct boundary parameter automatically
  // when the body is a FormData instance. Setting it manually overrides
  // that and breaks the boundary, which makes multer fail to parse the
  // request on the backend.
  const { data } = await api.post<ApiResponse<ChatAttachment>>('/files/upload', formData);
  return data.data;
}

/**
 * The download endpoint requires the same JWT auth as every other API
 * call, so a plain `<a href>` won't work — the browser wouldn't attach
 * the Authorization header on a bare navigation. Fetches the file
 * through the authenticated axios instance instead and triggers the
 * browser's save dialog from the resulting blob.
 */
export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function listFiles(params?: { search?: string; page?: number; limit?: number }) {
  const { data } = await api.get<ApiResponse<FileLibraryItem[]> & { pagination: Pagination }>('/files', { params });
  return { files: data.data, pagination: data.pagination };
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}
