import { useEffect, useState } from 'react';
import { buildAppSearchIndex } from '../providers/appLauncherProvider.js';
export function useApps(backendBaseUrl, backendConnected) {
    const [appsFuse, setAppsFuse] = useState(null);
    useEffect(() => {
        if (!backendConnected || !backendBaseUrl) return;
        let cancelled = false;
        fetch (`${backendBaseUrl}/apps`)
            .then((res) => res.json())
            .then((apps) => {
                if (cancelled) return;
                setAppsFuse(buildAppSearchIndex(apps));
            })
            .catch(() => {

            })
        return () => {
            cancelled = true;
        };
    }, [backendBaseUrl, backendConnected]);
    return appsFuse;
}