const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cue', {
    getBackendBaseUrl: () => ipcRenderer.invoke('backend:get-base-url'),
    isBackendReady: () => ipcRenderer.invoke('backend:is-ready'),
    onShow: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('overlay:show', listener);
        return () => ipcRenderer.removeListener('overlay:show', listener);
    },
    onHide: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('overlay:hide', listener);
        return () => ipcRenderer.removeListener('overlay:hide', listener);
    },
    onBackendReady: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('backend:ready', listener);
        return () => ipcRenderer.removeListener('backend:ready', listener);
    },
    confirmHideAnimationDone: () => ipcRenderer.invoke('overlay:request-hide'),
    launchApp: (launch) => ipcRenderer.invoke('app:launch', launch),
    getFileIcon: (targetPath) => ipcRenderer.invoke('app:get-icon', targetPath),
    writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
    toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
    pickFile: (options) => ipcRenderer.invoke('dialog:pick-file', options),
    revealInFolder: (targetPath) => ipcRenderer.invoke('shell:reveal', targetPath),
    systemCommand: (command) => ipcRenderer.invoke('system:command', command),
});