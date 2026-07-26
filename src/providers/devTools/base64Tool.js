const TRIGGER = /^(?:base64|b64)\s+(.+)$/is;
function encodeUtf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}
function decodeBase64ToUtf8(b64) {
    const binary = atob(b64.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
export function base64Tool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const input = match[1];
    const results = [];
    try {
        const decoded = decodeBase64ToUtf8(input);
        results.push({
            id: 'devtool-base-64-decode',
            kind: 'devtool',
            title: decoded,
            subtitle: 'Decoded from base64 - Enter to copy',
            copyValue: decoded,
        });
    } catch {
    }
    return results;
}
