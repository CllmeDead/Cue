import { useEffect, useRef, useState } from 'react';

const CURRENCY_PATTERN = /^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]{3})\s+(?:to|in)\s+([a-zA-Z]{3})$/i;
const DEBOUNCE_MS = 350;

export function useCurrencySymbols(backendBaseUrl, backendConnected) {
    const [symbols, setSymbols] = useState(null);
    useEffect(() => {
        if (!backendConnected || !backendBaseUrl) return;
        fetch(`${backendBaseUrl}/currency/symbols`)
            .then((res) => res.json())
            .then(setSymbols)
            .catch(() => {

            });
    }, [backendBaseUrl, backendConnected]);
    return symbols;
}
export function parseCurrencyQuery(query, symbols) {
    if (!symbols) return null;
    const match = query.trim().match(CURRENCY_PATTERN);
    if (!match) return null;
    const [, amountStr, from, to] = match;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    if (!(fromUpper in symbols) || !(toUpper in symbols)) return null;
    return { amount: parseFloat(amountStr), from: fromUpper, to: toUpper };
}
export function useCurrencyConversion(backendBaseUrl, parsed) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!parsed || !backendBaseUrl) {
            setResult(null);
            setLoading(false);
            return undefined;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({
                    amount: String(parsed.amount),
                    from_currency: parsed.from,
                    to_currency: parsed.to,
                });
                const res = await fetch(`${backendBaseUrl}/currency/convert?${params}`);
                if (!res.ok) throw new Error('Conversion failed');
                setResult(await res.json());
            } catch {
                setResult(null);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [backendBaseUrl, parsed?.amount, parsed?.from, parsed?.to]);
    return { result, loading };
}