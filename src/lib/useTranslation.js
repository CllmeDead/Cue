import { useEffect, useRef, useState } from 'react';
import { resolveLanguageCode } from './languageCodes.js';

const WITH_SOURCE = /^(?:translate|tr)\s+(.+?)\s+from\s+(\w+)\s+to\s+(\w+)$/i;
const DEFAULT_SOURCE = /^(?:translate|tr)\s+(.+?)\s+to\s+(\w+)$/i;
const DEBOUNCE_MS = 400;

export function parseTranslateQuery(query) {
    const trimmed = query.trim();
    const withSource = trimmed.match(WITH_SOURCE);
    if (withSource) {
        const [, text, sourceLang, targetLang] = withSource;
        const source = resolveLanguageCode(sourceLang);
        const target = resolveLanguageCode(targetLang);
        if (!source || !target) return null;
        return { text, source, target };
    }
    const defaultSource = trimmed.match(DEFAULT_SOURCE);
    if (defaultSource) {
        const [, text, targetLang] = defaultSource;
        const target = resolveLanguageCode(targetLang);
        if (!target) return null;
        return { text, source: 'en', target };
    }
    return null;
}
export function useTranslation(backendBaseUrl, parsed) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!parsed || !backendBaseUrl) {
            setResult(null);
            setLoading(false);
            setError(null);
            return undefined;
        }
        setLoading(true);
        setError(null);
        debounceRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    text: parsed.text,
                    source: parsed.source,
                    target: parsed.target,
                });
                const res = await fetch(`${backendBaseUrl}/translate?${params}`);
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.detail ?? 'Translation failed');
                }
                setResult(await res.json());
            } catch (err) {
                setResult(null);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [backendBaseUrl, parsed?.text, parsed?.source, parsed?.target]);
    return { result, loading, error };
}