import * as Icons from 'lucide-react';

const TITLES = [
    { id: 'clipboard', label: 'Clipboard History', icon: 'ClipboardList' },
    { id: 'shelf', label: 'File Shelf', icon: 'FileStack' },
    { id: 'snippets', label: 'Snippets', icon: 'NotebookText' },
    { id: 'favorites', label: 'Favorites', icon: 'Star' },
    { id: 'system', label: 'System', icon: 'Activity' },
    { id: 'downloads', label: 'Downloads', icon: 'Download' },
];

export default function HomeDashboard({ onSelectView, selectedView, selectedIndex, accentColor, counts }) {
    return (
        <div className="mt-3 grid grid-cols-3 gap-2">
            {TITLES.map((title, index) => {
                const icon = Icon[title.icon];
                const isSelected = index === selectedIndex;
                return (
                    <button
                        key={title.id}
                        type="button"
                        onClick={() => onSelectView(title.id)}
                        className="flex flex-col items-start gap-2.5 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
                        style={{
                            background: isSelected ? 'rgb(255 255 255 / 0.07)' : 'rgb(255 255 255 / 0.03)',
                            border: `1px solid ${isSelected ? `${accentColor}55` : 'rgb(255 255 255 / 0.06)'}`,
                            boxShadow: isSelected ? `0 0 0 1px ${accentColor}22 inset` : 'none',
                        }}
                    >
                        <div className="flex w-full items-center justify-between">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                                <Icons size={14} className="text-cue-text" strokeWidth={1.75} />
                            </div>
                            {title.id === 'downloads' && counts?.downloadActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF453A]" />
                            )}
                            {counts?.[tile.id] != null && counts[tile.id] > 0 && tile.id !== 'downloads' && (
                                <span className="text-[10px] text-cue-text-dim">{counts[tile.id]}</span>
                            )}
                        </div>
                        <span className="text-[12px] font-medium text-cue-text">{tile.label}</span>
                    </button>
                );
            })}
        </div>
    );
}