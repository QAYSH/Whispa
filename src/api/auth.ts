import api from './client';
import type { AuthResponse } from '../types';
import { generateRSAKeyPair, exportPublicKey } from '../crypto/rsa';
import { deriveWrappingKey, wrapPrivateKey } from '../crypto/KeyDerivation.ts';

export async function register(
    username: string,
    displayName: string,
    password: string
): Promise<AuthResponse> {
    // Generate RSA keypair
    const { publicKey, privateKey } = await generateRSAKeyPair();

    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    // Derive wrapping key from password
    const wrappingKey = await deriveWrappingKey(password, salt);

    // Wrap private key
    const wrappedPrivateKey = await wrapPrivateKey(privateKey, wrappingKey);

    // Export public key
    const publicKeyBase64 = await exportPublicKey(publicKey);

    const response = await api.post('/auth/register', {
        username,
        display_name: displayName,
        password,
        public_key: publicKeyBase64,
        wrapped_private_key: wrappedPrivateKey,
        pbkdf2_salt: saltBase64,
    });

    return response.data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { username, password });
    const data = response.data;

    // Store tokens
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('refresh_token', data.refresh_token);

    return data;
}

export async function logout(): Promise<void> {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
    }
    sessionStorage.clear();
}

export async function getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await api.get('/auth/me');
    return response.data;
}