const fs = require('fs');
const path = require('path');
const ExpeditionManager = require('../expeditionManager');
const ConfigManager = require('../configManager');

// Mock filesystem operations
jest.mock('fs');
jest.mock('path');

// Mock ConfigManager
jest.mock('../configManager');

describe('ExpeditionManager', () => {
  let expeditionManager;
  let mockCachePath = '/mock/cache';
  let mockExpeditionsPath = '/mock/expeditions';
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      platform: 'steam',
      cachePath: mockCachePath,
      firstSetup: false
    };

    ConfigManager.mockImplementation(() => ({
      loadConfig: jest.fn().mockReturnValue(mockConfig)
    }));

    path.join.mockImplementation((...args) => args.join('/'));
    
    expeditionManager = new ExpeditionManager();
    expeditionManager.expeditionsDataPath = mockExpeditionsPath;
  });

  describe('getCurrentState', () => {
    test('should return error when cache path does not exist', async () => {
      mockConfig.cachePath = null;
      
      const result = await expeditionManager.getCurrentState();
      
      expect(result.mode).toBe('error');
      expect(result.error).toContain('Cache path not found');
    });

    test('should return no_cache when SEASON_DATA_CACHE.JSON does not exist', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockCachePath) return true;
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return false;
        return false;
      });

      const result = await expeditionManager.getCurrentState();
      
      expect(result.mode).toBe('no_cache');
      expect(result.error).toContain('SEASON_DATA_CACHE.JSON not found');
    });

    test('should return online mode when no backup exists', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockCachePath) return true;
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return true;
        if (filePath.includes('SEASON_DATA_CACHE_original.JSON')) return false;
        return false;
      });

      const result = await expeditionManager.getCurrentState();
      
      expect(result.mode).toBe('online');
      expect(result.cachePath).toBe(mockCachePath);
      expect(result.files.hasOriginal).toBe(true);
    });

    test('should return expedition mode when backup exists', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockCachePath) return true;
        if (filePath.includes('SEASON_DATA_CACHE')) return true;
        return false;
      });

      // Mock expedition identification
      jest.spyOn(expeditionManager, '_identifyCurrentExpedition')
        .mockResolvedValue({
          id: '01_pioneers',
          displayName: 'The Pioneers'
        });

      const result = await expeditionManager.getCurrentState();
      
      expect(result.mode).toBe('expedition');
      expect(result.currentExpedition.id).toBe('01_pioneers');
      expect(result.files.hasBackup).toBe(true);
    });
  });

  describe('createBackup', () => {
    test('should create backup successfully', async () => {
      const mockSeasonContent = JSON.stringify({test: 'data'});
      
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return true;
        if (filePath.includes('SEASON_DATA_CACHE_original.JSON')) return false;
        return false;
      });
      
      fs.readFileSync.mockReturnValue(mockSeasonContent);
      fs.copyFileSync.mockImplementation(() => {});
      
      // Mock successful backup creation
      let backupCreated = false;
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('SEASON_DATA_CACHE_original.JSON')) return backupCreated;
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return true;
        return false;
      });
      
      // Simulate backup file creation after copyFileSync
      fs.copyFileSync.mockImplementation(() => {
        backupCreated = true;
      });

      const result = await expeditionManager.createBackup();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Backup created successfully');
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        '/mock/cache/SEASON_DATA_CACHE.JSON',
        '/mock/cache/SEASON_DATA_CACHE_original.JSON'
      );
    });

    test('should return success when backup already exists', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        return true; // Both files exist
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({test: 'data'}));

      const result = await expeditionManager.createBackup();
      
      expect(result.success).toBe(true);
      expect(result.alreadyExists).toBe(true);
      expect(result.message).toBe('Backup already exists');
    });

    test('should handle invalid JSON in source file', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return true;
        if (filePath.includes('original')) return false;
        return false;
      });
      
      fs.readFileSync.mockReturnValue('invalid json');

      const result = await expeditionManager.createBackup();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });

    test('should handle missing cache path configuration', async () => {
      mockConfig.cachePath = null;

      const result = await expeditionManager.createBackup();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cache path not configured');
    });
  });

  describe('activateExpedition', () => {
    test('should activate expedition successfully', async () => {
      const expeditionContent = JSON.stringify({expedition: 'pioneers'});
      
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('01_pioneers.json')) return true;
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return true;
        return false;
      });
      
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('01_pioneers.json')) return expeditionContent;
        if (filePath.includes('expeditions-metadata.json')) {
          return JSON.stringify({
            '01_pioneers': {
              displayName: 'The Pioneers',
              description: 'First expedition'
            }
          });
        }
        return expeditionContent;
      });
      
      fs.copyFileSync.mockImplementation(() => {});
      
      // Mock successful backup creation
      jest.spyOn(expeditionManager, 'createBackup')
        .mockResolvedValue({ success: true, alreadyExists: false });

      const result = await expeditionManager.activateExpedition('01_pioneers');
      
      expect(result.success).toBe(true);
      expect(result.expeditionId).toBe('01_pioneers');
      expect(result.metadata.displayName).toBe('The Pioneers');
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        '/mock/expeditions/01_pioneers.json',
        '/mock/cache/SEASON_DATA_CACHE.JSON'
      );
    });

    test('should handle missing expedition file', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('nonexistent.json')) return false;
        return true;
      });

      const result = await expeditionManager.activateExpedition('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expedition file not found');
    });

    test('should handle backup creation failure', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({test: 'data'}));
      
      jest.spyOn(expeditionManager, 'createBackup')
        .mockResolvedValue({ 
          success: false, 
          error: 'Backup failed',
          alreadyExists: false 
        });

      const result = await expeditionManager.activateExpedition('01_pioneers');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create backup');
    });

    test('should handle invalid expedition JSON', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('01_pioneers.json')) return 'invalid json';
        return JSON.stringify({});
      });

      const result = await expeditionManager.activateExpedition('01_pioneers');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });
  });

  describe('restoreOriginal', () => {
    test('should restore original file successfully', async () => {
      const originalContent = JSON.stringify({original: 'data'});
      
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('original.JSON')) return true;
        return true;
      });
      
      fs.readFileSync.mockReturnValue(originalContent);
      fs.copyFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});

      const result = await expeditionManager.restoreOriginal();
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('online');
      expect(result.message).toContain('restored successfully');
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        '/mock/cache/SEASON_DATA_CACHE_original.JSON',
        '/mock/cache/SEASON_DATA_CACHE.JSON'
      );
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        '/mock/cache/SEASON_DATA_CACHE_original.JSON'
      );
    });

    test('should handle missing backup file', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('original.JSON')) return false;
        return true;
      });

      const result = await expeditionManager.restoreOriginal();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup file found - cannot restore');
    });

    test('should handle invalid backup JSON', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const result = await expeditionManager.restoreOriginal();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });

    test('should handle missing cache path configuration', async () => {
      mockConfig.cachePath = null;

      const result = await expeditionManager.restoreOriginal();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cache path not configured');
    });
  });

  describe('getAvailableExpeditions', () => {
    test('should return list of available expeditions with metadata', async () => {
      const mockFiles = [
        '01_pioneers.json',
        '02_beachhead.json', 
        'expeditions-metadata.json'
      ];
      
      const mockMetadata = {
        '01_pioneers': {
          displayName: 'The Pioneers',
          order: 1
        },
        '02_beachhead': {
          displayName: 'Beachhead',
          order: 2
        }
      };
      
      fs.readdirSync.mockReturnValue(mockFiles);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('expeditions-metadata.json')) {
          return JSON.stringify(mockMetadata);
        }
        return '{}';
      });

      const result = await expeditionManager.getAvailableExpeditions();
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.expeditions).toHaveLength(2);
      expect(result.expeditions[0].id).toBe('01_pioneers');
      expect(result.expeditions[0].displayName).toBe('The Pioneers');
      expect(result.expeditions[1].id).toBe('02_beachhead');
    });

    test('should handle missing expeditions directory', async () => {
      fs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      const result = await expeditionManager.getAvailableExpeditions();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Directory not found');
    });

    test('should handle missing metadata file', async () => {
      fs.readdirSync.mockReturnValue(['01_pioneers.json']);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('metadata')) {
          throw new Error('File not found');
        }
        return '{}';
      });

      const result = await expeditionManager.getAvailableExpeditions();
      
      expect(result.success).toBe(true);
      expect(result.expeditions[0]).toEqual({
        id: '01_pioneers',
        file: '01_pioneers.json'
      });
    });
  });

  describe('_identifyCurrentExpedition', () => {
    test('should identify expedition by content matching', async () => {
      const expeditionContent = JSON.stringify({expedition: 'test'});
      const mockFiles = ['01_pioneers.json', '02_beachhead.json', 'expeditions-metadata.json'];
      
      fs.readdirSync.mockReturnValue(mockFiles);
      
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('/mock/season.json')) return expeditionContent;
        if (filePath.includes('01_pioneers.json')) return expeditionContent; // Match
        if (filePath.includes('02_beachhead.json')) return JSON.stringify({other: 'data'});
        if (filePath.includes('expeditions-metadata.json')) {
          return JSON.stringify({
            '01_pioneers': { displayName: 'The Pioneers' }
          });
        }
        return '{}';
      });

      const result = await expeditionManager._identifyCurrentExpedition('/mock/season.json');
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('01_pioneers');
      expect(result.displayName).toBe('The Pioneers');
    });

    test('should return null when no expedition matches', async () => {
      const seasonContent = JSON.stringify({unique: 'content'});
      const mockFiles = ['01_pioneers.json'];
      
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('SEASON_DATA_CACHE.JSON')) return seasonContent;
        if (filePath.includes('01_pioneers.json')) return JSON.stringify({different: 'content'});
        return '{}';
      });
      
      fs.readdirSync.mockReturnValue(mockFiles);

      const result = await expeditionManager._identifyCurrentExpedition('/mock/season.json');
      
      expect(result).toBeNull();
    });
  });

  describe('_validateJsonFile', () => {
    test('should return true for valid JSON file', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({valid: 'json'}));
      
      const result = expeditionManager._validateJsonFile('/mock/file.json');
      
      expect(result).toBe(true);
    });

    test('should return false for invalid JSON file', () => {
      fs.readFileSync.mockReturnValue('invalid json');
      
      const result = expeditionManager._validateJsonFile('/mock/file.json');
      
      expect(result).toBe(false);
    });

    test('should return false when file read fails', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const result = expeditionManager._validateJsonFile('/mock/file.json');
      
      expect(result).toBe(false);
    });
  });
});