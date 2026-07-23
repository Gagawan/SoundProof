import { apiClient } from './client';
import type { MessagesPage } from './types';

export async function getMessages(roomId: string, cursor?: string): Promise<MessagesPage> {
  const { data } = await apiClient.get<MessagesPage>(`/rooms/${roomId}/messages`, {
    params: cursor ? { cursor } : undefined,
  });
  return data;
}
