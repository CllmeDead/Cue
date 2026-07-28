import { useEffect, useState } from 'react';

const POLL_MS = 1500;

export function useSystemStats(backendBaseUrl, active) {
    const [stats, setStats] = useState(null);
    const [processes, setProcesses] = useState([]);
    useEffect(() => {
        if (!active || !backendBaseUrl) return undefined;
        let cancelled = false;;
        const poll = async () => {
            try {
                const [statsRes, procRes] = await Promise.all([
                    fetch(`${backendBaseUrl}/system/stats`),
                    fetch(`${backendBaseUrl}/system/processes?limit=5`),
                ]);
                if (cancelled) return;
                setStats(await statsRes.json());
                setProcesses(await procRes.json());
            } catch {

            }
        };

        poll();
        const handle = setInterval(poll, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(handle);
        };
    }, [active, backendBaseUrl]);
    return { stats, processes };
}