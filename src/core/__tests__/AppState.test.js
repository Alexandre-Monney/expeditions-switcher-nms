const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

require('../../../src/ui/state/AppState.js');

describe('AppState', () => {
    let appState;

    beforeEach(() => {
        appState = new window.AppState();
    });

    afterEach(() => {
        appState = null;
    });

    describe('initialization', () => {
        test('should initialize with default state', () => {
            const state = appState.getState();
            
            expect(state.config).toBeNull();
            expect(state.selectedPlatform).toBeNull();
            expect(state.selectedSteamId).toBeNull();
            expect(state.currentScreen).toBe('loading');
            expect(state.currentState).toBeNull();
            expect(state.availableExpeditions).toEqual([]);
            expect(state.selectedExpeditionId).toBeNull();
            expect(state.nmsRunning).toBe(false);
            expect(state.messages).toEqual([]);
        });

        test('should have empty listeners set', () => {
            expect(appState.listeners.size).toBe(0);
        });
    });

    describe('state management', () => {
        test('should update state correctly', () => {
            const updates = { 
                selectedPlatform: 'steam',
                nmsRunning: true 
            };
            
            appState.setState(updates);
            const state = appState.getState();
            
            expect(state.selectedPlatform).toBe('steam');
            expect(state.nmsRunning).toBe(true);
            expect(state.config).toBeNull(); // unchanged
        });

        test('should not mutate original state', () => {
            const originalState = appState.getState();
            appState.setState({ selectedPlatform: 'steam' });
            
            expect(originalState.selectedPlatform).toBeNull();
        });
    });

    describe('listeners', () => {
        test('should add and remove listeners correctly', () => {
            const listener = jest.fn();
            
            const unsubscribe = appState.subscribe(listener);
            expect(appState.listeners.size).toBe(1);
            
            unsubscribe();
            expect(appState.listeners.size).toBe(0);
        });

        test('should notify listeners on state change', () => {
            const listener = jest.fn();
            appState.subscribe(listener);
            
            const updates = { selectedPlatform: 'steam' };
            appState.setState(updates);
            
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ selectedPlatform: 'steam' }),
                expect.objectContaining({ selectedPlatform: null })
            );
        });

        test('should handle listener errors gracefully', () => {
            const badListener = jest.fn(() => { throw new Error('Listener error'); });
            const goodListener = jest.fn();
            
            appState.subscribe(badListener);
            appState.subscribe(goodListener);
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            appState.setState({ selectedPlatform: 'steam' });
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(goodListener).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('convenience methods', () => {
        test('should update config', () => {
            const config = { platform: 'steam', firstSetup: false };
            
            appState.updateConfig(config);
            
            expect(appState.getState().config).toEqual(config);
        });

        test('should select platform', () => {
            appState.selectPlatform('gamepass');
            
            expect(appState.getState().selectedPlatform).toBe('gamepass');
        });

        test('should select Steam ID', () => {
            appState.selectSteamId('st_76561198123456789');
            
            expect(appState.getState().selectedSteamId).toBe('st_76561198123456789');
        });

        test('should set current screen', () => {
            appState.setCurrentScreen('main');
            
            expect(appState.getState().currentScreen).toBe('main');
        });

        test('should update expedition state', () => {
            const state = { mode: 'online' };
            
            appState.updateExpeditionState(state);
            
            expect(appState.getState().currentState).toEqual(state);
        });

        test('should set available expeditions', () => {
            const expeditions = [{ id: '01_pioneers', name: 'Pioneers' }];
            
            appState.setAvailableExpeditions(expeditions);
            
            expect(appState.getState().availableExpeditions).toEqual(expeditions);
        });

        test('should select expedition', () => {
            appState.selectExpedition('01_pioneers');
            
            expect(appState.getState().selectedExpeditionId).toBe('01_pioneers');
        });

        test('should update NMS status', () => {
            appState.updateNMSStatus(true);
            
            expect(appState.getState().nmsRunning).toBe(true);
        });
    });

    describe('message system', () => {
        test('should add message with default type', () => {
            appState.addMessage('Test message');
            
            const state = appState.getState();
            expect(state.messages).toHaveLength(1);
            expect(state.messages[0].text).toBe('Test message');
            expect(state.messages[0].type).toBe('info');
            expect(state.messages[0].id).toBeDefined();
            expect(state.messages[0].timestamp).toBeInstanceOf(Date);
        });

        test('should add message with specific type', () => {
            appState.addMessage('Error message', 'error');
            
            const state = appState.getState();
            expect(state.messages[0].type).toBe('error');
        });

        test('should remove message', () => {
            appState.addMessage('Test message');
            const messageId = appState.getState().messages[0].id;
            
            appState.removeMessage(messageId);
            
            expect(appState.getState().messages).toHaveLength(0);
        });

        test('should auto-remove message after 5 seconds', () => {
            jest.useFakeTimers();
            
            appState.addMessage('Auto remove message');
            expect(appState.getState().messages).toHaveLength(1);
            
            jest.advanceTimersByTime(5000);
            
            expect(appState.getState().messages).toHaveLength(0);
            
            jest.useRealTimers();
        });
    });

    describe('reset', () => {
        test('should reset to initial state', () => {
            const listener = jest.fn();
            appState.subscribe(listener);
            
            appState.setState({
                selectedPlatform: 'steam',
                selectedSteamId: 'st_123',
                currentScreen: 'main'
            });
            
            appState.reset();
            
            const state = appState.getState();
            expect(state.config).toBeNull();
            expect(state.selectedPlatform).toBeNull();
            expect(state.selectedSteamId).toBeNull();
            expect(state.currentScreen).toBe('loading');
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ selectedPlatform: null }),
                {}
            );
        });
    });
});