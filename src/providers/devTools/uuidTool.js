const TRIGGER = /^uuid$/i;

export function uuidTool(query) {
    if (!TRIGGER.test(query.trim())) return null;
    const id = crypto.randomUUID();
    return {
        id: 'devtool-uuid',
        kind: 'devtool',
        title: id,
        subtitle: 'UUID v4 - Enter to copy . edit the query to generate a new one',
        copyValue: id,
    };
}