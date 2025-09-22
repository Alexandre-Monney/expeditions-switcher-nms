const fs = require('fs');
const path = require('path');

class SteamOfflineDetector {
  constructor() {
    this.steamPaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam'
    ];
  }

  isSteamOffline() {
    try {
      const loginUsersPath = this._findLoginUsersFile();
      if (!loginUsersPath || !fs.existsSync(loginUsersPath)) {
        return null;
      }

      const vdfContent = fs.readFileSync(loginUsersPath, 'utf8');
      return this._parseOfflineStatus(vdfContent);
    } catch (error) {
      console.error('Error detecting Steam offline status:', error);
      return null;
    }
  }

  _findLoginUsersFile() {
    for (const steamPath of this.steamPaths) {
      const loginUsersPath = path.join(steamPath, 'config', 'loginusers.vdf');
      if (fs.existsSync(loginUsersPath)) {
        return loginUsersPath;
      }
    }
    return null;
  }

  _parseOfflineStatus(vdfContent) {
    const lines = vdfContent.split('\n');
    let isInUserSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('{') && !trimmedLine.includes('"users"')) {
        isInUserSection = true;
        continue;
      }
      
      if (isInUserSection && trimmedLine.includes('}')) {
        isInUserSection = false;
        continue;
      }
      
      if (isInUserSection && trimmedLine.includes('WantsOfflineMode')) {
        const match = trimmedLine.match(/"WantsOfflineMode"\s+"(\d+)"/);
        if (match) {
          return match[1] === '1';
        }
      }
    }
    
    return false;
  }

  getSteamStatus() {
    const isOffline = this.isSteamOffline();
    
    if (isOffline === null) {
      return {
        available: false,
        offline: null,
        message: 'Steam status unavailable'
      };
    }
    
    return {
      available: true,
      offline: isOffline,
      message: isOffline ? 'Steam: Offline mode' : 'Steam: Online mode'
    };
  }
}

module.exports = SteamOfflineDetector;