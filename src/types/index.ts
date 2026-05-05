export interface User {
    id: string;
    username: string;
    display_name: string;
    public_key: string;
    created_at: string;
}

export interface EncryptedPayload {
    ciphertext: string;      // base64
    iv: string;              // base64
    encryptedKey: string;    // base64
    encryptedKeyForSelf: string; // base64
}

export interface Message {
    id: string;
    from_user_id: string;
    to_user_id: string;
    payload: EncryptedPayload;
    decryptedText?: string;
    created_at: string;
    delivered: boolean;
}

export interface Conversation {
    user_id: string;
    display_name: string;
    username: string;
    last_message_at: string | null;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
        id: string;
        username: string;
        display_name: string;
        public_key: string;
        wrapped_private_key: string;
        pbkdf2_salt: string;
        created_at: string;
    };
}