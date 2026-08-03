import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import ResultsList from './ResultsList.jsx'
import CameraPreview from './CameraPreview.jsx';
import ActivityMonitor from './ActivityMonitor.jsx';
import WidgetDashboard from './WidgetDashboard.jsx';

const MODE_PLACEHOLDERS = {
    coding: "Try 'case', 'color #hex', 'regex', or search an app...",
    writing: "Try 'count', 'lorem', or search an app...",
};
const DEFAULT_PLACEHOLDER = "Search apps, do math, or try 'uuid', 'json {...}'";
const SPRING = [0.16, 1, 0.3, 1];

export default function Overlay({
    mode, detectedApp, backendConnected, query, onQueryChange, onKeyDown, results,
    selectedIndex, onSelectIndex, onDeleteIndex, onHoverIndex, searchInputRef,
    suggestions, onSuggestionClick, cameraMode, onRemoveRow, onToggleFavorite,
    activityMode, dashboardMode, systemStats, systemProcesses, modeUptimeSeconds,
    now, clipboardEntries, shelfItems,
}) {
    const Icon = Icons[mode.icon] ?? Icons.Circle;
    const placeholder = MODE_PLACEHOLDERS[mode.id] ?? DEFAULT_PLACEHOLDER;
    return (
        <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.28, ease: SPRING }}
            className="cue-panel cue-panel-glow relative w-[560px] rounded-[26px] p-5 text-cue-text font-sans"
            style={{ '--mode-accent': mode.accentColor, maxHeight: 'calc(100vh - 32px)', overflow: 'hidden' }}
        >
            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <motion.div
                        key={mode.id}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: SPRING }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                        style={{
                            background: `${mode.accentColor}1A`,
                            boxShadow: `0 0 0 1px ${mode.accentColor}40 inset`,
                        }}
                        title={detectedApp ? `${mode.name} mode — ${detectedApp}` : `${mode.name} mode`}
                    >
                        <Icon size={16} color={mode.accentColor} strokeWidth={2} />
                    </motion.div>
                    <SearchBar
                        ref={searchInputRef}
                        value={query}
                        onChange={onQueryChange}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                    />
                    <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                        style={{ background: backendConnected ? '#30D158' : '#8B8FA3' }}
                        title={backendConnected ? 'Backend connected' : 'Connecting to backend..'}
                    />
                </div>
                {suggestions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => onSuggestionClick(s.example)}
                                className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-cue-text-dim transition-transform hover:text-cue-text active:scale-95"
                                style={{ background: 'rgb(255 255 255 / 0.03)' }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
                <div className="mt-3 -mx-5 border-t border-white/[0.07]" />
                {cameraMode ? (
                    <CameraPreview />
                ) : activityMode ? (
                    <ActivityMonitor stats={systemStats} processes={systemProcesses} accentColor={mode.accentColor} />
                ) : dashboardMode ? (
                    <WidgetDashboard
                        mode={mode}
                        modeUptimeSeconds={modeUptimeSeconds}
                        now={now}
                        stats={systemStats}
                        clipboardEntries={clipboardEntries}
                        shelfItems={shelfItems}
                    />
                ) : (
                    <ResultsList
                        results={results}
                        query={query}
                        selectedIndex={selectedIndex}
                        accentColor={mode.accentColor}
                        onSelect={onSelectIndex}
                        onHover={onHoverIndex}
                        onDelete={onDeleteIndex}
                        onRemove={onRemoveRow}
                        onToggleFavorite={onToggleFavorite}
                    />
                )}
                <div className="mt-3 -mx-5 flex items-center justify-between border-t border-white/[0.07] px-5 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-cue-text-dim">
                        <Icon size={12} color={mode.accentColor} />
                        {detectedApp ? `${mode.name} · ${detectedApp}` : mode.name}
                    </span>
                    <span className="flex items-center gap-3 text-[11px] text-cue-text-dim">
                        <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-1.5 py-1">
                            <kbd className="flex items-center rounded border border-white/10 p-1">
                                <Icons.CornerDownLeft size={10} />
                            </kbd>
                            <span>Open</span>
                        </span>
                        <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-1.5 py-1">
                            <span className="flex items-center gap-0.5">
                                <kbd className="rounded border border-white/10 px-1 text-[10px]">⌘</kbd>
                                <kbd className="rounded border border-white/10 px-1 text-[10px]">⌫</kbd>
                            </span>
                            <span>Remove</span>
                        </span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}