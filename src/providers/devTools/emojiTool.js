import Fuse from 'fuse.js';
import { EMOJI_LIST } from '../../data/emojiList';

const TRIGGER = /^(?:emoji\s+|:)(.+)$/i;
const MAX_RESULTS = 8;
const fuse = new Fuse(EMOJI_LIST, {
    keys: ['name', 'keywords'],
    threshold: 0.4,
    ignoreLocation: true,
});

export function emojiTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const search = match[1].trim();
    if (!search) return null;
    const matches = fuse.search(search).slice(0, MAX_RESULTS);
    if (!matches.length === 0) return null;
    return matches.map(({ item }, i) => ({
        id: `devtool-emoji-${i}`,
        kind: 'emoji',
        title: item.char,
        subtitle: `${item.name} - Enter to copy`,
        copyValue: item.char,
    }));
}