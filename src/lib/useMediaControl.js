const MEDIA_COMMANDS = {
    play: { action: 'play_pause', label: 'Play / Pause' },
    pause: { action: 'play_pause', label: 'Play / Pause' },
    next: { action: 'next', label: 'Next Track' },
    previous: { action: 'previous', label: 'Previous Track' },
    prev: { action: 'previous', label: 'Previous Track' },
    'volume up': { action: 'volume_up', label: 'Volume up' },
    'volume down': { action: 'volume_down', label: 'Volume down' },
    mute: { action: 'mute', label: 'Mute / unmute volume' },
};

export function parseMediaCommand(query) {
    const key = query.trim().toLowerCase();
    const entry = MEDIA_COMMANDS[key];
    return entry ? { command: key, ...entry } : null;
}

export async function sendMediaCommand(backendBaseUrl, action) {
    if (!backendBaseUrl) return false;
    try {
        const res = await fetch(`${backendBaseUrl}/media/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        });
        return res.ok;
    } catch {
        return false;
    }
}