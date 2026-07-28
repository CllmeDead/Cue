function WidgetCard({ title, children, accentColor }) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wide text-cue-dim">{title}</div>
            <div className="mt-1 text-sm text-cue-text" style={{ color: accentColor }}>
                {children}
            </div>
        </div>
    );
}

function formatUptime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WidgetDashboard({ mode, modeUptimeSeconds, now, stats, clipboardEntries, shelfItems }) {
    return (
        <div className="mt-3 grid grid-cols-2 gap-2">
            <WidgetCard title="Time" accentColor={mode.accentColor}>
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <div className="text-xs text-cue-text-dim">
                    {now.toLocaleTimeString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
            </WidgetCard>
            <WidgetCard title="This mode" accentColor={mode.accentColor}>
                {mode.name}
                <div className="text-xs text-cue-text-dim">{formatUptime(modeUptimeSeconds)} this session</div>
            </WidgetCard>
            <WidgetCard title="System" accentColor={mode.accentColor}>
                {stats ? `${stats.cpu_percent.toFixed(0)}% CPU` : '-'}
                <div className="text-xs text-cue-text-dim">
                    {stats ? `${stats.memory_percent.toFixed(0)}% memory` : 'Loading..'}
                </div>
            </WidgetCard>
            <WidgetCard title="Clipboard" accentColor={mode.accentColor}>
                {clipboardEntries.length} saved
                <div className="truncate text-xs text-cue-text-dim">
                    {clipboardEntries[0]?.content ?? 'Nothing yet'}
                </div>
            </WidgetCard>
            <WidgetCard title="Shelf" accentColor={mode.accentColor}>
                {shelfItems.length} file{shelfItems.length === 1 ? '' : 's'}
                <div className="truncate text-xs text-cue-text-dim">
                    {shelfItems[0]?.name ?? 'Empty'}
                </div>
            </WidgetCard>
        </div>
    );
}