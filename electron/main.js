import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, screen, nativeImage, clipboard, dialog, shell, session } from 'electron';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8756;
const BACKEND_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const WINDOW_WIDTH = 640;
const WINDOW_HEIGHT = 400;
const CLIPBOARD_POLL_MS = 600;
const BAR_WIDTH = 132;
const BAR_HEIGHT = 30;

let mainWindow = null;
let barWindow = null;
let tray = null;
let backendProcess = null;
let backendReady = false;
let clipboardPollHandle = null;
let lastSeenClipboardText = '';
let suppressBlurHide = false;
let overlayVisible = false;
const iconCache = new Map();

function resolveBackendCommand() {
    if (isDev) {
        const venvPython = process.platform === 'win32'
            ? path.join(__dirname, '..', 'backend', '.venv', 'Scripts', 'python.exe')
            : path.join(__dirname, '..', 'backend', '.venv', 'bin', 'python');
        return {
            cmd: venvPython,
            args: [path.join(__dirname, '..', 'backend', 'main.py')],
            cwd: path.join(__dirname, '..', 'backend')
        };
    }
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    const venvPython = process.platform === 'win32'
        ? path.join(resourcesBackend, '.venv', 'Scripts', 'python.exe')
        : path.join(resourcesBackend, '.venv', 'bin', 'python');
    return {
        cmd: venvPython,
        args: [path.join(resourcesBackend, 'main.py')],
        cwd: resourcesBackend
    };
}
function startBackend() {
    const { cmd, args, cwd } = resolveBackendCommand();
    backendProcess = spawn(cmd, args, {
        cwd,
        env: { ...process.env, CUE_BACKEND_PORT: String(BACKEND_PORT), CUE_PID: String(process.pid) },
        windowsHide: true,
    });
    backendProcess.stdout.on('data', (chunk) => {
        if (isDev) process.stdout.write(`[backend] ${chunk}`);
    });
    backendProcess.stderr.on('data', (chunk) => {
        if (isDev) process.stderr.write(`[backend:err] ${chunk}`);
    });
    backendProcess.on('exit', (code) => {
        backendReady = false;
        if (isDev) console.log(`[backend] exited with code ${code}`);
    });
}

function waitForBackend(timeoutMs = 15000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const req = http.get(`${BACKEND_BASE_URL}/health`, (res) => {
                if (res.statusCode === 200) {
                    backendReady = true;
                    resolve();
                } else {
                    retry();
                }
            });
            req.on('error', retry);
        };
        const retry = () => {
            if (Date.now() - start > timeoutMs) {
                reject (new Error('Backend did not become healthy in time'));
                return;
            }
            setTimeout(attempt, 300);
        };
        attempt();
    });
}

function stopBackend() {
    if (backendProcess && !backendProcess.killed) {
        backendProcess.kill();
    }
}

