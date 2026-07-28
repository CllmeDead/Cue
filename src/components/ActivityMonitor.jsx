function StatBar({ label, percent, detail, accentColor }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs text-cue-text-dim">
                <span>{label}</span>
                <span>{detail}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(percent, 100)}%`, background: accentColor }}
                />
            </div>
        </div>
    );
}

export default function ActivityMonitor({ stats, processes, accentColor }) {
    if (!stats) {
        return <div className="mt-3 px-3 py-4 text-center text-xs text-cue-text-dim">Loading system Stats..</div>;
    }
    return (
        <div className="mt-3 space-y-3">
            <StatBar
                label="CPU"
                percent={stats.cpu_percent}
                detail={`${stats.cpu_percent.toFixed(0)}%`}
                accentColor={accentColor}
            />
            <StatBar
                label="Memory"
                percent={stats.memory_percent}
                detail={`${stats.memory_used_gb} / ${stats.memory_total_gb} GB`}
                accentColor={accentColor}
            />
            <StatBar
                label="Disk"
                percent={stats.disk_percent}
                detail={`${stats.disk_used_gb} / ${stats.disk_total_gb} GB`}
                accentColor={accentColor}
            />
            {processes.length > 0 && (
                <div>
                    <div className="mb-1.5 text-xs text-cue-text-dim">Top processes by memory</div>
                    <div className="space-y-1">
                        {processes.map((p) => (
                            <div key={p.pid} className="flex items-center justify-between text-xs">
                                <span className="truncate text-cue-text">{p.name}</span>
                                <span className="shrink-0 text-cue-text-dim">{p.memory_mb} MB</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}