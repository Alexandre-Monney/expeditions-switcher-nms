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
    icon: path.join(__dirname, 'assets/icons/app-icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});


const configManager = new ConfigManager();

ipcMain.handle('config:load', () => {
  return configManager.loadConfig();
});

ipcMain.handle('config:save', (event, config) => {
  return configManager.saveConfig(config);
});

ipcMain.handle('config:buildCachePath', (event, platform, steamId) => {
  return configManager.buildCachePath(platform, steamId);
});

ipcMain.handle('steam:detect', () => {
  return SteamDetection.detectSteamIds();
});

ipcMain.handle('steam:getMain', () => {
  return SteamDetection.getMainSteamId();
});

const processMonitor = new ProcessMonitor();
let monitoringIntervalId = null;

ipcMain.handle('process:isNMSRunning', async () => {
  return processMonitor.isNMSRunning();
});

ipcMain.handle('process:getNMSProcessInfo', async () => {
  return processMonitor.getNMSProcessInfo();
});

ipcMain.handle('process:startMonitoring', (event, interval = 5000) => {
  if (monitoringIntervalId) {
    processMonitor.stopMonitoring(monitoringIntervalId);
  }
  
  monitoringIntervalId = processMonitor.startMonitoring((isRunning) => {
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

const expeditionManager = new ExpeditionManager();

ipcMain.handle('expedition:getCurrentState', async () => {
  return expeditionManager.getCurrentState();
});

ipcMain.handle('expedition:getAvailableExpeditions', async () => {
  return expeditionManager.getAvailableExpeditions();
});

ipcMain.handle('expedition:activateExpedition', async (event, expeditionId) => {
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