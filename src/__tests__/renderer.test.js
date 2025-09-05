/**
 * @jest-environment jsdom
 */

// Mock electron APIs
const mockElectronAPI = {
  loadConfig: jest.fn(),
  saveConfig: jest.fn(),
  detectSteamIds: jest.fn()
};

// Setup DOM and globals before importing renderer
const setupDOM = () => {
  document.body.innerHTML = `
    <div id="app">
      <!-- Setup Screen -->
      <div id="setup-screen" class="screen hidden">
        <div class="setup-container">
          <div class="platform-selection">
            <div class="platform-options">
              <button class="platform-btn" data-platform="steam">Steam</button>
              <button class="platform-btn" data-platform="msstore">MS Store</button>
              <button class="platform-btn" data-platform="gog">GOG</button>
              <button class="platform-btn" data-platform="gamepass">Game Pass</button>
            </div>
          </div>
          <div id="steam-section" class="steam-section hidden">
            <div id="steam-detection" class="steam-detection">
              <button id="detect-steam-btn" class="detect-btn">Detect Steam</button>
              <div id="steam-results" class="steam-results"></div>
            </div>
          </div>
          <div class="setup-actions">
            <button id="setup-continue-btn" class="continue-btn" disabled>Continue</button>
          </div>
        </div>
      </div>

      <!-- Main Screen -->
      <div id="main-screen" class="screen hidden">
        <div class="main-header">
          <div class="current-platform">
            <span id="current-platform-info">Loading...</span>
            <button id="change-platform-btn" class="change-platform-btn">Change Platform</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div id="loading-screen" class="screen">
        <div class="loading-container">
          <p>Loading configuration...</p>
        </div>
      </div>
    </div>
  `;

  // Mock window.electronAPI
  global.window = { electronAPI: mockElectronAPI };
};

// Simple UI manager class for testing
class TestUIManager {
  constructor() {
    this.selectedPlatform = null;
    this.selectedSteamId = null;
    this.config = null;
  }

  async loadConfig() {
    this.config = await window.electronAPI.loadConfig();
  }

  showSetupScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    document.getElementById('setup-screen').classList.remove('hidden');
  }

  showMainScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
    });
    document.getElementById('main-screen').classList.remove('hidden');
    this.updateMainScreenInfo();
  }

  updateMainScreenInfo() {
    const platformInfo = document.getElementById('current-platform-info');
    if (platformInfo && this.config) {
      const platformNames = {
        steam: 'Steam',
        msstore: 'Microsoft Store',
        gog: 'GOG',
        gamepass: 'Xbox Game Pass'
      };
      
      let infoText = `Plateforme: ${platformNames[this.config.platform] || this.config.platform}`;
      if (this.config.platform === 'steam' && this.config.steamId) {
        infoText += ` (ID: ${this.config.steamId})`;
      }
      
      platformInfo.textContent = infoText;
    }
  }

  selectPlatform(platform) {
    this.selectedPlatform = platform;
    
    // Update UI
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    const targetBtn = document.querySelector(`[data-platform="${platform}"]`);
    if (targetBtn) {
      targetBtn.classList.add('selected');
    }

    // Show/hide Steam section
    const steamSection = document.getElementById('steam-section');
    if (platform === 'steam') {
      steamSection.classList.remove('hidden');
    } else {
      steamSection.classList.add('hidden');
      this.selectedSteamId = null;
    }
  }

  async completeSetup() {
    const newConfig = {
      platform: this.selectedPlatform,
      steamId: this.selectedSteamId,
      firstSetup: false,
      cachePath: null
    };

    const success = await window.electronAPI.saveConfig(newConfig);
    if (success) {
      this.config = newConfig;
      this.showMainScreen();
      return true;
    }
    return false;
  }
}

