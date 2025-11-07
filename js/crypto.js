/**
 * Generates a high-entropy random string.
 */
export function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Hashes a string using SHA-256 (required for PKCE).
 */
export async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(hashBuffer);
}

/**
 * Encodes a buffer into a Base64 URL-safe string.
 */
function base64urlEncode(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
