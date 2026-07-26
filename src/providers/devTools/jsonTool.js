const TRIGGER = /^json\s+([\s\S]+)$/i;

export function jsonTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const input = match[1];
    try {
        const parsed = JSON.parse(input);
        const pretty = JSON.stringify(parsed, null, 2);
        const type = Array.isArray(parsed) ? 'array' : typeof parsed;
        return {
            id: 'devtool-json-valid',
            kind: 'devtool',
            title: `Valid JSON (${type})`,
            subtitle: 'Enter to copy formatted (2-space indent)',
            copyValue: pretty,
            preview: pretty,
        };
    } catch (err) {
        return {
            id: 'devtool-json-invalid',
            kind: 'devtool',
            title: 'Invalid JSON',
            subtitle: err.message,
            copyValue: null,
            isError: true,
        };
    }
}