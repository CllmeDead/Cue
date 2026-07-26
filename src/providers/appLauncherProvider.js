import Fuse from 'fuse.js';

export function buildAppSearchIndex(apps) {
    return new Fuse(apps, {
        keys: ['name'],
        threshold: 0.35,
        ignoreLocation: true,
    });
}
const MAX_RESULTS = 6;
export function searchApps(fuseIndex, query) {
    const trimmed = query.trim();
    if (!trimmed || !fuseIndex) return [];
    return fuseIndex
        .search(trimmed)
        .slice(0, MAX_RESULTS)
        .map(({ item }) => ({
            id: `app-${item.id}`,
            kind: 'app',
            title: item.name,
            subtitle: item.targetPath,
            iconPath: item.targetPath,
            launch: { targetPath: item.targetPath, arguments: item.arguments },
        }));
}
