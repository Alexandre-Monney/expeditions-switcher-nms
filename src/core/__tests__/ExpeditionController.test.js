const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

require('../../../src/ui/state/AppState.js');
require('../ExpeditionController.js');

describe('ExpeditionController', () => {
    let appState;
    let expeditionController;
    let mockElectronAPI;

    beforeEach(() => {
        appState = new window.AppState();
        expeditionController = new window.ExpeditionController(appState);
        
        mockElectronAPI = {
            getCurrentExpeditionState: jest.fn(),
            getAvailableExpeditions: jest.fn(),
            activateExpedition: jest.fn(),
            restoreOriginal: jest.fn(),
            isNMSRunning: jest.fn()
        };
        
        global.window.electronAPI = mockElectronAPI;
        jest.useFakeTimers();
    });

    afterEach(() => {
        expeditionController.destroy();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('refreshExpeditionState', () => {
        test('should refresh expedition state successfully', async () => {
            const mockState = { mode: 'online' };
            mockElectronAPI.getCurrentExpeditionState.mockResolvedValue(mockState);
            
            const result = await expeditionController.refreshExpeditionState();
            
            expect(result).toEqual(mockState);
            expect(appState.getState().currentState).toEqual(mockState);
        });

        test('should handle refresh error', async () => {
            mockElectronAPI.getCurrentExpeditionState.mockRejectedValue(new Error('Refresh error'));
            
            const result = await expeditionController.refreshExpeditionState();
            
            expect(result).toBeNull();
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('loadAvailableExpeditions', () => {
        test('should load expeditions successfully', async () => {
            const mockExpeditions = [
                { id: '01_pioneers', displayName: 'The Pioneers' },
                { id: '02_beachhead', displayName: 'Beachhead' }
            ];
            mockElectronAPI.getAvailableExpeditions.mockResolvedValue({
                success: true,
                expeditions: mockExpeditions
            });
            
            const result = await expeditionController.loadAvailableExpeditions();
            
            expect(result).toEqual(mockExpeditions);
            expect(appState.getState().availableExpeditions).toEqual(mockExpeditions);
        });

        test('should handle loading failure', async () => {
            mockElectronAPI.getAvailableExpeditions.mockResolvedValue({
                success: false,
                error: 'Load error'
            });
            
            const result = await expeditionController.loadAvailableExpeditions();
            
            expect(result).toEqual([]);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle loading exception', async () => {
            mockElectronAPI.getAvailableExpeditions.mockRejectedValue(new Error('Exception'));
            
            const result = await expeditionController.loadAvailableExpeditions();
            
            expect(result).toEqual([]);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('selectExpedition', () => {
        test('should select expedition', () => {
            expeditionController.selectExpedition('01_pioneers');
            
            expect(appState.getState().selectedExpeditionId).toBe('01_pioneers');
        });
    });

    describe('activateExpedition', () => {
        test('should activate expedition successfully', async () => {
            mockElectronAPI.activateExpedition.mockResolvedValue({
                success: true,
                metadata: { displayName: 'The Pioneers' }
            });
            mockElectronAPI.getCurrentExpeditionState.mockResolvedValue({ mode: 'expedition' });
            
            const result = await expeditionController.activateExpedition('01_pioneers');
            
            expect(result).toBe(true);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('success');
        });

        test('should fail when no expedition selected', async () => {
            const result = await expeditionController.activateExpedition(null);
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should fail when NMS is running', async () => {
            appState.updateNMSStatus(true);
            
            const result = await expeditionController.activateExpedition('01_pioneers');
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle activation failure', async () => {
            mockElectronAPI.activateExpedition.mockResolvedValue({
                success: false,
                error: 'Activation failed'
            });
            
            const result = await expeditionController.activateExpedition('01_pioneers');
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle activation exception', async () => {
            mockElectronAPI.activateExpedition.mockRejectedValue(new Error('Exception'));
            
            const result = await expeditionController.activateExpedition('01_pioneers');
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('restoreOriginal', () => {
        test('should restore original successfully', async () => {
            mockElectronAPI.restoreOriginal.mockResolvedValue({ success: true });
            mockElectronAPI.getCurrentExpeditionState.mockResolvedValue({ mode: 'online' });
            
            const result = await expeditionController.restoreOriginal();
            
            expect(result).toBe(true);
            expect(appState.getState().selectedExpeditionId).toBeNull();
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('success');
        });

        test('should fail when NMS is running', async () => {
            appState.updateNMSStatus(true);
            
            const result = await expeditionController.restoreOriginal();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle restore failure', async () => {
            mockElectronAPI.restoreOriginal.mockResolvedValue({
                success: false,
                error: 'Restore failed'
            });
            
            const result = await expeditionController.restoreOriginal();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });

        test('should handle restore exception', async () => {
            mockElectronAPI.restoreOriginal.mockRejectedValue(new Error('Exception'));
            
            const result = await expeditionController.restoreOriginal();
            
            expect(result).toBe(false);
            expect(appState.getState().messages).toHaveLength(1);
            expect(appState.getState().messages[0].type).toBe('error');
        });
    });

    describe('switchToOnlineMode', () => {
        test('should clear selected expedition', () => {
            appState.selectExpedition('01_pioneers');
            
            expeditionController.switchToOnlineMode();
            
            expect(appState.getState().selectedExpeditionId).toBeNull();
        });
    });

    describe('NMS monitoring', () => {
        test('should start monitoring', () => {
            mockElectronAPI.isNMSRunning.mockResolvedValue(false);
            
            expeditionController.startNMSMonitoring();
            
            expect(expeditionController.nmsMonitoringInterval).not.toBeNull();
        });

        test('should stop monitoring', () => {
            expeditionController.startNMSMonitoring();
            const intervalId = expeditionController.nmsMonitoringInterval;
            
            expeditionController.stopNMSMonitoring();
            
            expect(expeditionController.nmsMonitoringInterval).toBeNull();
        });

        test('should check NMS status', async () => {
            mockElectronAPI.isNMSRunning.mockResolvedValue(true);
            
            await expeditionController.checkNMSStatus();
            
            expect(appState.getState().nmsRunning).toBe(true);
        });

        test('should handle NMS status check error', async () => {
            mockElectronAPI.isNMSRunning.mockRejectedValue(new Error('Check error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            await expeditionController.checkNMSStatus();
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should monitor NMS status periodically', async () => {
            mockElectronAPI.isNMSRunning.mockResolvedValue(false);
            
            expeditionController.startNMSMonitoring();
            
            expect(mockElectronAPI.isNMSRunning).toHaveBeenCalledTimes(1);
            
            jest.advanceTimersByTime(3000);
            await Promise.resolve(); // Let promises resolve
            
            expect(mockElectronAPI.isNMSRunning).toHaveBeenCalledTimes(2);
        });
    });

    describe('utility methods', () => {
        test('should get expedition by ID', () => {
            const expeditions = [
                { id: '01_pioneers', displayName: 'The Pioneers' },
                { id: '02_beachhead', displayName: 'Beachhead' }
            ];
            appState.setAvailableExpeditions(expeditions);
            
            const result = expeditionController.getExpeditionById('01_pioneers');
            
            expect(result).toEqual(expeditions[0]);
        });

        test('should return null for non-existent expedition', () => {
            const result = expeditionController.getExpeditionById('non_existent');
            
            expect(result).toBeNull();
        });

        test('should get current expedition', () => {
            const expeditionState = {
                mode: 'expedition',
                currentExpedition: { id: '01_pioneers', displayName: 'The Pioneers' }
            };
            appState.updateExpeditionState(expeditionState);
            
            const result = expeditionController.getCurrentExpedition();
            
            expect(result).toEqual(expeditionState.currentExpedition);
        });

        test('should return null when not in expedition mode', () => {
            appState.updateExpeditionState({ mode: 'online' });
            
            const result = expeditionController.getCurrentExpedition();
            
            expect(result).toBeNull();
        });
    });

    describe('destroy', () => {
        test('should stop monitoring on destroy', () => {
            expeditionController.startNMSMonitoring();
            
            expeditionController.destroy();
            
            expect(expeditionController.nmsMonitoringInterval).toBeNull();
        });
    });
});