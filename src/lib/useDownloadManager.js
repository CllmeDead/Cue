import { useCallback, useEffect, useRef, useState } from 'react';

const DOWNLOAD_TRIGGER = /^download\s+(https?:\/\/\S+)$/i;
const POLL_MS = 700;

export function parseDownloadQuery(query) {
    const match = query.trim().match(DOWNLOAD_TRIGGER);
    return match ? match[1] : null;
}
export function useDownloadManager(backendBaseUrl) {
    const [job, setJob] = useState(null);
    const pollRef = useRef(null);
    const stopPolling = useCallback(() => {
        clearInterval(pollRef.current);
    }, []);
    const startDownload = useCallback(
        async (url) => {
            if (!backendBaseUrl) return;
            const res = await fetch(`${backendBaseUrl}/downloads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            const created = await res.json();
            setJob(created);
        },
        [backendBaseUrl],
    );
    useEffect(() => {
        stopPolling();
        if (!job || job.status === 'finished' || job.status === 'error' || !backendBaseUrl) {
            return undefined;
        }
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${backendBaseUrl}/downloads/${job.id}`);
                setJob(await res.json());
            } catch {

            }
        }, POLL_MS);
        return stopPolling;
    }, [job?.id, job?.status, backendBaseUrl, stopPolling]);
    return { job, startDownload };
    }