import api from './client';
import type { Message, Conversation, EncryptedPayload } from '../types';

export async function sendMessage(toUserId: string, payload: EncryptedPayload): Promise<Message> {
    const response = await api.post('/messages', { to: toUserId, payload });
    return response.data;
}

// NOTE: No /conversations endpoint exists in backend
// We'll track conversations locally

export async function getMessages(
    userId: string,
    before?: string,
    limit: number = 50
): Promise<Message[]> {
    const params: any = { limit };
    if (before) params.before = before;

    const response = await api.get(`/conversations/${userId}/messages`, { params });
    return response.data;
}