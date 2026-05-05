import api from './client';
import type { User } from '../types';

export async function searchUsers(query: string): Promise<User[]> {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
}

export async function getUserPublicKey(userId: string): Promise<string> {
    const response = await api.get(`/users/${userId}/public-key`);
    return response.data.public_key;
}