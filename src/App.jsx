import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Overlay from './components/Overlay.jsx';
import { getModeById } from './modes/modeConfig.js';
import { useApps } from './lib/useApps.js';
import { useClipboardHistory } from './lib/useClipboardHistory.js';
import { useContextSocket } from './lib/useContextSocket.js';
import { routeQuery } from './lib/queryRouter.js';
import { getModeSuggestions } from './lib/modeSuggestions.js';
import { evaluateMathQuery } from './providers/mathProvider.js';
import { useCurrencySymbols, parseCurrencyQuery, useCurrencyConversion } from './lib/useCurrencyConversion.js'
import { parseTranslateQuery, useTranslation } from './lib/useTranslation.js';
import { parseDownloadQuery, useDownloadManager } from './lib/useDownloadManager.js'
import { useFileConversion } from './lib/useFileConversion.js';
import { useFileShelf } from './lib/useFileShelf.js'
import { useSnippets, parseSnippetQuery } from './lib/useSnippets.js';
import { useSystemStats } from './lib/useSystemStats.js';
import { useSystemCommands, parseSystemCommand } from './lib/useSystemCommands.js';
import {
    buildConvertResults, buildShelfResults, buildDownloadResults, buildTranslateResults, buildCurrencyResult, buildSnippetResults, buildSystemCommandResult,
} from './lib/specialModeResults.js'

