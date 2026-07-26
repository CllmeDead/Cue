const TRIGGER = /^case\s+(.+)$/i;
function toWords(input) {
    return input
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.toLowerCase());
}
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
export function caseConvertTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const words = toWords(match[1]);
    if(words.length === 0) return null;
    const variables = [
        { label: 'camelCase', value: words[0] + words.slice(1).map(capitalize).join('') },
        { label: 'PascalCase', value: words.map(capitalize).join('') },
        { label: 'snake_case', value: words.join('_') },
        { label: 'kebab-case', value: words.join('-') },
        { label: 'CONSTANT_CASE', value: words.join('_').toUpperCase() },
        { label: 'Title Case', value: words.map(capitalize).join(' ') },
    ];
    return variables.map((v, i) => ({
        id: `devtool-case-4${i}`,
        kind: 'devtool',
        title: v.value,
        subtitle: `${v.label} - Enter to copy`,
        copyValue: v.value,
    }));
}