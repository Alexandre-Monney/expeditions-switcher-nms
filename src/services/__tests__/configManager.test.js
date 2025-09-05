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
    beforeEach(() => {
      process.env.APPDATA = '/mock/appdata';
    });

    test('should build Steam cache path on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      const result = configManager.buildCachePath('steam', '76561198123456789');
      
      expect(result).toBe('/mock/appdata/HelloGames/NMS/76561198123456789/cache');
    });

    test('should build Steam cache path on Mac', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      const result = configManager.buildCachePath('steam');
      
      expect(result).toBe('/mock/home/Library/Application Support/HelloGames/NMS/cache');
    });

    test('should build MS Store cache path', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      const result = configManager.buildCachePath('msstore');
      
      expect(result).toBe('/mock/appdata/HelloGames/NMS/cache');
    });

    test('should return null for invalid platform', () => {
      const result = configManager.buildCachePath('invalid');
      
      expect(result).toBeNull();
    });
  });
});