import { useEffect, useRef } from 'react';
import ResultItem from './ResultItem.jsx';

export default function ResultsList({ results, selectedIndex, accentColor, onSelect, onDelete, onHover, onRemove }) {
    const containerRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const selectedEl = container.children[selectedIndex];
        selectedEl?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);
    if (results.length === 0) return null
    return (
        <div ref={containerRef} className="mt-3 max-h-72 space-y-0.5 overflow-y-auto pr-1">
            {results.map((result, index) => (
                <ResultItem
                    key={result.id}
                    result={result}
                    isSelected={index === selectedIndex}
                    accentColor={accentColor}
                    onClick={() => onSelect(index)}
                    onMouseEnter={() => onHover(index)}
                    onDelete={result.kind === 'clipboard' ? () => onDelete(index) : undefined}
                />
            ))}
        </div>
    );
}
