const ConfigManager = require('../services/configManager');
const SteamDetection = require('../services/steamDetection');


jest.mock('fs');
jest.mock('os');
const fs = require('fs');
const os = require('os');

describe('Steam Integration Workflow', () => {
  let configManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    
    os.homedir.mockReturnValue('/mock/home');
    
    
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    
    configManager = new ConfigManager();
  });

  describe('Steam ID Detection and Cache Path Integration', () => {
    test('should detect Steam IDs and use them in buildCachePath', async () => {
      
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('HelloGames/NMS')) return true;
        if (path.includes('76561198123456789/cache')) return true;
        if (path.includes('SEASON_DATA_CACHE.JSON')) return true;
        return false;
      });

      fs.readdirSync.mockReturnValue([
        { name: 'st_76561198123456789', isDirectory: () => true },
        { name: 'someotherfile.txt', isDirectory: () => false },
        { name: 'notasteamid', isDirectory: () => true }
      ]);

      fs.statSync.mockReturnValue({
        mtime: new Date('2023-01-01')
      });

      
      const steamIds = SteamDetection.detectSteamIds();
      expect(steamIds).toHaveLength(1);
      expect(steamIds[0].steamId).toBe('st_76561198123456789');

      
      const cachePath = configManager.buildCachePath('steam', 'st_76561198123456789');
      expect(cachePath).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/st_76561198123456789/cache');
    });

    test('should return null cache path when Steam platform but no steamId provided', () => {
      
      const cachePath = configManager.buildCachePath('steam', null);
      expect(cachePath).toBeNull();
    });

    test('should return null cache path when Steam platform and empty steamId', () => {
      
      const cachePath = configManager.buildCachePath('steam', '');
      expect(cachePath).toBeNull();
    });

    test('should work with multiple Steam IDs detected', () => {
      
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('HelloGames/NMS')) return true;
        if (path.includes('cache')) return true;
        if (path.includes('SEASON_DATA_CACHE.JSON')) return true;
        return false;
      });

      fs.readdirSync.mockReturnValue([
        { name: 'st_76561198123456789', isDirectory: () => true },
        { name: 'st_76561198987654321', isDirectory: () => true },
        { name: 'notasteamid', isDirectory: () => true }
      ]);

      fs.statSync.mockImplementation((path) => {
        if (path.includes('st_76561198123456789')) {
          return { mtime: new Date('2023-01-01') };
        } else if (path.includes('st_76561198987654321')) {
          return { mtime: new Date('2023-01-02') }; 
        }
        return { mtime: new Date('2023-01-01') };
      });

      const steamIds = SteamDetection.detectSteamIds();
      expect(steamIds).toHaveLength(2);

      
      const mainSteamId = SteamDetection.getMainSteamId();
      expect(mainSteamId.steamId).toBe('st_76561198987654321');

      
      const cachePath1 = configManager.buildCachePath('steam', 'st_76561198123456789');
      const cachePath2 = configManager.buildCachePath('steam', 'st_76561198987654321');
      
      expect(cachePath1).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/st_76561198123456789/cache');
      expect(cachePath2).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/st_76561198987654321/cache');
    });
  });

  describe('Steam Detection Path Consistency', () => {
    test('should use consistent paths between SteamDetection and ConfigManager', () => {
      
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('HelloGames/NMS')) return true;
        if (path.includes('st_76561198123456789/cache')) return true;
        if (path.includes('SEASON_DATA_CACHE.JSON')) return true;
        return false;
      });

      fs.readdirSync.mockReturnValue([
        { name: 'st_76561198123456789', isDirectory: () => true }
      ]);

      fs.statSync.mockReturnValue({
        mtime: new Date('2023-01-01')
      });

      const steamIds = SteamDetection.detectSteamIds();
      const detectedCachePath = steamIds[0].cachePath;
      
      const configCachePath = configManager.buildCachePath('steam', 'st_76561198123456789');
      
      expect(detectedCachePath).toBe(configCachePath);
    });
  });

});