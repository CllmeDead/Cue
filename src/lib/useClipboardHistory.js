import { useEffect, useState, useCallback } from 'react';
const HISTORY_LIMIT = 100;

export function useClipboardHistory(backendBaseUrl, backendConnected, refreshTrigger) {
    const [entries, setEntries] = useState([]);
    const refresh = useCallback(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/clipboard-history?limit=${HISTORY_LIMIT}`)
            .then((res) => res.json())
            .then(setEntries)
            .catch(() => {

            });
    }, [backendBaseUrl, backendConnected]);
    const deleteEntry = useCallback((entryId) => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/clipboard-history/${entryId}`, { method: 'DELETE' })
            .then(refresh)
            .catch(() => {});
    }, [backendBaseUrl, backendConnected, refresh]);
    useEffect(() => {
        refresh();
    }, [refresh, refreshTrigger]);
    return { entries, refresh, deleteEntry };
}