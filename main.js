const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ConfigManager = require('./src/services/configManager');
const SteamDetection = require('./src/services/steamDetection');
const ProcessMonitor = require('./src/services/processMonitor');
const ExpeditionManager = require('./src/services/expeditionManager');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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

// Expedition management IPC handlers
const expeditionManager = new ExpeditionManager();

ipcMain.handle('expedition:getCurrentState', async () => {
  return expeditionManager.getCurrentState();
});

ipcMain.handle('expedition:getAvailableExpeditions', async () => {
  return expeditionManager.getAvailableExpeditions();
});

ipcMain.handle('expedition:activateExpedition', async (event, expeditionId) => {
  // Check if NMS is running before allowing activation
  const isRunning = await processMonitor.isNMSRunning();
  if (isRunning) {
    return {
      success: false,
      error: 'Cannot switch expeditions while No Man\'s Sky is running. Please close the game first.'
    };
  }
  
  return expeditionManager.activateExpedition(expeditionId);
});

ipcMain.handle('expedition:restoreOriginal', async () => {
  // Check if NMS is running before allowing restoration
  const isRunning = await processMonitor.isNMSRunning();
  if (isRunning) {
    return {
      success: false,
      error: 'Cannot restore original save while No Man\'s Sky is running. Please close the game first.'
    };
  }
  
  return expeditionManager.restoreOriginal();
});

ipcMain.handle('expedition:createBackup', async () => {
  return expeditionManager.createBackup();
});