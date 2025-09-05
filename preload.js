const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  
  // Steam detection
  detectSteamIds: () => ipcRenderer.invoke('steam:detect'),
  getMainSteamId: () => ipcRenderer.invoke('steam:getMain'),
});