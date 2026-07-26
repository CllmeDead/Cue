import * as Icons from 'lucide-react';
import { useContextSocket } from '../lib/useContextSocket.js';
import { getModeById } from '../modes/modeConfig.js';
export default function CueBar() {
    const { modes, currentModeId, backendConnected } = useContextSocket();
    const mode = getModeById(modes, currentModeId);
    const Icon = Icons[mode.icon] ?? Icons.Circle;
    return (
        <button
            type="button"
            onClick={() => window.cue?.toggleOverlay()}
            className="flex h-full w-full items-center justify-center gap-1.5 rounded-full px-3 font-sans"
            style={{
                background: 'rgb(18 18 24 / 0.7)',
                border: '1px solid rgb(255 255 255 / 0.08)',
                backdropFilter: 'blur(20px)',
            }}
            title={`${mode.name} mode - click to open Cue`}
        >
            <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: `${mode.accentColor}22` }}
            >
                <Icon size={11} color={mode.accentColor} strokeWidth={2.5} />
            </span>
            <span className="text-[11px] font-medium text-cue-text">{mode.name}</span>
            <span
                className="h-1 w-1 rounded-full"
                style={{ background: backendConnected ? '#22C55E' : '#8B8FA3' }}
            />
        </button>
    );
}