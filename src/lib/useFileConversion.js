import { useCallback, useState } from 'react';

const SUPPORTED_FORMATS = ['png', 'jpg', 'webp'];

export function useFileConversion(backendBaseUrl) {
    const [pickedFile, setPickedFile] = useState(null);
    const [converting, setConverting] = useState(false);
    const [convertedPath, setConvertedPath] = useState(null);
    const pickFile = useCallback(async () => {
        const path = await window.cue?.pickFile({
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
        });
        if (path) {
            const ext = path.split('.').pop()?.toLowerCase();
            setPickedFile({ path, ext });
            setConvertedPath(null);
        }
    }, []);
    const convertTo = useCallback(
        async (targetFormat) => {
            if (!pickedFile || !backendBaseUrl) return null;
            setConverting(true);
            try {
                const res = await fetch(`${backendBaseUrl}/convert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_path: pickedFile.path, target_format: targetFormat }),
                });
                if (!res.ok) throw new Error('Conversion failed');
                const { output_path } = await res.json();
                setConvertedPath(output_path);
                return output_path;
            } finally {
                setConverting(false);
            }
        },
        [pickedFile, backendBaseUrl],
    );
    const reset = useCallback(() => {
        setPickedFile(null);
        setConvertedPath(null);
    }, []);
    const  availableFormats = pickedFile
        ? SUPPORTED_FORMATS.filter((f) => f !== pickedFile.ext && !(f === 'jpg' && pickedFile.ext === 'jpeg'))
        : [];
    return { pickedFile, availableFormats, converting, convertedPath, pickFile, convertTo, reset };
}