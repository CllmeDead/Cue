import { useEffect, useRef, useState } from 'react';

export default function CameraPreview() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((stream) => {
                if(cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            });
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, []);
    if (error) {
        return (
            <div className="mt-3 rounded-lg bg-white/5 px-3 py-4 text-center text-xs text-red-400">
                Couldn't access camera: {error}
            </div>
        );
    }
    return (
        <div className="mt-3 overflow-hidden rounded-lg bg-black/40">
            <video ref={videoRef} autoPlay muted playsInline className="h-48 w-full object-cover" />
        </div>
    );
}