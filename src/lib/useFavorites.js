import { useCallback, useEffect, useState } from 'react';

export function useFavorites(backendBaseUrl, backendConnected) {
    const [favorites, setFavorites] = useState([]);
    const refresh = useCallback(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/favorites`)
            .then((res) => res.json())
            .then(setFavorites)
            .catch(() => {});
    }, [backendBaseUrl, backendConnected]);
    useEffect(() => { refresh(); }, [refresh]);

    const addFavorite = useCallback(async (app) => {
        await fetch(`${backendBaseUrl}/favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: app.id, name: app.name, targetPath: app.targetPath, arguments: app.arguments ?? '' }),
        });
        refresh();
    }, [backendBaseUrl, refresh]);

    const removeFavorite = useCallback(async (appId) => {
        await fetch(`${backendBaseUrl}/favorites/${appId}`, { method: 'DELETE' });
        refresh();
    }, [backendBaseUrl, refresh]);
    return { favorites, addFavorite, removeFavorite };
}