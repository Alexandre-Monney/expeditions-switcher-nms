const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

require('../../../src/ui/state/AppState.js');
require('../PlatformController.js');

describe('PlatformController', () => {
    let appState;
    let platformController;
    let mockElectronAPI;

    beforeEach(() => {
        appState = new window.AppState();
        platformController = new window.PlatformController(appState);
        
        mockElectronAPI = {
            loadConfig: jest.fn(),
            saveConfig: jest.fn(),
            buildCachePath: jest.fn(),
            detectSteamIds: jest.fn()
        };
        
        global.window.electronAPI = mockElectronAPI;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loadConfig', () => {
        test('should load config successfully', async () => {
            const mockConfig = { platform: 'steam', firstSetup: false };
            mockElectronAPI.loadConfig.mockResolvedValue(mockConfig);
            
            const result = await platformController.loadConfig();
            
            expect(result).toEqual(mockConfig);
            expect(appState.getState().config).toEqual(mockConfig);
        });

        test('should handle config loading error', async () => {
            mockElectronAPI.loadConfig.mockRejectedValue(new Error('Load error'));
            
            const result = await platformController.loadConfig();
            
            expect(result).toEqual({ firstSetup: true });
            expect(appState.getState().config).toEqual({ firstSetup: true });
        });
    });

    describe('selectPlatform', () => {
        test('should select non-Steam platform', () => {
            platformController.selectPlatform('gamepass');
            
            expect(appState.getState().selectedPlatform).toBe('gamepass');
        });

        test('should select Steam platform and trigger detection', async () => {
            const detectSpy = jest.spyOn(platformController, 'detectSteamIds').mockResolvedValue([]);
            
            platformController.selectPlatform('steam');
            
            expect(appState.getState().selectedPlatform).toBe('steam');
            expect(detectSpy).toHaveBeenCalled();
        });
    });

    describe('detectSteamIds', () => {
        test('should handle no Steam IDs found', async () => {
            mockElectronAPI.detectSteamIds.mockResolvedValue([]);
            
            const result = await platformController.detectSteamIds();
            
            expect(result).toEqual([]);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle single Steam ID found', async () => {
            const steamIds = [{ steamId: 'st_123', hasSeasonFile: true }];
            mockElectronAPI.detectSteamIds.mockResolvedValue(steamIds);
            
            const result = await platformController.detectSteamIds();
            
            expect(result).toEqual(steamIds);
            expect(appState.getState().selectedSteamId).toBe('st_123');
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('success');
        });

        test('should handle multiple Steam IDs found', async () => {
            const steamIds = [
                { steamId: 'st_123', hasSeasonFile: true },
                { steamId: 'st_456', hasSeasonFile: true }
            ];
            mockElectronAPI.detectSteamIds.mockResolvedValue(steamIds);
            
            const result = await platformController.detectSteamIds();
            
            expect(result).toEqual(steamIds);
            expect(appState.getState().selectedSteamId).toBeNull();
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('info');
        });

        test('should handle detection error', async () => {
            mockElectronAPI.detectSteamIds.mockRejectedValue(new Error('Detection error'));
            
            const result = await platformController.detectSteamIds();
            
            expect(result).toEqual([]);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('selectSteamId', () => {
        test('should select Steam ID', () => {
            platformController.selectSteamId('st_123456789');
            
            expect(appState.getState().selectedSteamId).toBe('st_123456789');
        });
    });

    describe('canContinueSetup', () => {
        test('should return false when no platform selected', () => {
            expect(platformController.canContinueSetup()).toBe(false);
        });

        test('should return false when Steam selected but no Steam ID', () => {
            appState.selectPlatform('steam');
            
            expect(platformController.canContinueSetup()).toBe(false);
        });

        test('should return true when Steam selected with Steam ID', () => {
            appState.selectPlatform('steam');
            appState.selectSteamId('st_123456789');
            
            expect(platformController.canContinueSetup()).toBe(true);
        });

        test('should return true when non-Steam platform selected', () => {
            appState.selectPlatform('gamepass');
            
            expect(platformController.canContinueSetup()).toBe(true);
        });
    });

    describe('saveConfiguration', () => {
        test('should save configuration successfully', async () => {
            appState.selectPlatform('steam');
            appState.selectSteamId('st_123456789');
            
            mockElectronAPI.buildCachePath.mockResolvedValue('/path/to/cache');
            mockElectronAPI.saveConfig.mockResolvedValue(true);
            
            const result = await platformController.saveConfiguration();
            
            expect(result).toBe(true);
            expect(mockElectronAPI.buildCachePath).toHaveBeenCalledWith('steam', 'st_123456789');
            expect(mockElectronAPI.saveConfig).toHaveBeenCalledWith({
                platform: 'steam',
                steamId: 'st_123456789',
                firstSetup: false,
                cachePath: '/path/to/cache'
            });
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('success');
        });

        test('should fail when setup incomplete', async () => {
            const result = await platformController.saveConfiguration();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should fail when cache path cannot be determined', async () => {
            appState.selectPlatform('steam');
            appState.selectSteamId('st_123456789');
            
            mockElectronAPI.buildCachePath.mockResolvedValue(null);
            
            const result = await platformController.saveConfiguration();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should fail when save fails', async () => {
            appState.selectPlatform('gamepass');
            
            mockElectronAPI.buildCachePath.mockResolvedValue('/path/to/cache');
            mockElectronAPI.saveConfig.mockResolvedValue(false);
            
            const result = await platformController.saveConfiguration();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle save error exception', async () => {
            appState.selectPlatform('gamepass');
            
            mockElectronAPI.buildCachePath.mockRejectedValue(new Error('Build error'));
            
            const result = await platformController.saveConfiguration();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('changePlatform', () => {
        test('should reset platform selection and switch to setup', async () => {
            appState.setState({
                selectedPlatform: 'steam',
                selectedSteamId: 'st_123456789',
                currentScreen: 'main'
            });
            
            await platformController.changePlatform();
            
            const state = appState.getState();
            expect(state.selectedPlatform).toBeNull();
            expect(state.selectedSteamId).toBeNull();
            expect(state.currentScreen).toBe('setup');
        });
    });
});