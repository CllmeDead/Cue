const TRIGGER = /^(?:count|words)\s+([\s\S]+)$/i;
const AVERAGE_WPM = 200;
export function wordCountTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const text = match[1];
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, '').length;
    const sentenceCount = (text.match(/[.!?]+(?=\s|$)/g) ?? []).length || (wordCount > 0 ? 1 : 0);
    const readingMinutes = Math.max(1, Math.round(wordCount / AVERAGE_WPM));
    const summary = `${wordCount} word${wordCount === 1 ? '' : 's'}`;
    return {
        id: 'devtool-word-count',
        kind: 'devtool',
        title: summary,
        subtitle: `${charCount} chars (${charCountNoSpaces} no spaces) · ${sentenceCount} sentence${sentenceCount === 1 ? '' : 's'} · ~${readingMinutes} min read`,
        copyValue: summary,
    };
}