import { api } from '../../lib/api';
import { ApiResponse, ChatMessage, DmThread } from '../../types';

/**
 * Mirrors the backend's buildDmChannelId exactly (sorted, colon-joined
 * pair of user ids) so the frontend can navigate straight to a DM thread
 * without a round-trip just to learn its channelId.
 */
export function dmChannelId(userIdA: string, userIdB: string): string {
  return `dm:${[userIdA, userIdB].sort().join(':')}`;
}

export function isDmChannel(channelId: string): boolean {
  return channelId.startsWith('dm:');
}

export async function listMessages(channelId: string, before?: string) {
  const { data } = await api.get<ApiResponse<ChatMessage[]>>(`/chat/${channelId}/messages`, {
    params: before ? { before } : undefined,
  });
  return data.data;
}

export async function sendMessage(channelId: string, text: string) {
  const { data } = await api.post<ApiResponse<ChatMessage>>(`/chat/${channelId}/messages`, { text });
  return data.data;
}

export async function listDmThreads() {
  const { data } = await api.get<ApiResponse<DmThread[]>>('/chat/dm-threads');
  return data.data;
}
