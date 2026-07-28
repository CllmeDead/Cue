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

export default function Overlay({
    mode, 
    detectedApp, 
    backendConnected,
    query,
    onQueryChange,
    onKeyDown,
    results,
    selectedIndex,
    onSelectIndex,
    onDeleteIndex,
    onHoverIndex,
    searchInputRef,
    suggestions,
    onSuggestionClick,
    cameraMode,
    onRemoveRow,
    activityMode,
    dashboardMode,
    systemStats,
    systemProcesses,
    modeUptimeSeconds,
    now,
    clipboardEntries,
    shelfItems,
}) {
    const Icon = Icons[mode.icon] ?? Icons.Circle;
    const placeholder = MODE_PLACEHOLDERS[mode.id] ?? DEFAULT_PLACEHOLDER;
    return (
        <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="cue-panel cue-panel-edge relative w-[560px] rounded-2xl p-5 text-cue-text font-sans"
            style={{ '--mode-accent': mode.accentColor }}
        >
            <div className="flex items-center gap-3">
                <motion.div
                    key={mode.id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        background: `${mode.accentColor}22`,
                        boxShadow: `0 0 24px 0 ${mode.accentColor}33`,
                    }}
                    title={`${mode.name} mode${detectedApp ? ` - ${detectedApp}` : ''}`}
                >
                    <Icon size={20} color={mode.accentColor} strokeWidth={2} />
                </motion.div>
                <SearchBar ref={searchInputRef} value={query} onChange={onQueryChange} onKeyDown={onKeyDown} />

                <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                    style={{ background: backendConnected ? '#22C55E' : '#8B8FA3' }}
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
                            className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-cue-text-dim transition-colors hover: text-cue-text"
                            style={{ background: 'rgb(255 255 255 / 0.03)' }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
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
                />
            )}
            <div className="mt-4 flex-items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[11px] uppercase tracking-[0.14rem] text-cue-text-dim">Cue</span>
                <span className="text-[11px] text-cue-text-dim">
                    {detectedApp ? `${mode.name} - ${detectedApp}` : 'Ctrl+Space to toggle'}
                </span>
            </div>
        </motion.div>
    );
}