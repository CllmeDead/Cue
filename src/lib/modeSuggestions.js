export const MODE_SUGGESTIONS = {
    coding: [
        { label: 'case my variable name', example: 'case my variable name' },
        { label: 'color #3B82F6', example: 'color #3B82F6' },
        { label: 'regex /\\d+/g test123abc456', example: 'regex /\\d+/g test123abc456' },
        { label: 'uuid', example: 'uuid' },
        { label: 'json {"a":1}', example: 'json {"a":1}' },
    ],
    writing: [
        { label: 'count your draft', example: 'count ' },
        { label: 'lorem 50', example: 'lorem 50' },
    ],
    gaming: [
        { label: 'activity - check performance while playing', example: 'activity' },
        { label: 'dashboard', example: 'dashboard' },
    ],
    browsing: [
        { label: 'google <search>', example: 'google ' },
        { label: 'yt <search>', example: 'yt ' },
    ]
};
export function getModeSuggestions(modeId) {
    return MODE_SUGGESTIONS[modeId] ?? [];
}