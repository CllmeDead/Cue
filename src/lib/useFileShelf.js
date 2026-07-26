import { useCallback, useEffect, useState } from 'react';

export function useFileShelf(backendBaseUrl, backendConnected, active) {
    const [items, setItems] = useState([]);

    const refresh = useCallback(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/shelf`)
            .then((res) => res.json())
            .then(setItems)
            .catch(() => {});
    }, [backendBaseUrl, backendConnected]);

    useEffect(() => {
        if (active) refresh();
    }, [active, refresh]);

    const addFilesToShelf = useCallback(async () => {
        const paths = await window.cue?.pickFile({ multiple: true });
        if (!paths?.length) return;
        for (const path of paths) {
            await fetch(`${backendBaseUrl}/shelf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path }),
            });
        }
        refresh();
    }, [backendBaseUrl, refresh]);

    const removeFromShelf = useCallback(async (id) => {
        await fetch(`${backendBaseUrl}/shelf/${id}`, { method: 'DELETE' });
        refresh();
    }, [backendBaseUrl, refresh]);

    return { items, addFilesToShelf, removeFromShelf };
}