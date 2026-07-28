import { useCallback, useState } from 'react';

const COMMANDS = {
    lock: { label: 'Lock this PC', destructive: false },
    sleep: { label: 'Sleep', destructive: false },
    restart: { label: 'Restart this PC', destructive: true },
    shutdown: { label: 'Shut down this PC', destructive: true },
    signout: { label: 'Sign out', destructive: true },
};

export function parseSystemCommand(query) {
    const key = query.trim().toLowerCase();
    const entry = COMMANDS[key];
    return entry ? { command: key, ...entry } : null;
}

export function useSystemCommands() {
    const [armed, setArmed] = useState(null);
    const trigger = useCallback(
        (command, destructive) => {
            if (!destructive || armed === command) {
                window.cue?.systemCommand(command);
                setArmed(null);
                return true;
            }
            setArmed(command);
            return false;
        },
        [armed],
    );
    const resetArmed = useCallback(() => setArmed(null), []);
    return { armed, trigger, resetArmed };
}