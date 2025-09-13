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
      cachePath: null,
      language: 'fr'
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
    const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming');

    switch (platform) {
      case 'steam':
        return (steamId && steamId.trim() !== '') 
          ? path.join(appDataPath, 'HelloGames/NMS', steamId, 'cache')
          : null;
      case 'msstore':
      case 'gog':
      case 'gamepass':
        const baseNMSPath = path.join(appDataPath, 'HelloGames/NMS');
        const defaultUserPath = path.join(baseNMSPath, 'DefaultUser/cache');
        const directCachePath = path.join(baseNMSPath, 'cache');
        
        if (this._dirExists(defaultUserPath)) {
          return defaultUserPath;
        } else if (this._dirExists(directCachePath)) {
          return directCachePath;
        } else {
          return defaultUserPath;
        }
      default:
        return null;
    }
  }

  /**
   * Vérifie si un dossier existe
   * @param {string} dirPath Chemin du dossier à vérifier
   * @returns {boolean}
   */
  _dirExists(dirPath) {
    try {
      return fs.existsSync(dirPath);
    } catch (error) {
      return false;
    }
  }
}

module.exports = ConfigManager;