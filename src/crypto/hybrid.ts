import { generateAESKey, encryptAES, decryptAES, exportAESKey, importAESKey } from './aes';
import { encryptWithPublicKey, decryptWithPrivateKey } from './rsa';
import type { EncryptedPayload } from '../types';

export async function hybridEncrypt(
    plaintext: string,
    recipientPublicKey: CryptoKey,
    senderPublicKey: CryptoKey
): Promise<EncryptedPayload> {
    // 1. Generate random AES key for this message
    const aesKey = await generateAESKey();

    // 2. Encrypt the message with AES-GCM
    const { ciphertext, iv } = await encryptAES(plaintext, aesKey);

    // 3. Export AES key to raw format
    const aesKeyRaw = await crypto.subtle.exportKey('raw', aesKey);

    // 4. Encrypt AES key with recipient's public key
    const encryptedKey = await encryptWithPublicKey(new Uint8Array(aesKeyRaw), recipientPublicKey);

    // 5. Encrypt the same AES key with sender's public key (for self-viewing)
    const encryptedKeyForSelf = await encryptWithPublicKey(new Uint8Array(aesKeyRaw), senderPublicKey);

    return {
        ciphertext,
        iv,
        encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
        encryptedKeyForSelf: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForSelf))),
    };
}

export async function hybridDecrypt(
    payload: EncryptedPayload,
    privateKey: CryptoKey,
    isOwnMessage: boolean
): Promise<string> {
    try {
        // 1. Choose the correct encrypted key
        const encryptedKeyBase64 = isOwnMessage ? payload.encryptedKeyForSelf : payload.encryptedKey;

        // 2. Convert from base64
        const encryptedKey = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));

        // 3. Decrypt the AES key with recipient's private key
        const aesKeyRaw = await decryptWithPrivateKey(encryptedKey, privateKey);

        // 4. Import the AES key
        const aesKey = await crypto.subtle.importKey(
            'raw',
            aesKeyRaw,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // 5. Decrypt the message
        const plaintext = await decryptAES(payload.ciphertext, payload.iv, aesKey);

        return plaintext;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Unable to decrypt message');
    }
}