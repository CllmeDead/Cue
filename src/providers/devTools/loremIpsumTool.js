const TRIGGER = /^lorem\s+(\d+)$/i;
const MAX_WORDS = 500;
const WORD_BANK = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];
export function loremIpsumTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const count = Math.min(parseInt(match[1], 10), MAX_WORDS);
    if (count <= 0) return null;
    const words = [];
    for (let i = 0; i < count; i += 1) {
        words.push(i === 0 ? 'Lorem' : WORD_BANK[i % WORD_BANK.length]);
    }
    const text = words.join(' ') + '.';
    return {
        id: 'devtool-lorem',
        kind: 'devtool',
        title: text.length > 100 ? `${text.slice(0, 100)}...` : text,
        subtitle: `${count} words - Enter to copy`,
        copyValue: text,
    };
}