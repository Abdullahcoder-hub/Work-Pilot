import { api } from '../../lib/api';
import { AiChatMessage, ApiResponse } from '../../types';

export async function getHistory() {
  const { data } = await api.get<ApiResponse<AiChatMessage[]>>('/ai/history');
  return data.data;
}

export async function clearHistory() {
  await api.delete('/ai/history');
}

export async function sendChat(message: string, attachedFileId?: string) {
  const { data } = await api.post<ApiResponse<{ reply: string; message: AiChatMessage }>>('/ai/chat', {
    message,
    ...(attachedFileId ? { attachedFileId } : {}),
  });
  return data.data;
}
