const NOW_TRIGGER = /^now$/i;
const TS_TRIGGER = /^ts\s+(-?\d+)$/i;

function formatDate(date) {
    return {
        iso: date.toISOString(),
        local: date.toString(),
    };
}
export function timestampTool(query) {
    const trimmed = query.trim();
    if (NOW_TRIGGER.test(trimmed)) {
        const now = new Date();
        const seconds = Math.floor(now.getTime() / 1000);
        const { iso, local } = formatDate(now);
        return {
            id: 'devtool-now',
            kind: 'devtool',
            title: String(seconds),
            subtitle: `${local} - Enter to copy unix seconds`,
            copyValue: String(seconds),
            preview: `Unix (s): ${seconds}\nUnix (mx): ${now.getTime()}\nISO: ${iso}\nLocal: ${local}`,
        };
    }
    const match = trimmed.match(TS_TRIGGER);
    if (match) {
        const raw = Number(match[1]);
        const ms = Math.abs(raw) > 1e11 ? raw : raw * 1000;
        const date = new Date(ms);
        if (Number.isNaN(date.getTime())) {
            return {
                id: 'devtool-ts-invalid',
                kind: 'devtool',
                title: 'Invalid timestamp',
                subtitle: 'Could not convert that number to a date',
                copyValue: null,
                isError: true,
            };
        }
        const { iso, local } = formatDate(date);
        return {
            id: 'devtool-ts',
            kind: 'devtool',
            title: local,
            subtitle: `${iso} - Enter to copy ISO string`,
            copyValue: iso,
        };
    }
    return null;
}