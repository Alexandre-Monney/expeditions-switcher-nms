const fs = require('fs');
const path = require('path');
const os = require('os');

class SteamDetection {
  static detectSteamIds() {
    try {
      const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming');
      const nmsBasePath = path.join(appDataPath, 'HelloGames', 'NMS');
      
      if (!fs.existsSync(nmsBasePath)) {
        return [];
      }

      const entries = fs.readdirSync(nmsBasePath, { withFileTypes: true });
      const steamIds = [];

      for (const entry of entries) {
        if (entry.isDirectory() && /^st_\d{17}$/.test(entry.name)) {
          const cachePath = path.join(nmsBasePath, entry.name, 'cache');
          const seasonFile = path.join(cachePath, 'SEASON_DATA_CACHE.JSON');
          
          if (fs.existsSync(cachePath) && fs.existsSync(seasonFile)) {
            steamIds.push({
              steamId: entry.name,
              cachePath: cachePath,
              hasSeasonFile: true
            });
          }
        }
      }

      return steamIds;
    } catch (error) {
      console.error('Error detecting Steam IDs:', error);
      return [];
    }
  }

  static getMainSteamId() {
    const steamIds = this.detectSteamIds();
    
    if (steamIds.length === 0) {
      return null;
    }
    
    if (steamIds.length === 1) {
      return steamIds[0];
    }

    let mostRecent = steamIds[0];
    for (const steamData of steamIds) {
      const seasonFile = path.join(steamData.cachePath, 'SEASON_DATA_CACHE.JSON');
      try {
        const currentStats = fs.statSync(path.join(mostRecent.cachePath, 'SEASON_DATA_CACHE.JSON'));
        const candidateStats = fs.statSync(seasonFile);
        
        if (candidateStats.mtime > currentStats.mtime) {
          mostRecent = steamData;
        }
      } catch (error) {
        console.error('Error checking file stats:', error);
      }
    }
    
    return mostRecent;
  }
}

module.exports = SteamDetection;