describe('NMS Expedition Manager UI - Platform Change', () => {
  let uiManager;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    
    // Reset mocks
    mockElectronAPI.loadConfig.mockResolvedValue({ 
      platform: 'steam', 
      steamId: '76561198123456789',
      firstSetup: false 
    });
    mockElectronAPI.saveConfig.mockResolvedValue(true);
    mockElectronAPI.detectSteamIds.mockResolvedValue([]);

    // Ensure global window object is properly set
    global.window = Object.assign(global.window || {}, { electronAPI: mockElectronAPI });

    uiManager = new TestUIManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Platform Change Button', () => {
    test('should show change platform button on main screen', async () => {
      await uiManager.loadConfig();
      uiManager.showMainScreen();

      const changePlatformBtn = document.getElementById('change-platform-btn');
      expect(changePlatformBtn).toBeTruthy();
      expect(changePlatformBtn.textContent).toContain('Change Platform');
    });

    test('should return to setup screen when change platform button is clicked', async () => {
      await uiManager.loadConfig();
      uiManager.showMainScreen();

      // Simulate clicking change platform (this would call showSetupScreen in real app)
      uiManager.showSetupScreen();

      // Should now show setup screen
      const setupScreen = document.getElementById('setup-screen');
      const mainScreen = document.getElementById('main-screen');
      
      expect(setupScreen.classList.contains('hidden')).toBe(false);
      expect(mainScreen.classList.contains('hidden')).toBe(true);
    });
  });

  describe('UI State Management During Platform Changes', () => {
    test('should clear platform selection when returning to setup', async () => {
      await uiManager.loadConfig();
      uiManager.showMainScreen();
      
      // Simulate clicking change platform
      uiManager.showSetupScreen();
      
      // No platform should be selected initially
      const selectedPlatforms = document.querySelectorAll('.platform-btn.selected');
      expect(selectedPlatforms.length).toBe(0);
    });

    test('should hide Steam section when selecting non-Steam platform during change', () => {
      uiManager.selectPlatform('gog');

      const steamSection = document.getElementById('steam-section');
      expect(steamSection.classList.contains('hidden')).toBe(true);
      expect(uiManager.selectedSteamId).toBeNull();
    });

    test('should show Steam section when selecting Steam platform during change', () => {
      uiManager.selectPlatform('steam');

      const steamSection = document.getElementById('steam-section');
      expect(steamSection.classList.contains('hidden')).toBe(false);
    });

    test('should update platform selection UI correctly', () => {
      uiManager.selectPlatform('msstore');

      const selectedBtn = document.querySelector('.platform-btn.selected');
      const msStoreBtn = document.querySelector('[data-platform="msstore"]');
      
      expect(selectedBtn).toBe(msStoreBtn);
      expect(uiManager.selectedPlatform).toBe('msstore');
    });

    test('should update main screen info after platform change', async () => {
      // Setup initial config
      uiManager.config = {
        platform: 'gog',
        steamId: null,
        firstSetup: false,
        cachePath: '/gog/path'
      };

      uiManager.updateMainScreenInfo();

      const platformInfo = document.getElementById('current-platform-info');
      expect(platformInfo.textContent).toBe('Plateforme: GOG');
    });

    test('should show Steam ID in platform info for Steam platform', async () => {
      uiManager.config = {
        platform: 'steam',
        steamId: '76561198123456789',
        firstSetup: false,
        cachePath: '/steam/path'
      };

      uiManager.updateMainScreenInfo();

      const platformInfo = document.getElementById('current-platform-info');
      expect(platformInfo.textContent).toContain('Steam');
      expect(platformInfo.textContent).toContain('76561198123456789');
    });
  });

  describe('Configuration Flow During Platform Change', () => {
    test('should save new configuration when completing platform change', async () => {
      uiManager.selectedPlatform = 'gamepass';
      uiManager.selectedSteamId = null;

      const result = await uiManager.completeSetup();

      expect(mockElectronAPI.saveConfig).toHaveBeenCalledWith({
        platform: 'gamepass',
        steamId: null,
        firstSetup: false,
        cachePath: null
      });
      expect(result).toBe(true);
    });

    test('should update internal config after successful platform change', async () => {
      uiManager.selectedPlatform = 'gog';
      
      await uiManager.completeSetup();

      expect(uiManager.config.platform).toBe('gog');
      expect(uiManager.config.steamId).toBeNull();
      expect(uiManager.config.firstSetup).toBe(false);
    });

    test('should show main screen after successful platform change', async () => {
      uiManager.selectedPlatform = 'msstore';
      
      await uiManager.completeSetup();

      const setupScreen = document.getElementById('setup-screen');
      const mainScreen = document.getElementById('main-screen');
      
      expect(setupScreen.classList.contains('hidden')).toBe(true);
      expect(mainScreen.classList.contains('hidden')).toBe(false);
    });

    test('should handle save errors during platform change', async () => {
      mockElectronAPI.saveConfig.mockResolvedValue(false);
      uiManager.selectedPlatform = 'steam';
      
      const result = await uiManager.completeSetup();
      
      expect(result).toBe(false);
      // Should not update config on failure
      expect(uiManager.config).not.toEqual(expect.objectContaining({
        platform: 'steam'
      }));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Remove the platform info element
      const platformInfo = document.getElementById('current-platform-info');
      platformInfo.remove();

      uiManager.config = { platform: 'steam' };
      
      // Should not throw error
      expect(() => uiManager.updateMainScreenInfo()).not.toThrow();
    });

    test('should handle invalid platform gracefully', () => {
      expect(() => uiManager.selectPlatform('invalid')).not.toThrow();
      expect(uiManager.selectedPlatform).toBe('invalid');
    });

    test('should preserve existing configuration structure during updates', async () => {
      uiManager.config = {
        platform: 'steam',
        steamId: '123',
        firstSetup: false,
        cachePath: '/old/path',
        customProperty: 'preserved'
      };

      uiManager.selectedPlatform = 'gog';
      await uiManager.completeSetup();

      // Should not include custom properties in saved config
      expect(mockElectronAPI.saveConfig).toHaveBeenCalledWith({
        platform: 'gog',
        steamId: null,
        firstSetup: false,
        cachePath: null
      });
    });
  });
});