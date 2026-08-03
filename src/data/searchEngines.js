export const SEARCH_ENGINES = {
    google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    g: (q) => SEARCH_ENGINES.google(q),
    ddg: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
    duckduckgo: (q) => SEARCH_ENGINES.ddg(q),
    yt: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    youtube: (q) => SEARCH_ENGINES.yt(q),
    gh: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
    github: (q) => SEARCH_ENGINES.gh(q),
    so: (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
    stackoverflow: (q) => SEARCH_ENGINES.so(q),
    wiki: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
    wikipedia: (q) => SEARCH_ENGINES.wiki(q),
    npm: (q) => `https://www.npmjs.com/search?q=${encodeURIComponent(q)}`,
    amazon: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    amzn: (q) => SEARCH_ENGINES.amazon(q),
};

const TRIGGER = new RegExp(`^(${Object.keys(SEARCH_ENGINES).join('|')})\\s+(.+)$`, 'i');

export function parseWebSearchQuery(query) {
    const match = query.trim().match(TRIGGER);
    if (!match) return null;
    const [, prefix, search] = match;
    const buildUrl = SEARCH_ENGINES[prefix.toLowerCase()];
    return { prefix: prefix.toLowerCase(), search, url: buildUrl(search) };
}