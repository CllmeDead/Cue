import { useEffect, useState } from 'react';
import {
  Calculator, Fingerprint, Binary, Braces, Clock, Hash, AppWindow, ClipboardList, AlertCircle, Trash2, ArrowRight, Download, FileStack, Languages, Coins, X,
} from 'lucide-react';
import { getAppIconDataUrl } from '../lib/iconCache.js';

const DEVTOOL_ICONS = {
  'devtool-uuid': Fingerprint,
  'devtool-base64-decode': Binary,
  'devtool-base64-encode': Binary,
  'devtool-json-valid': Braces,
  'devtool-json-invalid': AlertCircle,
  'devtool-now': Clock,
  'devtool-ts': Clock,
  'devtool-ts-invalid': AlertCircle,
  'devtool-base-conversion': Hash,
  'translate-loading': Languages,
  'translate-error': AlertCircle,
  'translate-result': Languages,
  'currency-loading': Coins,
  'currency-result': Coins,
  'download-error': AlertCircle,
  'convert-working': Hash,
};
function ResultIcon({ result, accentColor }) {
  const [appIconSrc, setAppIconSrc] = useState(null);
  useEffect(() => {
    if (result.kind !== 'app') return undefined;
    let cancelled = false;
    getAppIconDataUrl(result.iconPath).then((src) => {
      if (!cancelled) setAppIconSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [result.kind, result.iconPath]);
  if (result.kind === 'app') {
    if (appIconSrc) {
      return <img src={appIconSrc} alt="" className="h-5 w-5 rounded-sm" />;
    }
    return <AppWindow size={16} color={accentColor} />;
  }
  if (result.kind === 'clipboard') {
    return <ClipboardList size={16} color={accentColor} />;
  }
  if (result.kind === 'math') {
    return <Calculator size={16} color={accentColor} />;
  }
  if (result.kind === 'action') {
    return <ArrowRight size={16} color={accentColor} />
  }
  if (result.kind === 'download') {
    return <Download size={16} color={accentColor} />
  }
  if (result.kind === 'shelf') {
    return <Download size={16} color={accentColor} />
  }
  const Icon = DEVTOOL_ICONS[result.id] ?? Hash;
  return <Icon size={16} color={result.isError ? '#EF4444' : accentColor} />;
}

export default function ResultItem({ result, isSelected, accentColor, onClick, onMouseEnter, onDelete, onRemove }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors"
      style={{
        background: isSelected ? `${accentColor}18` : 'transparent',
      }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5">
        <ResultIcon result={result} accentColor={accentColor} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm ${result.isError ? 'text-red-400' : 'text-cue-text'}`}>
          {result.title}
        </div>
        {result.subtitle && (
          <div className="truncate text-xs text-cue-text-dim">{result.subtitle}</div>
        )}
        {result.kind === 'download' && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${result.percent ?? 8}%`,
                background: accentColor,
              }}
            />
            </div>
        )}
      </div>
      {result.kind === 'shelf' && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(result.removeAction.id);
          }}
          className="shrink-0 rounded-md p-1 text-cue-text-dim hover: text-red-400"
          title="Remove from shelf"
        >
          <X size={14} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded-md p-1 text-cue-text-dim hover:text-red-400 hover:bg-white/5 transition-colors"
          title="Delete from history"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
