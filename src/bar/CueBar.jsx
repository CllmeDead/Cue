import { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { useContextSocket } from '../lib/useContextSocket.js';
import { useSystemStats } from '../lib/useSystemStats.js';
import { useFileShelf } from '../lib/useFileShelf.js';
import { useFavorites } from '../lib/useFavorites.js';
import { getAppIconDataUrl } from '../lib/iconCache.js';
import { getModeById } from '../modes/modeConfig.js';

const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function FavoriteIcon({ app }) {
    const [ src, setSrc] = useState(null);
    useEffect(() => {
        let cancelled = false;
        getAppIconDataUrl(app.targetPath).then((s) => { if (!cancelled) setSrc(s); });s
        return () => { cancelled = true; };
    }, [app.targetPath]);
    return src ? <img src={src} alt="" className="h-7 w-7 rounded-[7px]" /> : <Icons.AppWindow size={16} className="text-cue-text-dim" />;
}

export default function CueBar() {
    const { modes, currentModeId, backendConnected, backendBaseUrl, detectedApp } = useContextSocket();
    const mode = getModeById(modes, currentModeId);
    const Icon = Icons[mode.icon] ?? Icons.Circle;
    const [expanded, setExpanded] = useState(false);
    const pillRef = useRef(null);
    const timerRef = useRef(null);
    const ignoringRef = useRef(true);
    const { stats } = useSystemStats(backendBaseUrl, expanded && backendConnected);
    const fileShelf = useFileShelf(backendBaseUrl, backendConnected, expanded);
    const { favorites } = useFavorites(backendBaseUrl, backendConnected);

    useEffect(() => {
        if (!window.cue?.onCursorPos) return undefined;
        const off = window.cue.onCursorPos(({ x, y }) => {
            const el = pillRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            if (inside === !ignoringRef.current) return;
            ignoringRef.current = !inside;
            window.cue.setBarIgnoreMouse(!inside);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeOut(() => setExpanded(inside), inside ? 150 : 250);
        });
        return () => { off?.(); clearTimeOut(timerRef.current); };
    }, []);
    const expandedHeight = 30 + 90 + (favorites.length > 0 ? 56 : 0) + (fileShelf.items.length > 0 ? 44 : 0);
    return (
        <div className="flex h-full w-full items-start justify-center pt-1">
            <div
                ref={pillRef}
                className="flex cursor-pointer flex-col overflow-hidden rounded-[22px] font-sans"
                style={{
                    width: expanded ? 320 : 132,
                    height: expanded ? Math.min(expandedHeight, 260) : 30,
                    background: 'rgb(4 4 5 / 0.92)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    boxShadow: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06), 0 20px 40px -12px rgb(0 0 0 / 0.7)',
                    letterSpacing: '-0.01em',
                    transition: `width .45s ${SPRING}, height .45s ${SPRING}`,
                }}
            >
                <div
                    onClick={() => window.cue?.toggleOverlay()}
                    className="flex h-[30px] w-full shrink-0 items-center justify-center gap-1.5 px-3 active:scale-[0.97] transition-transform"
                >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: `${mode.accentColor}22` }}>
                        <Icon size={11} color={mode.accentColor} strokeWidth={2.5} />
                    </span>
                    <span className="text-[11px] font-semibold text-cue-text">{mode.name}</span>
                    <span className="h-1 w-1 rounded-full" style={{ background: backendConnected ? '#30D158' : '#8B8FA3' }} />
                </div>
                <div
                    className="flex flex-1 flex-col gap-3 overflow-y-auto border-t border-white/[0.06] px-3 py-2.5"
                    style={{ opacity: expanded ? 1 : 0, transition: `opacity .25s ease .1s` }}
                >
                    <div className="flex items-center gap-1.5 text-[11px] text-cue-text-dim">
                        <Icon size={11} color={mode.accentColor} />
                        {detectedApp ? `${mode.name} . ${detectedApp}` : `${mode.name} mode`}
                        {stats && (
                            <span className="ml-auto font-mono text-[10px]">
                                {Math.round(stats.cpu_percent)}% . {Math.round(stats.memory_percent)}%
                            </span>
                        )}
                    </div>
                    {favorites.length > 0 && (
                        <div>
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-cue-text-dim/70">Favorites</div>
                            <div className="flex gap-2">
                                {favorites.slice(0, 6).map((app) => (
                                    <button
                                        key={app.id}
                                        type="button"
                                        onClick={() => window.cue?.launchApp({ targetPath: app.targetPath, arguments: app.arguments })}
                                        className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.05] transition-transform active:scale-90 hover:bg-white/[0.08]"
                                        title={app.name}
                                    >
                                        <FavoriteIcon app={app} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {fileShelf.items.length > 0 && (
                        <div>
                            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-cue-text-dim/70">File Tray</div>
                            <div className="space-y-1">
                                {fileShelf.items.slice(0, 3).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-[11px] text-cue-text"
                                        title={item.path}
                                    >
                                        <Icons.FileStack size={12} className="shrink-0 text-cue-text-dim" />
                                        <span className="truncate">{item.name ?? item.path}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => window.cue?.toggleOverlay()}
                        className="mt-auto flex items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-[11px] font-medium text-cue-text transition-transform active:scale-[0.97]"
                        style={{ background: 'rgb(255 255 255 / 0.06)' }}
                    >
                        Open Cue <kbd className="rounded border border-white/10 px-1 text-[9px]">Ctrl+Space</kbd>
                    </button>
                </div>
            </div>
        </div>
    );
}