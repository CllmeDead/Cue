import { runDevTools } from '../providers/devToolsProvider.js';
import { evaluateMathQuery } from '../providers/mathProvider.js';
import { searchApps } from '../providers/appLauncherProvider.js';
import { searchClipboardHistory } from '../providers/clipboardProvider.js';

/**
 * @param {object} args
 * @param {string} args.query
 * @param {import('fuse.js').default | null} args.appsFuse
 * @param {Array<{id:number, content:string}>} args.clipboardEntries
 */
export function routeQuery({ query, appsFuse, clipboardEntries }) {
    const trimmed = query.trim();
    const devToolResults = runDevTools(trimmed);
    if (devToolResults.length > 0) return devToolResults;
    if (!trimmed) {
        return searchClipboardHistory(clipboardEntries, '');
    }
    const mathResult = evaluateMathQuery(trimmed);
    const appResults = searchApps(appsFuse, trimmed);
    const clipboardResults = searchClipboardHistory(clipboardEntries, trimmed);
    return [...(mathResult ? [mathResult] : []), ...appResults, ...clipboardResults];
}