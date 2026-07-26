const cache = new Map();
const inFlight = new Map();

export async function getAppIconDataUrl(targetPath) {
    if (!window.cue || !targetPath) return null;
    if (cache.has(targetPath)) return cache.get(targetPath);
    const promise = window.cue
        .getFileIcon(targetPath)
        .then((dataUrl) => {
            cache.set(targetPath, dataUrl);
            inFlight.delete(targetPath);
            return dataUrl;
        })
        .catch(() => {
            inFlight.delete(targetPath);
            return null;
        });
    inFlight.set(targetPath, promise);
    return promise;
}