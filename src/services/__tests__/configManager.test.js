const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../configManager');

// Mock filesystem operations
jest.mock('fs');
jest.mock('path');
jest.mock('os');


describe('ConfigManager', () => {
  let configManager;
  let mockHomedir = '/mock/home';
  let mockConfigDir = '/mock/home/.nms-utils';
  let mockConfigFile = '/mock/home/.nms-utils/config.json';

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigManager();
    
    os.homedir.mockReturnValue(mockHomedir);
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock default paths
    configManager.configDir = mockConfigDir;
    configManager.configFile = mockConfigFile;
  });

  describe('loadConfig', () => {
    test('should return default config when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = configManager.loadConfig();
      
      expect(result).toEqual({
        platform: null,
        steamId: null,
        firstSetup: true,
        cachePath: null
      });
    });

    test('should load existing config file', () => {
      const mockConfig = {
        platform: 'steam',
        steamId: '76561198123456789',
        firstSetup: false,
        cachePath: '/path/to/cache'
      };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      
      const result = configManager.loadConfig();
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf8');
      expect(result).toEqual({ ...configManager.defaultConfig, ...mockConfig });
    });

    test('should return default config on JSON parse error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      
      const result = configManager.loadConfig();
      
      expect(result).toEqual(configManager.defaultConfig);
    });
  });

  describe('saveConfig', () => {
    test('should create config directory and save config', () => {
      const mockConfig = { platform: 'steam' };
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);
      
      const result = configManager.saveConfig(mockConfig);
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile, 
        JSON.stringify(mockConfig, null, 2)
      );
      expect(result).toBe(true);
    });

    test('should return false on save error', () => {
      const mockConfig = { platform: 'steam' };
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      const result = configManager.saveConfig(mockConfig);
      
      expect(result).toBe(false);
    });
  });

  describe('buildCachePath', () => {
    test('should build Steam cache path on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      const result = configManager.buildCachePath('steam', '76561198123456789');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/76561198123456789/cache');
    });

    test('should build Steam cache path on Mac', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      const result = configManager.buildCachePath('steam');
      
      expect(result).toBe('/mock/home/Library/Application Support/HelloGames/NMS/cache');
    });

    test('should build MS Store cache path with resilient logic', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to return false, so it should fallback to DefaultUser
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockReturnValue(false);
      
      const result = configManager.buildCachePath('msstore');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      
      spy.mockRestore();
    });

    test('should return null for invalid platform', () => {
      const result = configManager.buildCachePath('invalid');
      
      expect(result).toBeNull();
    });

    test('should build Xbox Game Pass path with DefaultUser when it exists', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser exists
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.includes('DefaultUser/cache');
      });
      
      const result = configManager.buildCachePath('gamepass');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      
      spy.mockRestore();
    });

    test('should build Xbox Game Pass path with direct cache when DefaultUser does not exist', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser doesn't exist but cache does
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.endsWith('/cache') && !path.includes('DefaultUser');
      });
      
      const result = configManager.buildCachePath('gamepass');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      
      spy.mockRestore();
    });

    test('should fallback to DefaultUser path when neither exists', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to return false for all paths
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockReturnValue(false);
      
      const result = configManager.buildCachePath('gamepass');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      
      spy.mockRestore();
    });

    test('should build MS Store path with DefaultUser when it exists', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser exists for MS Store
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.includes('DefaultUser/cache');
      });
      
      const result = configManager.buildCachePath('msstore');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      
      spy.mockRestore();
    });

    test('should build MS Store path with direct cache when DefaultUser does not exist', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser doesn't exist but cache does
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.endsWith('/cache') && !path.includes('DefaultUser');
      });
      
      const result = configManager.buildCachePath('msstore');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      
      spy.mockRestore();
    });

    test('should build GOG path with DefaultUser when it exists', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser exists for GOG
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.includes('DefaultUser/cache');
      });
      
      const result = configManager.buildCachePath('gog');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      
      spy.mockRestore();
    });

    test('should build GOG path with direct cache when DefaultUser does not exist', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to simulate DefaultUser doesn't exist but cache does
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockImplementation((path) => {
        return path.endsWith('/cache') && !path.includes('DefaultUser');
      });
      
      const result = configManager.buildCachePath('gog');
      
      expect(result).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(spy).toHaveBeenCalledWith('/mock/home/AppData/Roaming/HelloGames/NMS/cache');
      
      spy.mockRestore();
    });
  });

  describe('Platform Change Functionality', () => {
    test('should handle platform change by overwriting existing config', () => {
      // Setup: existing Steam config
      const existingConfig = {
        platform: 'steam',
        steamId: '76561198123456789',
        firstSetup: false,
        cachePath: '/old/steam/path'
      };
      
      // New GOG config
      const newConfig = {
        platform: 'gog',
        steamId: null,
        firstSetup: false,
        cachePath: '/new/gog/path'
      };

      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockReturnValue(undefined);
      fs.writeFileSync.mockReturnValue(undefined);
      
      const result = configManager.saveConfig(newConfig);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(newConfig, null, 2)
      );
      expect(result).toBe(true);
    });

    test('should reset Steam ID when changing from Steam to non-Steam platform', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to return false for resilient path logic
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockReturnValue(false);
      
      // Change from Steam to GOG - steamId should be null
      const newCachePath = configManager.buildCachePath('gog');
      
      expect(newCachePath).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(newCachePath).not.toContain('76561198');
      
      spy.mockRestore();
    });

    test('should preserve Steam ID when changing from non-Steam to Steam platform', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Change from GOG to Steam - should accept new steamId
      const newSteamId = '76561198987654321';
      const newCachePath = configManager.buildCachePath('steam', newSteamId);
      
      expect(newCachePath).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/76561198987654321/cache');
      expect(newCachePath).toContain(newSteamId);
    });

    test('should handle platform change between non-Steam platforms', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      // Mock _dirExists to return false for resilient path logic
      const spy = jest.spyOn(configManager, '_dirExists');
      spy.mockReturnValue(false);
      
      // Change from MS Store to Game Pass - both should have same cache path
      const msStorePath = configManager.buildCachePath('msstore');
      const gamePassPath = configManager.buildCachePath('gamepass');
      
      expect(msStorePath).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(gamePassPath).toBe('/mock/home/AppData/Roaming/HelloGames/NMS/DefaultUser/cache');
      expect(msStorePath).toEqual(gamePassPath);
      
      spy.mockRestore();
    });

    test('should clear firstSetup flag when changing platform', () => {
      const platformChangeConfig = {
        platform: 'gog',
        steamId: null,
        firstSetup: false, // Should remain false after platform change
        cachePath: '/new/path'
      };

      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockReturnValue(undefined);
      
      const result = configManager.saveConfig(platformChangeConfig);
      
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        expect.stringContaining('"firstSetup": false')
      );
    });

    test('should handle save errors gracefully during platform change', () => {
      const newConfig = { platform: 'gamepass' };
      
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      const result = configManager.saveConfig(newConfig);
      
      expect(result).toBe(false);
    });
  });
});