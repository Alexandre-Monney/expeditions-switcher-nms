const fs = require('fs');
const path = require('path');
const os = require('os');
const SteamDetection = require('../steamDetection');

// Mock filesystem operations
jest.mock('fs');
jest.mock('path');
jest.mock('os');


describe('SteamDetection', () => {
  let mockHomedir = '/mock/home';
  let mockAppDataPath = '/mock/home/AppData/Roaming';
  let mockNMSPath = '/mock/home/AppData/Roaming/HelloGames/NMS';

  beforeEach(() => {
    jest.clearAllMocks();
    
    os.homedir.mockReturnValue(mockHomedir);
    path.join.mockImplementation((...args) => args.join('/'));
    
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
  });

  describe('detectSteamIds', () => {
    test('should return empty array when NMS directory does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = SteamDetection.detectSteamIds();
      
      expect(fs.existsSync).toHaveBeenCalledWith(mockNMSPath);
      expect(result).toEqual([]);
    });

    test('should detect valid Steam IDs with season files', () => {
      const mockSteamId = '76561198123456789';
      const mockEntries = [
        { name: mockSteamId, isDirectory: () => true },
        { name: 'invalid', isDirectory: () => true },
        { name: 'cache', isDirectory: () => true }
      ];

      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === mockNMSPath) return true;
        if (filePath === `/mock/home/AppData/Roaming/HelloGames/NMS/${mockSteamId}/cache`) return true;
        if (filePath === `/mock/home/AppData/Roaming/HelloGames/NMS/${mockSteamId}/cache/SEASON_DATA_CACHE.JSON`) return true;
        return false;
      });
      
      fs.readdirSync.mockReturnValue(mockEntries);
      
      const result = SteamDetection.detectSteamIds();
      
      expect(result).toEqual([{
        steamId: mockSteamId,
        cachePath: `/mock/home/AppData/Roaming/HelloGames/NMS/${mockSteamId}/cache`,
        hasSeasonFile: true
      }]);
    });

    test('should filter out directories without valid Steam ID format', () => {
      const mockEntries = [
        { name: 'invalid-id', isDirectory: () => true },
        { name: '12345', isDirectory: () => true }, // Too short
        { name: '765611981234567890', isDirectory: () => true }, // Too long
        { name: 'cache', isDirectory: () => true }
      ];

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(mockEntries);
      
      const result = SteamDetection.detectSteamIds();
      
      expect(result).toEqual([]);
    });

    test('should handle filesystem errors gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = SteamDetection.detectSteamIds();
      
      expect(result).toEqual([]);
    });
  });

  describe('getMainSteamId', () => {
    test('should return null when no Steam IDs found', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = await SteamDetection.getMainSteamId();
      
      expect(result).toBeNull();
    });

    test('should return single Steam ID when only one found', async () => {
      const mockSteamData = {
        steamId: '76561198123456789',
        cachePath: '/path/to/cache',
        hasSeasonFile: true
      };

      jest.spyOn(SteamDetection, 'detectSteamIds').mockReturnValue([mockSteamData]);
      
      const result = await SteamDetection.getMainSteamId();
      
      expect(result).toEqual(mockSteamData);
    });

    test('should return most recently modified Steam ID when multiple found', async () => {
      const oldDate = new Date('2023-01-01');
      const newDate = new Date('2024-01-01');
      
      const mockSteamData1 = {
        steamId: '76561198123456789',
        cachePath: '/path/to/cache1',
        hasSeasonFile: true
      };
      
      const mockSteamData2 = {
        steamId: '76561198987654321',
        cachePath: '/path/to/cache2', 
        hasSeasonFile: true
      };

      jest.spyOn(SteamDetection, 'detectSteamIds').mockReturnValue([mockSteamData1, mockSteamData2]);
      
      fs.statSync.mockImplementation((filePath) => {
        if (filePath.includes('cache1')) {
          return { mtime: oldDate };
        } else {
          return { mtime: newDate };
        }
      });
      
      const result = await SteamDetection.getMainSteamId();
      
      expect(result).toEqual(mockSteamData2);
    });
  });
});