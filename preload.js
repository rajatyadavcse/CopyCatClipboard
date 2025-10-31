const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateHistory: (callback) => ipcRenderer.on('update-history', (_, data) => callback(data))
});

