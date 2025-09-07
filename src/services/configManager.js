const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.nms-utils');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      platform: null,
      steamId: null,
      firstSetup: true,
      cachePath: null
    };
  }

  ensureConfigDir() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        return { ...this.defaultConfig, ...JSON.parse(data) };
      }
      return this.defaultConfig;
    } catch (error) {
      console.error('Error loading config:', error);
      return this.defaultConfig;
    }
  }

  saveConfig(config) {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  updateConfig(updates) {
    const currentConfig = this.loadConfig();
    const newConfig = { ...currentConfig, ...updates };
    return this.saveConfig(newConfig);
  }

  buildCachePath(platform, steamId = null) {
    // Platform-specific base paths
    const appDataPath = process.platform === 'win32' 
      ? path.join(os.homedir(), 'AppData/Roaming')
      : path.join(os.homedir(), 'Library/Application Support');

    switch (platform) {
      case 'steam':
        if (process.platform === 'darwin') {
          // Steam Mac: ~/Library/Application Support/HelloGames/NMS/cache
          return path.join(appDataPath, 'HelloGames/NMS/cache');
        } else {
          // Steam PC: %APPDATA%\HelloGames\NMS\{steam id}\cache
          return (steamId && steamId.trim() !== '') 
            ? path.join(appDataPath, 'HelloGames/NMS', steamId, 'cache')
            : null;
        }
      case 'msstore':
      case 'gog':
      case 'gamepass':
        // MS Store/GOG/Xbox Game Pass PC: %APPDATA%\HelloGames\NMS\cache
        return path.join(appDataPath, 'HelloGames/NMS/cache');
      default:
        return null;
    }
  }
}

module.exports = ConfigManager;