function createWindow() {
    const { workAreaSize } = screen.getPrimaryDisplay();
    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        x: Math.round((workAreaSize.width - WINDOW_WIDTH) / 2),
        y: Math.round(workAreaSize.height * 0.28),
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        movable: true,
        show: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
    mainWindow.on('blur', () => {
        if (!mainWindow || !mainWindow.isVisible() || suppressBlurHide) {
            return;
        }
        hideOverlay();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function createBarWindow() {
    const { workAreaSize } = screen.getPrimaryDisplay();
    barWindow = new BrowserWindow({
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        x: Math.round((workAreaSize.width - BAR_WIDTH) / 2),
        y: 4,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        movable: false,
        show: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        focusable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    barWindow.setAlwaysOnTop(true, 'screen-saver');
    barWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (isDev) {
        barWindow.loadURL('http://localhost:5173/bar.html');
    } else {
        barWindow.loadFile(path.join(__dirname, '..', 'dist', 'bar.html'));
    }
    barWindow.on('closed', () => {
        barWindow = null;
    });
}

function showOverlay() {
    if (!mainWindow) return;
    overlayVisible = true;
    suppressBlurHide = true;
    mainWindow.show();
    mainWindow.focus();

    const sendShowSignal = () => {
        mainWindow?.webContents.send('overlay:show');
    };

    if (mainWindow.webContents.isLoadingMainFrame()) {
        mainWindow.webContents.once('did-finish-load', sendShowSignal);
    } else {
        sendShowSignal();
    }

    setTimeout(() => {
        suppressBlurHide = false;
    }, 220);
}

function hideOverlay() {
    if (!mainWindow) return;
    overlayVisible = false;
    mainWindow.webContents.send('overlay:hide');
}

function toggleOverlay() {
    if (!mainWindow) return;
    if (overlayVisible) {
        hideOverlay();
    } else {
        showOverlay();
    }
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, '..', 'build', 'tray-icon.png');
        let image = nativeImage.createFromPath(iconPath);
        if (image.isEmpty()) {
            image = nativeImage.createEmpty();
        }
        tray = new Tray(image);
        tray.setToolTip('Cue');
        tray.setContextMenu(Menu.buildFromTemplate([
            { label: 'Show Cue', click: showOverlay },
            { type: 'separator' },
            { label: 'Quit Cue', click: () => app.quit() },
        ]));
        tray.on('click', toggleOverlay);
    } catch (err) {
        console.error('[tray] Failed to create tray:', err?.message ?? err);
    }
}

function startClipboardpolling() {
    clipboardPollHandle = setInterval(async () => {
        const text = clipboard.readText();
        if (!text || text === lastSeenClipboardText) return;
        lastSeenClipboardText = text;
        if (!backendReady) return;
        try {
            await fetch(`${BACKEND_BASE_URL}/clipboard-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text }),
            });
        } catch {

        }
    }, CLIPBOARD_POLL_MS);
}

function stopClipboardPolling() {
    if(clipboardPollHandle) clearInterval(clipboardPollHandle);
}

ipcMain.handle('overlay:request-hide', () => {
    mainWindow?.hide();
});
ipcMain.handle('backend:get-base-url', () => BACKEND_BASE_URL);
ipcMain.handle('backend:is-ready', () => backendReady);
ipcMain.handle('overlay:toggle', () => {
    toggleOverlay();
});
ipcMain.handle('app:launch', (_event, { targetPath, arguments: argString }) => {
    if (!targetPath) return false;
    const args = argString ? argString.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [] : [];
    const child = spawn(targetPath, args, {
        detached: true, 
        stdio: 'ignore',
        cwd: path.dirname(targetPath),
    });
    child.unref();
    return true;
});
ipcMain.handle('app:get-icon', async (_event, targetPath) => {
    if (!targetPath) return null;
    if (iconCache.has(targetPath)) return iconCache.get(targetPath);
    try {
        const image = await app.getFileIcon(targetPath, { size: 'normal' });
        const dataUrl = image.toDataURL();
        iconCache.set(targetPath, dataUrl);
        return dataUrl;
    } catch {
        return null;
    }
});
ipcMain.handle('clipboard:write', (_event, text) => {
    clipboard.writeText(text);
    lastSeenClipboardText = text;
});
ipcMain.handle('dialog:pick-file', async (_event, options = {}) => {
    const properties = options.multiple ? ['openFile', 'multiSelections'] : ['openFile'];
    const result = await dialog.showOpenDialog(mainWindow, {
        properties,
        filters: options.filter ?? [],
    });
    if (result.canceled) return options.multiple ? [] : null;
    return options.multiple ? result.filePaths : result.filePaths[0];
});
ipcMain.handle('shell:reveal', (_event, target) => {
    shell.showItemInFolder(target);
});

const SYSTEM_COMMANDS = {
    lock: 'rundll32.exe user32.dll,LockWorkStation',
    sleep: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
    restart: 'shutdown /r /t 0',
    shutdown: 'shutdown /s /t 0',
    signout: 'shutdown /l'
};

ipcMain.handle('system:command', (_event, command) => {
    const cmd = SYSTEM_COMMANDS[command];
    if (!cmd) return false;
    exec(cmd, (err) => {
        if (err) console.error(`System command "${command}" failed:`, err.message);
    });
    return true;
});

app.whenReady().then(async () => {
    startBackend();
    createWindow();
    createBarWindow();
    createTray();
    lastSeenClipboardText = clipboard.readText();
    startClipboardpolling();
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(permission === 'media');
    });
    const registered = globalShortcut.register('Ctrl+Space', toggleOverlay);
    if (!registered) {
        console.error('Failed to register shortcut Ctrl+Space. It may be taken by another app.');
    }
    try {
        await waitForBackend();
        mainWindow?.webContents.send('backend:ready');
    } catch (err) {
        console.error(err.message);
    }
});
app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', ()=> {
    globalShortcut.unregisterAll();
    stopClipboardPolling();
    stopBackend();
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        showOverlay();
    });
}