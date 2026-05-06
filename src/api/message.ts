import api from './client';
import type { Message, EncryptedPayload, Conversation } from '../types';

export async function sendMessage(toUserId: string, payload: EncryptedPayload): Promise<Message> {
    const response = await api.post('/messages', { to: toUserId, payload });
    return response.data;
}

export async function getConversations(): Promise<Conversation[]> {
    const response = await api.get('/conversations');
    return response.data;
}

export async function getMessages(
    userId: string,
    before?: string,
    limit: number = 50
): Promise<Message[]> {
    const params: Record<string, string | number> = { limit };
    if (before) params.before = before;

    const response = await api.get(`/conversations/${userId}/messages`, { params });
    return response.data;
}