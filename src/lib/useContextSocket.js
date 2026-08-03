import { useEffect, useRef, useState, useCallback } from 'react';
import { DEFAULT_MODES, DEFAULT_MODE_ID } from '../modes/modeConfig.js';

export function useContextSocket() {
    const [modes, setModes] = useState(DEFAULT_MODES);
    const [currentModeId, setCurrentModeId] = useState(DEFAULT_MODE_ID);
    const [detectedApp, setDetectedApp] = useState(null);
    const [backendConnected, setBackendConnected] = useState(false);
    const [backendBaseUrl, setBackendBaseUrl] = useState(null);
    const wsRef = useRef(null);
    const connect = useCallback(async () => {
        if (!window.cue) return;
        const baseUrl = await window.cue.getBackendBaseUrl();
        setBackendBaseUrl(baseUrl);
        const wsUrl = baseUrl.replace('http', 'ws') + '/ws/context';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => setBackendConnected(true);
        ws.onclose = () => {
            setBackendConnected(false);
            setTimeout(connect, 1500);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if ('mode_id' in payload) setCurrentModeId(payload.mode_id);
                if ('app_name' in payload) setDetectedApp(payload.app_name);
                if (Array.isArray(payload.modes)) setModes(payload.modes);
            } catch {

            }
        };
    }, []);
    useEffect(() => {
        if (!window.cue) return undefined;
        const offReady = window.cue.onBackendReady(() => connect ());
        window.cue.isBackendReady().then((ready) => {
            if (ready) connect();
        });
        return () => {
            offReady();
            wsRef.current?.close();
        };
    }, [connect]);
    return { modes, currentModeId, detectedApp, backendConnected, backendBaseUrl };
}