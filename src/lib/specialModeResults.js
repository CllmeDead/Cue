export function buildConvertResults(fileConversion) {
    if (fileConversion.convertedPath) {
        return [
            {
                id: 'convert-done',
                kind: 'action',
                title: 'converted - Enter to open in folder',
                subtitle: fileConversion.convertedPath,
                action: { type: 'reveal', path: fileConversion.convertedPath },
            },
        ];
    }
    if (fileConversion.pickedFile) {
        if (fileConversion.converting) {
            return [{ id: 'convert-working', kind: 'devtool', title: 'Converting...', subtitle: fileConversion.pickedFile.path }];
        }
        return fileConversion.availableFormats.map((format) => ({
            id: `convert-to-${format}`,
            kind: 'action',
            title: `Convert to ${format.toUpperCase()}`,
            subtitle: fileConversion.pickedFile.path,
            action: { type: 'convert-to-format', format },
        }));
    }
    return [
        {
            id: 'convert-pick',
            kind: 'action',
            title: 'Choose a file to convert...',
            subtitle: 'PNG, JPG, or WEBP - Enter to open file picker',
            action: { type: 'pick-conversion-file' },
        },
    ];
}

export function buildShelfResults(fileShelf) {
    const addRow = {
        id: 'shelf-add',
        kind: 'action',
        title: 'Add file(s) to shelf...',
        subtitle: 'Enter to open file picker',
        action: { type: 'add-shelf-files' },
    };
    const itemRows = fileShelf.item.map((item) => ({
        id: `shelf-${item.id}`,
        kind: 'shelf',
        title: item.path,
        copyValue: item.path,
        removeAction: { id: item.id },
    }));
    return [addRow, ...itemRows];
}
export function buildDownloadResults(url, job) {
    if (!job || job.url !==url) {
        return [
            {
                id: 'download-start',
                kind: 'action',
                title: 'Download this video/audio',
                subtitle: url,
                action: { type: 'start-download', url },
            },
        ];
    }
    if (job.status === 'error') {
        return [
            {
                id: 'download-error',
                kind: 'devtool',
                title: 'Download failed',
                subtitle: job.error,
                isError: true
            }
        ];
    }
    if (job.status === 'finished') {
        return [
            {
                id: 'download-done',
                kind: 'action',
                title: 'Download complete - Enter to open in folder',
                subtitle: job.filename ?? url,
                action: { type: 'reveal', path: job.filename },
            },
        ];
    }
    return [
        {
            id: 'download-progress',
            kind: 'download',
            title: job.status === 'downloading' ? `Downloading.. ${job.percent ?? '?'}%` : 'Queued..',
            subtitle: url,
            percent: job.percent,
        },
    ];
}

export function buildTranslateResults(parsed, translationState) {
    if (translationState.loading) {
        return [
            {
                id: 'translate-loading',
                kind: 'devtool',
                title: 'Translating..',
                subtitle: `${parsed.source} -> ${parsed.target}`
            }
        ];
    }
    if (translationState.error) {
        return [
            {
                id: 'translate-error',
                kind: 'devtool',
                title: 'Translation failed',
                subtitle: translateState.error,
                isError: true 
            }
        ];
    }
    if (translationState.result) {
        return [
            {
                id: 'translate-result',
                kind: 'devtool',
                title: translationState.result.translated,
                subtitle: `${parsed.source} -> ${parsed.target} - Enter to copy`,
                copyValue: translationState.result.translated,
            },
        ];
    }
    return [];
}

export function buildCurrencyResult(currencyState) {
    if (currencyState.loading) {
        return { id: 'currency-loading', kind: 'devtool', title: 'Converting..', subtitle: 'Fetching today\u2019s rate' };
    }
    const { result } = currencyState;
    if (!result) return null;
    const formattedAmount = result.result.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return {
        id: 'currency-result',
        kind: 'devtool',
        title: `${formattedAmount} ${result.to}`,
        subtitle: `${result.amount} ${result.from} - rate ${result.rate} - Enter to copy`,
        copyValue: formattedAmount,
    };
}

export function buildSnippetResults(parsed, snippets) {
    if (!parsed) return [];
    if (parsed.mode === 'add') {
        if (!parsed.name || !parsed.content) return [];
        return [{
        id: 'snippet-add',
        kind: 'action',
        title: `Save snippet "${parsed.name}"`,
        subtitle: parsed.content.length > 60 ? `${parsed.content.slice(0, 60)}..` : parsed.content,
        action: { type: 'save-snippet', name: parsed.name, content: parsed.content },
        }];
    }
    const search = parsed.search.toLowerCase();
    const filtered = search
        ? snippets.items.filter((item) => item.name.toLowerCase().includes(search))
        : snippets.items;
    if (filtered.length === 0) {
        return [{
            id: 'snippet-empty',
            kind: 'snippet',
            title: search ? `No snippets match "${parsed.search}"` : 'No snippets yet',
            subtitle: 'Try: snippet add name: content',
        }];
    }
    return filtered.map((item) => ({
        id: `snippet-${item.id}`,
        kind: 'snippet',
        title: item.name,
        subtitle: item.content.length > 60 ? `${item.content.slice(0, 60)}..` : item.content,
        copyValue: item.content,
        removeAction: { id: item.id },
    }));
}

export function buildSystemCommandResult(parsed, systemCommands) {
    if (!parsed) return [];
    const armed = systemCommands.armed === parsed.command;
    return [{
        id: `system-${parsed.command}`,
        kind: 'system',
        title: armed ? `Press Enter again to confirm: ${parsed.label}` : parsed.label,
        subtitle: parsed.destructive ? (armed ? 'Tihs cannot be undone' : 'Destructive - press Enter twice') : undefined,
        isError: armed,
        action: { type: 'system-command', command: parsed.command, destructive: parsed.destructive },
    }];
}