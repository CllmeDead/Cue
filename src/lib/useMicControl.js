import { useCallback, useEffect, useState } from 'react';

export function isMicCommand(query) {
    return query.trim().toLowerCase() === 'mic';
}

export function useMicStatus(backendBaseUrl, active) {
    const [muted, setMuted] = useState(null);
    const [error, setError] = useState(null);
    const refresh = useCallback(() => {
        if (!backendBaseUrl) return;
        fetch(`${backendBaseUrl}/call/mic-status`)
            .then((res) => {
                if (!res.ok) throw new Error('unavailable');
                return res.json();
            })
            .then((data) => { setMuted(data.muted); setError(null); })
            .catch(() => setError('Microphone control unavailable'))
    }, [backendBaseUrl]);

    useEffect(() => {
        if (!active || !backendBaseUrl) return;
        refresh();
    }, [active, backendBaseUrl, refresh]);

    const toggle = useCallback(async () => {
        if (!backendBaseUrl) return;
        try {
            const res = await fetch(`${backendBaseUrl}/call/mic-toggle`, { method: 'POST' });
            if (!res.ok) throw new Error('unavailable');
            const data = await res.json();
            setMuted(data.muted);
            setError(null);
        } catch {
            setError('Microphone control unavailable');
        }
    }, [backendBaseUrl]);
    return { muted, error, toggle };
}