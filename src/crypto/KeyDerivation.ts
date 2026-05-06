export async function deriveWrappingKey(
    password: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Convert Uint8Array to ArrayBuffer safely
    const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: 100000,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-KW', length: 256 },
        false,
        ['wrapKey', 'unwrapKey']
    );
}

export async function wrapPrivateKey(
    privateKey: CryptoKey,
    wrappingKey: CryptoKey
): Promise<string> {
    const wrapped = await crypto.subtle.wrapKey(
        'pkcs8',
        privateKey,
        wrappingKey,
        'AES-KW'
    );
    return btoa(String.fromCharCode(...new Uint8Array(wrapped)));
}

export async function unwrapPrivateKey(
    wrappedKeyBase64: string,
    wrappingKey: CryptoKey
): Promise<CryptoKey> {
    const wrappedKey = Uint8Array.from(atob(wrappedKeyBase64), c => c.charCodeAt(0));

    return crypto.subtle.unwrapKey(
        'pkcs8',
        wrappedKey,
        wrappingKey,
        'AES-KW',
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
    );
}