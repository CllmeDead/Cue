import Fuse from 'fuse.js';
const MAX_RECENT = 5;
const MAX_SEARCH_RESULTS = 6;

function toResult(entry) {
    const preview = entry.content.length > 80 ? `${entry.content.slice(0, 80)}...` : entry.content;
    return {
        id: `clip-${entry.id}`,
        kind: 'clipboard',
        title: preview,
        subtitle: 'Clipboard history - Enter to copy',
        copyValue: entry.content,
        entryId: entry.id,
    };
}
export function searchClipboardHistory(entries, query) {
    const trimmed = query.trim();
    if (!trimmed) {
        return entries.slice(0, MAX_RECENT).map(toResult);
    }
    const fuse = new Fuse(entries, { keys: ['content'], threshold: 0.4,ignoreLocation: true });
    return fuse
        .search(trimmed)
        .slice(0, MAX_SEARCH_RESULTS)
        .map(({ item }) => toResult(item));
}