export default function App() {
    const [visible, setVisible] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef(null);
    const { modes, currentModeId, detectedApp, backendConnected, backendBaseUrl } = useContextSocket();
    const currentMode = getModeById(modes, currentModeId);
    useEffect(() => {
        if (!window.cue) return undefined;
        const offShow = window.cue.onShow(() => setVisible(true));
        const offHide = window.cue.onHide(() => setVisible(false));
        return () => {
            offShow();
            offHide();
        };
    }, []);
    useEffect(() => {
        if (visible) {
            setQuery('');
            setSelectedIndex(0);
            requestAnimationFrame(() => searchInputRef.current?.focus());
        }
    }, [visible]);

    const handleHideAnimationComplete = useCallback(() => {
        if (!visible) {
            window.cue?.confirmHideAnimationDone();
        }
    }, [visible]);
    const appsFuse = useApps(backendBaseUrl, backendConnected);
    const { entries: clipboardEntries, refresh: refreshClipboardHistory, deleteEntry: deleteClipboardEntry } = useClipboardHistory(
        backendBaseUrl,
        backendConnected,
        visible,
    );
    const trimmedQuery = query.trim();
    const isCameraMode = trimmedQuery.toLowerCase() === 'camera';
    const isConvertMode = /^convert\b/i.test(trimmedQuery);
    const isShelfMode = /^shelf\b/i.test(trimmedQuery);
    const downloadUrl = parseDownloadQuery(query);
    const translateParsed = parseTranslateQuery(query);
    const isActivityMode = /^(?:activity|system)$/i.test(trimmedQuery);
    const isDashboardMode = /^dashboard$/i.test(trimmedQuery);
    const snippetParsed = parseSnippetQuery(query);
    const systemCommandParsed = parseSystemCommand(query);
    const fileConversion = useFileConversion(backendBaseUrl);
    const fileShelf = useFileShelf(backendBaseUrl, backendConnected, visible && isShelfMode);
    const downloadManager = useDownloadManager(backendBaseUrl);
    const currencySymbols = useCurrencySymbols(backendBaseUrl, backendConnected);
    const translationState = useTranslation(backendBaseUrl, translateParsed);
    const snippets = useSnippets(backendBaseUrl, backendConnected, visible && snippetParsed !== null);
    const systemStats = useSystemStats(backendBaseUrl, visible && (isActivityMode || isDashboardMode));
    const systemCommands = useSystemCommands();
    useEffect(() => {
        if (systemCommandParsed?.command !== systemCommands.armed) {
            systemCommands.resetArmed();
        }
    }, [query]);
    const modeStartRef = useRef(Date.now());
    useEffect(() => {
        modeStartRef.current = Date.now();
    }, [currentModeId]);
    const [now, setNow] = useState(() => new Date());
    useEffect (() => {
        if (!isDashboardMode) return undefined;
        const handle = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(handle);
    }, [isDashboardMode]);
    const modeUptimeSeconds = Math.floor((now.getTime() - modeStartRef.current) / 1000);
    const mathResult = useMemo(() => evaluateMathQuery(query), [query]);
    const currencyParsed =
        !isCameraMode && !isConvertMode && !isShelfMode && !downloadUrl && !translateParsed && !mathResult
            ? parseCurrencyQuery(query, currencySymbols)
            : null;
    const currencyState = useCurrencyConversion(backendBaseUrl, currencyParsed);
    const baseResults = useMemo(
        () => routeQuery({ query, appsFuse, clipboardEntries }),
        [query, appsFuse, clipboardEntries],
    );
    const results = useMemo(() => {
        if (isConvertMode) return buildConvertResults(fileConversion);
        if (isShelfMode) return buildShelfResults(fileShelf);
        if (downloadUrl) return buildDownloadResults(downloadUrl, downloadManager.job);
        if (translateParsed) return buildTranslateResults(translateParsed, translationState);
        if (snippetParsed) return buildSnippetResults(snippetParsed, snippets);
        if (systemCommandParsed) return buildSystemCommandresult(systemCommandParsed, systemCommands);
        if (currencyParsed) {
            const currencyRow = buildCurrencyResult(currencyState);
            return currencyRow ? [currencyRow, ...baseResults] : baseResults;
        }
        return baseResults;
    }, [
        isConvertMode, fileConversion, isShelfMode, fileShelf, downloadUrl, downloadManager.job, translateParsed, translationState, snippetParsed, snippets, systemCommandParsed, systemCommands, currencyParsed, currencyState, baseResults,
    ]);
    useEffect(() => {
        setSelectedIndex((prev) => Math.min(prev, Math.max(results.length - 1, 0)));
    }, [results]);
    const executeResult = useCallback(
        async (result) => {
            if (!result) return;
            if (result.action) {
                switch (result.action.type) {
                    case 'pick-conversion-file':
                        await fileConversion.pickFile();
                        break;
                    case 'convert-to-format':
                        await fileConversion.convertTo(result.action.format);
                        break;
                    case 'add-shelf-files':
                        await fileShelf.addFilesToShelf();
                        break;
                    case 'start-download':
                        await downloadManager.startDownload(result.action.url);
                        break;
                    case 'reveal':
                        if (result.action.path) window.cue?.revealInFolder(result.action.path);
                        fileConversion.reset();
                        setQuery('');
                        setVisible(false);
                        break;
                    case 'save-snippet':
                        await snippets.saveSnippet(result.action.name, result.action.content);
                        setQuery('snippets');
                        break;
                    case 'system-command': {
                        const executed = systemCommands.trigger(result.action.command, result.action.destructive);
                        if (executed) {
                            setQuery('');
                            setVisible(false);
                        }
                        break;
                    }
                    default:
                        break;
                }
                return;
            }
            if (result.launch) {
                await window.cue?.launchApp(result.launch);
            } else if (result.copyValue != null) {
                await window.cue?.writeClipboard(result.copyValue);
                setTimeout(refreshClipboardHistory, 300);
            } else {
                return;
            }
            setVisible(false);
        },
        [refreshClipboardHistory, fileConversion, fileShelf, downloadManager, snippets, systemCommands],
    );
    const handleRemoveRow = useCallback(
        (result) => {
            if (result.kind === 'shelf') fileShelf.removeFromShelf(result.removeAction.id);
            else if (result.kind === 'snippet') snippets.removeSnippet(result.removeAction.id);
        },
        [fileShelf, snippets],
    );
    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (event.key === 'Enter') {
                event.preventDefault();
                executeResult(results[selectedIndex]);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                setVisible(false);
            }
        },
        [results, selectedIndex, executeResult],
    );
    useEffect(() => {
        setSelectedIndex((prev) => Math.min(prev, Math.max(results.length - 1, 0)));
    }, [results]);
    const handleDeleteResult = useCallback(
        (result) => {
            if (result?.kind === 'clipboard' && result.entryId != null) {
                deleteClipboardEntry(result.entryId);
            }
        },
        [deleteClipboardEntry]
    );

    const suggestions = query.trim() === '' ? getModeSuggestions(currentMode.id) : [];
    return (
        <div className="h-full w-full flex items-start justify-center pt-2">
            <AnimatePresence onExitComplete={handleHideAnimationComplete}>
                {visible && (
                    <Overlay
                        mode={currentMode}
                        detectedApp={detectedApp}
                        backendConnected={backendConnected}
                        query={query}
                        onQueryChange={setQuery}
                        onKeyDown={handleKeyDown}
                        results={results}
                        selectedIndex={selectedIndex}
                        onSelectIndex={(index) => executeResult(results[index])}
                        onDeleteIndex={(index) => handleDeleteResult(results[index])}
                        onHoverIndex={setSelectedIndex}
                        searchInputRef={searchInputRef}
                        suggestions={suggestions}
                        onSuggestionClick={(example) => setQuery(example)}
                        cameraMode={isCameraMode}
                        activityMode={isActivityMode}
                        dashboardMode={isDashboardMode}
                        systemStats={systemStats.stats}
                        systemProcesses={systemStats.processes}
                        modeUptimeSeconds={modeUptimeSeconds}
                        now={now}
                        clipboardEntries={clipboardEntries}
                        shelfItems={fileShelf.items}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}