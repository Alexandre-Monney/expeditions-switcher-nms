const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  buildCachePath: (platform, steamId) => ipcRenderer.invoke('config:buildCachePath', platform, steamId),
  
  detectSteamIds: () => ipcRenderer.invoke('steam:detect'),
  getMainSteamId: () => ipcRenderer.invoke('steam:getMain'),
  isSteamOffline: () => ipcRenderer.invoke('steam:isOffline'),
  getSteamStatus: () => ipcRenderer.invoke('steam:getStatus'),
  
  isNMSRunning: () => ipcRenderer.invoke('process:isNMSRunning'),
  getNMSProcessInfo: () => ipcRenderer.invoke('process:getNMSProcessInfo'),
  startNMSMonitoring: (interval) => ipcRenderer.invoke('process:startMonitoring', interval),
  stopNMSMonitoring: () => ipcRenderer.invoke('process:stopMonitoring'),
  
  // Process monitoring events
  onNMSStatusChange: (callback) => {
    ipcRenderer.on('nms-status-changed', (event, isRunning) => callback(isRunning));
  },
  removeNMSStatusListener: () => {
    ipcRenderer.removeAllListeners('nms-status-changed');
  },
  
  getCurrentState: () => ipcRenderer.invoke('expedition:getCurrentState'),
  getAvailableExpeditions: () => ipcRenderer.invoke('expedition:getAvailableExpeditions'),
  activateExpedition: (expeditionId) => ipcRenderer.invoke('expedition:activateExpedition', expeditionId),
  restoreOriginal: () => ipcRenderer.invoke('expedition:restoreOriginal'),
  createBackup: () => ipcRenderer.invoke('expedition:createBackup')
});