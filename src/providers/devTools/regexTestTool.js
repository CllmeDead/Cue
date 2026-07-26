const TRIGGER = /^regex\s+\/(.+)\/([a-z]*)\s+([\s\S]+)$/i;
export function regexTestTool(query) {
    const match = query.match(TRIGGER);
    if (!match) return null;
    const [, pattern, flags, testString] = match;
    let re;
    try {
        re = new RegExp(pattern, flags);
    } catch (err) {
        return {
            id: 'devtool-regex-invalid',
            kind: 'devtool',
            title: 'Invalid regex',
            subtitle: err.message,
            copyValue: null,
            isError: true,
        };
    }
    if (flags.includes('g')) {
        const allMatches = [...testString.matchAll(re)].map((m) => m[0]);
        if (allMatches.length === 0) {
            return {
                id: 'devtool-regex-nomatch',
                kind: 'devtool',
                title: 'No matches',
                subtitle: `/${pattern}/${flags}`,
                copyValue: null,
            };
        }
        return {
            id: 'devtool-regex-matches',
            kind: 'devtool',
            title: `${allMatches.length} match${allMatches.length === 1 ? '' : 'es'}: ${allMatches.join(', ')}`,
            subtitle: 'Enter to copy all matches (Comma separated)',
            copyValue: allMatches.join(', '),
        };
    }
    const single = testString.match(re);
    if (!single) {
        return {
            id: 'devtool-regex-nomatch',
            kind: 'devtool',
            title: 'No match',
            subtitle: `/${pattern}/${flags}`,
            copyValue: null,
        };
    }
    const groups = single.slice(1).filter((g) => g !== undefined);
    return {
        id: 'devtool-regex-match',
        kind: 'devtool',
        title: single[0],
        subtitle: groups.length ? `Groups: ${groups.join(', ')} - Enter to copy match` : 'Enter to copy match',
        copyValue: single[0],
    };
}