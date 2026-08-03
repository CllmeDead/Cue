import { useCallback, useEffect, useState } from 'react';

export function useUsageRanking(backendBaseUrl, backendConnected, modeId) {
    const [topTriggers, setTopTriggers] = useState([]);
    useEffect(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/usage/top?mode_id=${encodeURIComponent(modeId)}&limit=3`)
            .then((res) => res.json())
            .then(setTopTriggers)
            .catch(() => {
                setTopTriggers([]);
            });
    }, [backendBaseUrl, backendConnected, modeId]);
    const recordUsage = useCallback(
        (triggerKey) => {
            if (!triggerKey || !backendBaseUrl) return;
            fetch(`${backendBaseUrl}/usage/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger_key: triggerKey, mode_id: modeId }),
            }).catch(() => {

            });
        },
        [backendBaseUrl, modeId],
    );
    return { topTriggers, recordUsage };
}