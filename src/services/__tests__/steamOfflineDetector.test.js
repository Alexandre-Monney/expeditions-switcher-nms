const fs = require('fs');
const path = require('path');
const SteamOfflineDetector = require('../steamOfflineDetector');

jest.mock('fs');
jest.mock('path');

describe('SteamOfflineDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new SteamOfflineDetector();
    jest.clearAllMocks();
  });

  describe('_parseOfflineStatus', () => {
    it('should return true when WantsOfflineMode is 1', () => {
      const vdfContent = `"users"
{
  "76561198123456789"
  {
    "AccountName"     "testuser"
    "PersonaName"     "TestUser"
    "RememberPassword"    "1"
    "WantsOfflineMode"    "1"
    "Timestamp"       "1640995200"
  }
}`;
      
      const result = detector._parseOfflineStatus(vdfContent);
      expect(result).toBe(true);
    });

    it('should return false when WantsOfflineMode is 0', () => {
      const vdfContent = `"users"
{
  "76561198123456789"
  {
    "AccountName"     "testuser"
    "PersonaName"     "TestUser"
    "RememberPassword"    "1"
    "WantsOfflineMode"    "0"
    "Timestamp"       "1640995200"
  }
}`;
      
      const result = detector._parseOfflineStatus(vdfContent);
      expect(result).toBe(false);
    });

    it('should return false when WantsOfflineMode is not present', () => {
      const vdfContent = `"users"
{
  "76561198123456789"
  {
    "AccountName"     "testuser"
    "PersonaName"     "TestUser"
    "RememberPassword"    "1"
    "Timestamp"       "1640995200"
  }
}`;
      
      const result = detector._parseOfflineStatus(vdfContent);
      expect(result).toBe(false);
    });

    it('should handle multiple users and return first WantsOfflineMode found', () => {
      const vdfContent = `"users"
{
  "76561198123456789"
  {
    "AccountName"     "user1"
    "WantsOfflineMode"    "1"
  }
  "76561198987654321"
  {
    "AccountName"     "user2"
    "WantsOfflineMode"    "0"
  }
}`;
      
      const result = detector._parseOfflineStatus(vdfContent);
      expect(result).toBe(true);
    });

    it('should handle malformed VDF content gracefully', () => {
      const vdfContent = 'invalid vdf content';
      
      const result = detector._parseOfflineStatus(vdfContent);
      expect(result).toBe(false);
    });
  });

  describe('_findLoginUsersFile', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('\\'));
    });

    it('should find loginusers.vdf in first Steam path', () => {
      fs.existsSync.mockImplementation((filePath) => 
        filePath === 'C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf'
      );

      const result = detector._findLoginUsersFile();
      expect(result).toBe('C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf');
    });

    it('should find loginusers.vdf in second Steam path when first not found', () => {
      fs.existsSync.mockImplementation((filePath) => 
        filePath === 'C:\\Program Files\\Steam\\config\\loginusers.vdf'
      );

      const result = detector._findLoginUsersFile();
      expect(result).toBe('C:\\Program Files\\Steam\\config\\loginusers.vdf');
    });

    it('should return null when no loginusers.vdf found', () => {
      fs.existsSync.mockReturnValue(false);

      const result = detector._findLoginUsersFile();
      expect(result).toBeNull();
    });
  });

  describe('isSteamOffline', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('\\'));
    });

    it('should return true when Steam is offline', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`"users"
{
  "76561198123456789"
  {
    "WantsOfflineMode"    "1"
  }
}`);

      const result = detector.isSteamOffline();
      expect(result).toBe(true);
    });

    it('should return false when Steam is online', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`"users"
{
  "76561198123456789"
  {
    "WantsOfflineMode"    "0"
  }
}`);

      const result = detector.isSteamOffline();
      expect(result).toBe(false);
    });

    it('should return null when loginusers.vdf not found', () => {
      fs.existsSync.mockReturnValue(false);

      const result = detector.isSteamOffline();
      expect(result).toBeNull();
    });

    it('should return null when file read fails', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = detector.isSteamOffline();
      expect(result).toBeNull();
    });
  });

  describe('getSteamStatus', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('\\'));
    });

    it('should return offline status when Steam is offline', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`"users"
{
  "76561198123456789"
  {
    "WantsOfflineMode"    "1"
  }
}`);

      const result = detector.getSteamStatus();
      expect(result).toEqual({
        available: true,
        offline: true,
        message: 'Steam: Offline mode'
      });
    });

    it('should return online status when Steam is online', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(`"users"
{
  "76561198123456789"
  {
    "WantsOfflineMode"    "0"
  }
}`);

      const result = detector.getSteamStatus();
      expect(result).toEqual({
        available: true,
        offline: false,
        message: 'Steam: Online mode'
      });
    });

    it('should return unavailable status when Steam config not found', () => {
      fs.existsSync.mockReturnValue(false);

      const result = detector.getSteamStatus();
      expect(result).toEqual({
        available: false,
        offline: null,
        message: 'Steam status unavailable'
      });
    });
  });
});