import { useCallback, useEffect, useState } from 'react';

const ADD_TRIGGER = /^snippet\s+add\s+([^:]+):\s*([\s\S]+)$/i;
const BARE_TRIGGER = /^snippets?(?:\s+(.*))?$/i;

export function parseSnippetQuery(query) {
    const trimmed = query.trim();
    const addMatch = trimmed.match(ADD_TRIGGER);
    if (addMatch) {
        const [, name, content] = addMatch;
        return { mode: 'add', name: name.trim(), content: content.trim() };
    }
    const bareMatch = trimmed.match(BARE_TRIGGER);
    if (bareMatch) {
        return { mode: 'list', search: (bareMatch[1] ?? '').trim() };
    }
    return null;
}

export function useSnippets(backendBaseUrl, backendConnected, refreshTrigger) {
    const [items, setItems] = useState([]);
    const refresh = useCallback(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/snippets`)
            .then((res) => res.json())
            .then(setItems)
            .catch(() => {

            });
    }, [backendBaseUrl, backendConnected]);
    useEffect(() => {
        refresh();
    }, [refresh, refreshTrigger]);
    const saveSnippet = useCallback(
        async (name, content) => {
            await fetch(`${backendBaseUrl}/snippets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content }),
            });
            refresh();
        },
        [backendBaseUrl, refresh],
    );
    const removeSnippet = useCallback(
        async (id) => {
            await fetch(`${backendBaseUrl}/snippets/${id}`, { method: 'DELETE' });
            refresh();
        },
        [backendBaseUrl, refresh],
    );
    return { items, saveSnippet, removeSnippet, refresh };
}