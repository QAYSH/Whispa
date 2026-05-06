export async function generateRSAKeyPair(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}> {
    return crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        'spki',
        keyData,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}

export async function encryptWithPublicKey(
    data: Uint8Array,
    publicKey: CryptoKey
): Promise<ArrayBuffer> {
    // Convert Uint8Array to ArrayBuffer safely
    const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    return crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        dataBuffer
    );
}

export async function decryptWithPrivateKey(
    encryptedData: ArrayBuffer,
    privateKey: CryptoKey
): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedData
    );
}