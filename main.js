const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ConfigManager = require('./src/services/configManager');
const SteamDetection = require('./src/services/steamDetection');
const ProcessMonitor = require('./src/services/processMonitor');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configuration IPC handlers
const configManager = new ConfigManager();

ipcMain.handle('config:load', () => {
  return configManager.loadConfig();
});

ipcMain.handle('config:save', (event, config) => {
  return configManager.saveConfig(config);
});

// Steam detection IPC handlers
ipcMain.handle('steam:detect', () => {
  return SteamDetection.detectSteamIds();
});

ipcMain.handle('steam:getMain', () => {
  return SteamDetection.getMainSteamId();
});

// Process monitoring IPC handlers
const processMonitor = new ProcessMonitor();
let monitoringIntervalId = null;

ipcMain.handle('process:isNMSRunning', async () => {
  return processMonitor.isNMSRunning();
});

ipcMain.handle('process:getNMSProcessInfo', async () => {
  return processMonitor.getNMSProcessInfo();
});

ipcMain.handle('process:startMonitoring', (event, interval = 5000) => {
  // Stop existing monitoring if any
  if (monitoringIntervalId) {
    processMonitor.stopMonitoring(monitoringIntervalId);
  }
  
  // Start new monitoring
  monitoringIntervalId = processMonitor.startMonitoring((isRunning) => {
    // Send status to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('nms-status-changed', isRunning);
    });
  }, interval);
  
  return true;
});

ipcMain.handle('process:stopMonitoring', () => {
  if (monitoringIntervalId) {
    processMonitor.stopMonitoring(monitoringIntervalId);
    monitoringIntervalId = null;
    return true;
  }
  return false;
});