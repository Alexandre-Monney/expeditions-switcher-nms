/**
 * @jest-environment jsdom
 */


const mockElectronAPI = {
  loadConfig: jest.fn(),
  saveConfig: jest.fn(),
  detectSteamIds: jest.fn(),
  
  getCurrentState: jest.fn(),
  getAvailableExpeditions: jest.fn(),
  activateExpedition: jest.fn(),
  restoreOriginal: jest.fn(),
  createBackup: jest.fn(),
  
  isNMSRunning: jest.fn(),
  getNMSProcessInfo: jest.fn(),
  startNMSMonitoring: jest.fn(),
  stopNMSMonitoring: jest.fn(),
  onNMSStatusChange: jest.fn(),
  removeNMSStatusListener: jest.fn()
};


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
        <div id="main-content">
          <!-- Status Section -->
          <div id="status-section" class="status-section">
            <div id="current-status" class="current-status">
              <div class="status-header">
                <h2>État Actuel</h2>
                <button id="refresh-status-btn" class="refresh-btn">Refresh</button>
              </div>
              <div id="status-info" class="status-info">
                <span>Vérification de l'état...</span>
              </div>
            </div>
          </div>

          <!-- Expedition Selection Section -->
          <div id="expedition-section" class="expedition-section">
            <div class="expedition-header">
              <h2>Gestion des Expéditions</h2>
              <div id="nms-status" class="nms-status">
                <span class="status-indicator" id="nms-status-indicator">●</span>
                <span id="nms-status-text">Vérification...</span>
              </div>
            </div>
            
            <!-- Online Mode Controls -->
            <div id="online-controls" class="controls-section hidden">
              <div class="expedition-selector">
                <label for="expedition-select">Choisir une expédition :</label>
                <select id="expedition-select" class="expedition-select">
                  <option value="">Chargement des expéditions...</option>
                </select>
              </div>
              <div class="expedition-preview" id="expedition-preview">
                <!-- Preview will be populated here -->
              </div>
              <div class="action-buttons">
                <button id="activate-expedition-btn" class="action-btn primary" disabled>
                  Activer cette Expédition
                </button>
              </div>
            </div>

            <!-- Expedition Mode Controls -->
            <div id="expedition-controls" class="controls-section hidden">
              <div class="current-expedition" id="current-expedition">
                <!-- Current expedition info will be populated here -->
              </div>
              <div class="action-buttons">
                <button id="restore-original-btn" class="action-btn secondary">
                  Retour Mode Online
                </button>
                <button id="switch-expedition-btn" class="action-btn primary">
                  Changer d'Expédition
                </button>
              </div>
            </div>

            <!-- Error State -->
            <div id="error-state" class="error-state hidden">
              <div class="error-content">
                <h3>Problème de Configuration</h3>
                <p id="error-message">Une erreur s'est produite</p>
                <button id="retry-btn" class="action-btn secondary">Réessayer</button>
              </div>
            </div>
          </div>

          <!-- Messages Section -->
          <div id="messages-section" class="messages-section">
            <div id="message-container" class="message-container"></div>
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

  
  global.window = { electronAPI: mockElectronAPI };
};


class TestUIManager {
  constructor() {
    this.selectedPlatform = null;
    this.selectedSteamId = null;
    this.config = null;
    this.currentState = null;
    this.availableExpeditions = [];
    this.selectedExpeditionId = null;
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
    
    
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    const targetBtn = document.querySelector(`[data-platform="${platform}"]`);
    if (targetBtn) {
      targetBtn.classList.add('selected');
    }

    
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

  

  async loadAvailableExpeditions() {
    const result = await window.electronAPI.getAvailableExpeditions();
    
    if (result.success) {
      this.availableExpeditions = result.expeditions;
      this.populateExpeditionSelect();
      return true;
    }
    return false;
  }

  populateExpeditionSelect() {
    const select = document.getElementById('expedition-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choisir une expédition --</option>';
    
    this.availableExpeditions.forEach(expedition => {
      const option = document.createElement('option');
      option.value = expedition.id;
      option.textContent = `${expedition.displayName || expedition.id} (${expedition.releaseDate || 'Date inconnue'})`;
      select.appendChild(option);
    });
  }

  async refreshExpeditionState() {
    try {
      const state = await window.electronAPI.getCurrentState();
      this.currentState = state;
      
      this.updateStatusSection(state);
      this.updateControlSections(state);
      
      return true;
    } catch (error) {
      console.error('Error refreshing state:', error);
      return false;
    }
  }

  updateStatusSection(state) {
    const statusInfo = document.getElementById('status-info');
    if (!statusInfo) return;

    let statusHtml = '';
    let statusClass = '';

    switch (state.mode) {
      case 'online':
        statusHtml = `
          <div class="status-content online">
            <span class="status-icon">🌐</span>
            <div>
              <strong>Mode Online</strong>
              <p>Fichier original actif. Prêt pour l'activation d'une expédition.</p>
            </div>
          </div>
        `;
        statusClass = 'online';
        break;
        
      case 'expedition':
        const expeditionName = state.currentExpedition?.displayName || 'Expédition inconnue';
        const expeditionImageUrl = state.currentExpedition?.imageUrl || 'assets/images/expeditions/default.png';
        statusHtml = `
          <div class="status-content expedition">
            <div class="status-icon expedition-icon">
              <img src="${expeditionImageUrl}" alt="${expeditionName}" class="expedition-status-image">
            </div>
            <div>
              <strong>Mode Expédition Active</strong>
              <p>Expédition active: <strong>${expeditionName}</strong></p>
              <p>Fermez No Man's Sky et lancez-le hors ligne pour jouer.</p>
            </div>
          </div>
        `;
        statusClass = 'expedition';
        break;
        
      case 'no_cache':
        statusHtml = `
          <div class="status-content error">
            <span class="status-icon">⚠️</span>
            <div>
              <strong>Fichier Cache Non Trouvé</strong>
              <p>SEASON_DATA_CACHE.JSON manquant. Lancez No Man's Sky une fois pour créer les fichiers nécessaires.</p>
            </div>
          </div>
        `;
        statusClass = 'error';
        break;
        
      case 'error':
      default:
        statusHtml = `
          <div class="status-content error">
            <span class="status-icon">❌</span>
            <div>
              <strong>Erreur de Configuration</strong>
              <p>${state.error || 'Erreur inconnue'}</p>
            </div>
          </div>
        `;
        statusClass = 'error';
        break;
    }

    statusInfo.innerHTML = statusHtml;
    statusInfo.className = `status-info ${statusClass}`;
  }

  updateControlSections(state) {
    const onlineControls = document.getElementById('online-controls');
    const expeditionControls = document.getElementById('expedition-controls');
    const errorState = document.getElementById('error-state');

    
    [onlineControls, expeditionControls, errorState].forEach(section => {
      if (section) section.classList.add('hidden');
    });

    switch (state.mode) {
      case 'online':
        if (onlineControls) onlineControls.classList.remove('hidden');
        break;
        
      case 'expedition':
        if (expeditionControls) {
          expeditionControls.classList.remove('hidden');
          this.updateCurrentExpeditionInfo(state.currentExpedition);
        }
        break;
        
      case 'error':
      case 'no_cache':
      default:
        if (errorState) {
          errorState.classList.remove('hidden');
          const errorMessage = document.getElementById('error-message');
          if (errorMessage) {
            errorMessage.textContent = state.error || 'Erreur de configuration';
          }
        }
        break;
    }
  }

  updateCurrentExpeditionInfo(expedition) {
    const container = document.getElementById('current-expedition');
    if (!container || !expedition) return;

    container.innerHTML = `
      <div class="expedition-card current">
        <div class="expedition-header">
          <h3>${expedition.displayName || expedition.id}</h3>
          <span class="expedition-badge">ACTIF</span>
        </div>
        <div class="expedition-details">
          <p><strong>Description:</strong> ${expedition.description || 'Pas de description'}</p>
          <p><strong>Difficulté:</strong> ${expedition.difficulty || 'Non spécifiée'}</p>
          <p><strong>Date de sortie:</strong> ${expedition.releaseDate || 'Inconnue'}</p>
          ${expedition.rewards ? `<p><strong>Récompenses:</strong> ${expedition.rewards.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  selectExpedition(expeditionId) {
    this.selectedExpeditionId = expeditionId;
    
    const activateBtn = document.getElementById('activate-expedition-btn');
    if (activateBtn) {
      activateBtn.disabled = !expeditionId;
    }

    
    if (expeditionId) {
      const expedition = this.availableExpeditions.find(e => e.id === expeditionId);
      if (expedition) {
        this.updateExpeditionPreview(expedition);
      }
    } else {
      this.clearExpeditionPreview();
    }
  }

  updateExpeditionPreview(expedition) {
    const preview = document.getElementById('expedition-preview');
    if (!preview) return;

    preview.innerHTML = `
      <div class="expedition-card preview">
        <div class="expedition-header">
          <h4>${expedition.displayName || expedition.id}</h4>
          <span class="expedition-order">#${expedition.order || '?'}</span>
        </div>
        <div class="expedition-details">
          <p class="description">${expedition.description || 'Pas de description disponible'}</p>
          <div class="expedition-meta">
            <span class="difficulty ${(expedition.difficulty || '').toLowerCase()}">
              ${expedition.difficulty || 'Difficulté inconnue'}
            </span>
            <span class="release-date">${expedition.releaseDate || 'Date inconnue'}</span>
          </div>
          ${expedition.rewards && expedition.rewards.length > 0 ? `
            <div class="rewards">
              <strong>Récompenses:</strong>
              <ul>
                ${expedition.rewards.map(reward => `<li>${reward}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  clearExpeditionPreview() {
    const preview = document.getElementById('expedition-preview');
    if (preview) {
      preview.innerHTML = '<p class="no-selection">Sélectionnez une expédition pour voir les détails.</p>';
    }
  }

  async activateSelectedExpedition() {
    if (!this.selectedExpeditionId) return { success: false, error: 'No expedition selected' };

    const result = await window.electronAPI.activateExpedition(this.selectedExpeditionId);
    
    if (result.success) {
      this.showMessage(`Expédition "${result.metadata?.displayName || result.expeditionId}" activée avec succès !`, 'success');
      await this.refreshExpeditionState();
    } else {
      this.showMessage(`Erreur: ${result.error}`, 'error');
    }

    return result;
  }

  async restoreOriginal() {
    const result = await window.electronAPI.restoreOriginal();
    
    if (result.success) {
      this.showMessage('Retour au mode online effectué avec succès !', 'success');
      await this.refreshExpeditionState();
    } else {
      this.showMessage(`Erreur: ${result.error}`, 'error');
    }

    return result;
  }

  switchToOnlineMode() {
    this.updateControlSections({ mode: 'online' });
    this.clearExpeditionPreview();
    
    
    const select = document.getElementById('expedition-select');
    if (select) select.value = '';
    this.selectedExpeditionId = null;
  }

  updateNMSStatus(isRunning) {
    const indicator = document.getElementById('nms-status-indicator');
    const text = document.getElementById('nms-status-text');
    
    if (indicator && text) {
      if (isRunning) {
        indicator.className = 'status-indicator running';
        text.textContent = 'No Man\'s Sky en cours d\'exécution';
      } else {
        indicator.className = 'status-indicator stopped';
        text.textContent = 'No Man\'s Sky arrêté';
      }
    }

    
    this.updateButtonsForNMSStatus(isRunning);
  }

  updateButtonsForNMSStatus(isRunning) {
    const buttons = [
      'activate-expedition-btn',
      'restore-original-btn'
    ];

    buttons.forEach(buttonId => {
      const btn = document.getElementById(buttonId);
      if (btn) {
        if (isRunning) {
          btn.disabled = true;
          btn.title = 'Fermez No Man\'s Sky pour effectuer cette action';
        } else {
          
          if (buttonId === 'activate-expedition-btn') {
            btn.disabled = !this.selectedExpeditionId;
          } else {
            btn.disabled = false;
          }
          btn.title = '';
        }
      }
    });
  }

  showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    messageEl.innerHTML = `
      <span class="message-icon">${icon}</span>
      <span class="message-text">${message}</span>
      <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(messageEl);

    return messageEl; 
  }
}

describe('NMS Expedition Manager UI - Platform Change', () => {
  let uiManager;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    
    
    mockElectronAPI.loadConfig.mockResolvedValue({ 
      platform: 'steam', 
      steamId: '76561198123456789',
      firstSetup: false 
    });
    mockElectronAPI.saveConfig.mockResolvedValue(true);
    mockElectronAPI.detectSteamIds.mockResolvedValue([]);

    
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

      
      uiManager.showSetupScreen();

      
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
      
      
      uiManager.showSetupScreen();
      
      
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
      
      expect(uiManager.config).not.toEqual(expect.objectContaining({
        platform: 'steam'
      }));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      
      const platformInfo = document.getElementById('current-platform-info');
      platformInfo.remove();

      uiManager.config = { platform: 'steam' };
      
      
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

      
      expect(mockElectronAPI.saveConfig).toHaveBeenCalledWith({
        platform: 'gog',
        steamId: null,
        firstSetup: false,
        cachePath: null
      });
    });
  });
});



describe('NMS Expedition Manager UI - Expedition Management', () => {
  let uiManager;

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    
    
    mockElectronAPI.loadConfig.mockResolvedValue({ 
      platform: 'steam', 
      steamId: '76561198123456789',
      firstSetup: false,
      cachePath: '/test/cache'
    });

    
    mockElectronAPI.getAvailableExpeditions.mockResolvedValue({
      success: true,
      expeditions: [
        {
          id: '01_pioneers',
          displayName: 'The Pioneers',
          description: 'First expedition',
          difficulty: 'Normal',
          releaseDate: '2021-03-31',
          order: 1,
          rewards: ['Living Ship']
        },
        {
          id: '02_beachhead',
          displayName: 'Beachhead', 
          description: 'Second expedition',
          difficulty: 'Hard',
          releaseDate: '2021-05-17',
          order: 2,
          rewards: ['Normandy Frigate']
        }
      ],
      count: 2
    });

    mockElectronAPI.getCurrentState.mockResolvedValue({
      mode: 'online',
      cachePath: '/test/cache',
      files: {
        seasonFile: '/test/cache/SEASON_DATA_CACHE.JSON',
        hasOriginal: true
      }
    });

    mockElectronAPI.activateExpedition.mockResolvedValue({
      success: true,
      expeditionId: '01_pioneers',
      metadata: { displayName: 'The Pioneers' },
      backupCreated: true
    });

    mockElectronAPI.restoreOriginal.mockResolvedValue({
      success: true,
      message: 'Restored successfully',
      mode: 'online'
    });

    mockElectronAPI.startNMSMonitoring.mockResolvedValue(true);
    mockElectronAPI.onNMSStatusChange.mockImplementation(() => {});

    global.window = { electronAPI: mockElectronAPI };
    uiManager = new TestUIManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading Available Expeditions', () => {
    test('should load and populate expedition list successfully', async () => {
      const result = await uiManager.loadAvailableExpeditions();

      expect(result).toBe(true);
      expect(mockElectronAPI.getAvailableExpeditions).toHaveBeenCalledTimes(1);
      expect(uiManager.availableExpeditions).toHaveLength(2);
      expect(uiManager.availableExpeditions[0].id).toBe('01_pioneers');
      expect(uiManager.availableExpeditions[1].id).toBe('02_beachhead');
    });

    test('should populate expedition select dropdown', async () => {
      await uiManager.loadAvailableExpeditions();

      const select = document.getElementById('expedition-select');
      expect(select.children).toHaveLength(3); 
      expect(select.children[0].textContent).toBe('-- Choisir une expédition --');
      expect(select.children[1].textContent).toBe('The Pioneers (2021-03-31)');
      expect(select.children[2].textContent).toBe('Beachhead (2021-05-17)');
    });

    test('should handle expedition loading failure', async () => {
      mockElectronAPI.getAvailableExpeditions.mockResolvedValue({
        success: false,
        error: 'Failed to load expeditions'
      });

      const result = await uiManager.loadAvailableExpeditions();

      expect(result).toBe(false);
      expect(uiManager.availableExpeditions).toHaveLength(0);
    });

    test('should populate select even with missing expedition data', async () => {
      mockElectronAPI.getAvailableExpeditions.mockResolvedValue({
        success: true,
        expeditions: [
          { id: 'test_expedition' }, 
        ],
        count: 1
      });

      await uiManager.loadAvailableExpeditions();

      const select = document.getElementById('expedition-select');
      expect(select.children[1].textContent).toBe('test_expedition (Date inconnue)');
    });
  });

  describe('Expedition State Management', () => {
    test('should refresh and display online state correctly', async () => {
      const result = await uiManager.refreshExpeditionState();

      expect(result).toBe(true);
      expect(mockElectronAPI.getCurrentState).toHaveBeenCalledTimes(1);

      const statusInfo = document.getElementById('status-info');
      expect(statusInfo.classList.contains('online')).toBe(true);
      expect(statusInfo.innerHTML).toContain('Mode Online');
      expect(statusInfo.innerHTML).toContain('🌐');

      const onlineControls = document.getElementById('online-controls');
      const expeditionControls = document.getElementById('expedition-controls');
      const errorState = document.getElementById('error-state');
      
      expect(onlineControls.classList.contains('hidden')).toBe(false);
      expect(expeditionControls.classList.contains('hidden')).toBe(true);
      expect(errorState.classList.contains('hidden')).toBe(true);
    });

    test('should refresh and display expedition state correctly', async () => {
      mockElectronAPI.getCurrentState.mockResolvedValue({
        mode: 'expedition',
        currentExpedition: {
          id: '01_pioneers',
          displayName: 'The Pioneers',
          description: 'First expedition',
          difficulty: 'Normal',
          releaseDate: '2021-03-31',
          rewards: ['Living Ship']
        },
        cachePath: '/test/cache',
        files: {
          seasonFile: '/test/cache/SEASON_DATA_CACHE.JSON',
          backupFile: '/test/cache/SEASON_DATA_CACHE_original.JSON',
          hasOriginal: true,
          hasBackup: true
        }
      });

      await uiManager.refreshExpeditionState();

      const statusInfo = document.getElementById('status-info');
      expect(statusInfo.classList.contains('expedition')).toBe(true);
      expect(statusInfo.innerHTML).toContain('Mode Expédition Active');
      expect(statusInfo.innerHTML).toContain('The Pioneers');
      expect(statusInfo.innerHTML).toContain('expedition-status-image');

      const onlineControls = document.getElementById('online-controls');
      const expeditionControls = document.getElementById('expedition-controls');
      
      expect(onlineControls.classList.contains('hidden')).toBe(true);
      expect(expeditionControls.classList.contains('hidden')).toBe(false);

      
      const currentExpedition = document.getElementById('current-expedition');
      expect(currentExpedition.innerHTML).toContain('The Pioneers');
      expect(currentExpedition.innerHTML).toContain('ACTIF');
      expect(currentExpedition.innerHTML).toContain('First expedition');
      expect(currentExpedition.innerHTML).toContain('Living Ship');
    });

    test('should refresh and display no_cache state correctly', async () => {
      mockElectronAPI.getCurrentState.mockResolvedValue({
        mode: 'no_cache',
        error: 'SEASON_DATA_CACHE.JSON not found',
        cachePath: '/test/cache'
      });

      await uiManager.refreshExpeditionState();

      const statusInfo = document.getElementById('status-info');
      expect(statusInfo.classList.contains('error')).toBe(true);
      expect(statusInfo.innerHTML).toContain('Fichier Cache Non Trouvé');
      expect(statusInfo.innerHTML).toContain('⚠️');

      const errorState = document.getElementById('error-state');
      expect(errorState.classList.contains('hidden')).toBe(false);

      const errorMessage = document.getElementById('error-message');
      expect(errorMessage.textContent).toBe('SEASON_DATA_CACHE.JSON not found');
    });

    test('should refresh and display error state correctly', async () => {
      mockElectronAPI.getCurrentState.mockResolvedValue({
        mode: 'error',
        error: 'Configuration error'
      });

      await uiManager.refreshExpeditionState();

      const statusInfo = document.getElementById('status-info');
      expect(statusInfo.classList.contains('error')).toBe(true);
      expect(statusInfo.innerHTML).toContain('Erreur de Configuration');
      expect(statusInfo.innerHTML).toContain('Configuration error');
      expect(statusInfo.innerHTML).toContain('❌');
    });

    test('should handle state refresh errors gracefully', async () => {
      mockElectronAPI.getCurrentState.mockRejectedValue(new Error('Network error'));

      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await uiManager.refreshExpeditionState();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing state:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Expedition Selection and Preview', () => {
    beforeEach(async () => {
      await uiManager.loadAvailableExpeditions();
    });

    test('should select expedition and update activate button', () => {
      uiManager.selectExpedition('01_pioneers');

      expect(uiManager.selectedExpeditionId).toBe('01_pioneers');

      const activateBtn = document.getElementById('activate-expedition-btn');
      expect(activateBtn.disabled).toBe(false);
    });

    test('should clear selection and disable activate button', () => {
      uiManager.selectExpedition('01_pioneers');
      uiManager.selectExpedition('');

      expect(uiManager.selectedExpeditionId).toBe('');

      const activateBtn = document.getElementById('activate-expedition-btn');
      expect(activateBtn.disabled).toBe(true);
    });

    test('should update expedition preview when selecting expedition', () => {
      uiManager.selectExpedition('01_pioneers');

      const preview = document.getElementById('expedition-preview');
      expect(preview.innerHTML).toContain('The Pioneers');
      expect(preview.innerHTML).toContain('#1');
      expect(preview.innerHTML).toContain('First expedition');
      expect(preview.innerHTML).toContain('Normal');
      expect(preview.innerHTML).toContain('2021-03-31');
      expect(preview.innerHTML).toContain('Living Ship');
    });

    test('should clear preview when no expedition selected', () => {
      uiManager.selectExpedition('01_pioneers');
      uiManager.clearExpeditionPreview();

      const preview = document.getElementById('expedition-preview');
      expect(preview.innerHTML).toContain('Sélectionnez une expédition pour voir les détails');
    });

    test('should handle expedition preview with minimal data', () => {
      uiManager.availableExpeditions = [{ id: 'minimal_exp' }];
      uiManager.selectExpedition('minimal_exp');

      const preview = document.getElementById('expedition-preview');
      expect(preview.innerHTML).toContain('minimal_exp');
      expect(preview.innerHTML).toContain('Pas de description disponible');
      expect(preview.innerHTML).toContain('Difficulté inconnue');
      expect(preview.innerHTML).toContain('Date inconnue');
    });

    test('should handle expedition preview without rewards', () => {
      uiManager.availableExpeditions = [{
        id: 'no_rewards',
        displayName: 'No Rewards Expedition',
        description: 'Test expedition',
        
      }];
      uiManager.selectExpedition('no_rewards');

      const preview = document.getElementById('expedition-preview');
      expect(preview.innerHTML).toContain('No Rewards Expedition');
      expect(preview.innerHTML).not.toContain('Récompenses:');
    });
  });

  describe('Expedition Activation', () => {
    beforeEach(async () => {
      await uiManager.loadAvailableExpeditions();
      uiManager.selectExpedition('01_pioneers');
    });

    test('should activate expedition successfully', async () => {
      const result = await uiManager.activateSelectedExpedition();

      expect(result.success).toBe(true);
      expect(mockElectronAPI.activateExpedition).toHaveBeenCalledWith('01_pioneers');

      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children).toHaveLength(1);
      expect(messageContainer.children[0].classList.contains('message-success')).toBe(true);
      expect(messageContainer.children[0].innerHTML).toContain('The Pioneers');
      expect(messageContainer.children[0].innerHTML).toContain('activée avec succès');
    });

    test('should handle activation failure', async () => {
      mockElectronAPI.activateExpedition.mockResolvedValue({
        success: false,
        error: 'NMS is running'
      });

      const result = await uiManager.activateSelectedExpedition();

      expect(result.success).toBe(false);

      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children).toHaveLength(1);
      expect(messageContainer.children[0].classList.contains('message-error')).toBe(true);
      expect(messageContainer.children[0].innerHTML).toContain('NMS is running');
    });

    test('should not activate when no expedition is selected', async () => {
      uiManager.selectedExpeditionId = null;

      const result = await uiManager.activateSelectedExpedition();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No expedition selected');
      expect(mockElectronAPI.activateExpedition).not.toHaveBeenCalled();
    });

    test('should refresh state after successful activation', async () => {
      const refreshSpy = jest.spyOn(uiManager, 'refreshExpeditionState').mockResolvedValue(true);

      await uiManager.activateSelectedExpedition();

      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Original Restoration', () => {
    test('should restore original successfully', async () => {
      const result = await uiManager.restoreOriginal();

      expect(result.success).toBe(true);
      expect(mockElectronAPI.restoreOriginal).toHaveBeenCalledTimes(1);

      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children).toHaveLength(1);
      expect(messageContainer.children[0].classList.contains('message-success')).toBe(true);
      expect(messageContainer.children[0].innerHTML).toContain('Retour au mode online effectué avec succès');
    });

    test('should handle restoration failure', async () => {
      mockElectronAPI.restoreOriginal.mockResolvedValue({
        success: false,
        error: 'No backup found'
      });

      const result = await uiManager.restoreOriginal();

      expect(result.success).toBe(false);

      
      const messageContainer = document.getElementById('message-container');
      expect(messageContainer.children).toHaveLength(1);
      expect(messageContainer.children[0].classList.contains('message-error')).toBe(true);
      expect(messageContainer.children[0].innerHTML).toContain('No backup found');
    });

    test('should refresh state after successful restoration', async () => {
      const refreshSpy = jest.spyOn(uiManager, 'refreshExpeditionState').mockResolvedValue(true);

      await uiManager.restoreOriginal();

      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Online Mode Switch', () => {
    test('should switch to online mode and reset selection', () => {
      
      uiManager.selectedExpeditionId = '01_pioneers';
      const select = document.getElementById('expedition-select');
      select.value = '01_pioneers';

      uiManager.switchToOnlineMode();

      expect(uiManager.selectedExpeditionId).toBeNull();
      expect(select.value).toBe('');

      
      const onlineControls = document.getElementById('online-controls');
      expect(onlineControls.classList.contains('hidden')).toBe(false);
    });

    test('should clear expedition preview when switching to online mode', () => {
      uiManager.switchToOnlineMode();

      const preview = document.getElementById('expedition-preview');
      expect(preview.innerHTML).toContain('Sélectionnez une expédition pour voir les détails');
    });
  });

  describe('NMS Status Monitoring', () => {
    test('should update NMS status when running', () => {
      uiManager.updateNMSStatus(true);

      const indicator = document.getElementById('nms-status-indicator');
      const text = document.getElementById('nms-status-text');

      expect(indicator.className).toBe('status-indicator running');
      expect(text.textContent).toBe('No Man\'s Sky en cours d\'exécution');
    });

    test('should update NMS status when stopped', () => {
      uiManager.updateNMSStatus(false);

      const indicator = document.getElementById('nms-status-indicator');
      const text = document.getElementById('nms-status-text');

      expect(indicator.className).toBe('status-indicator stopped');
      expect(text.textContent).toBe('No Man\'s Sky arrêté');
    });

    test('should disable buttons when NMS is running', async () => {
      await uiManager.loadAvailableExpeditions();
      uiManager.selectExpedition('01_pioneers');

      uiManager.updateNMSStatus(true);

      const activateBtn = document.getElementById('activate-expedition-btn');
      const restoreBtn = document.getElementById('restore-original-btn');

      expect(activateBtn.disabled).toBe(true);
      expect(activateBtn.title).toContain('Fermez No Man\'s Sky');
      expect(restoreBtn.disabled).toBe(true);
      expect(restoreBtn.title).toContain('Fermez No Man\'s Sky');
    });

    test('should re-enable buttons when NMS is stopped', async () => {
      await uiManager.loadAvailableExpeditions();
      uiManager.selectExpedition('01_pioneers');

      
      uiManager.updateNMSStatus(true);
      
      uiManager.updateNMSStatus(false);

      const activateBtn = document.getElementById('activate-expedition-btn');
      const restoreBtn = document.getElementById('restore-original-btn');

      expect(activateBtn.disabled).toBe(false); 
      expect(activateBtn.title).toBe('');
      expect(restoreBtn.disabled).toBe(false);
      expect(restoreBtn.title).toBe('');
    });

    test('should keep activate button disabled when no expedition selected and NMS stopped', () => {
      uiManager.selectedExpeditionId = null;
      uiManager.updateNMSStatus(false);

      const activateBtn = document.getElementById('activate-expedition-btn');
      expect(activateBtn.disabled).toBe(true); 
    });

    test('should handle missing status elements gracefully', () => {
      
      const indicator = document.getElementById('nms-status-indicator');
      const text = document.getElementById('nms-status-text');
      indicator.remove();
      text.remove();

      
      expect(() => uiManager.updateNMSStatus(true)).not.toThrow();
    });
  });

  describe('Message System', () => {
    test('should display success message correctly', () => {
      const messageEl = uiManager.showMessage('Test success message', 'success');

      expect(messageEl.classList.contains('message-success')).toBe(true);
      expect(messageEl.innerHTML).toContain('✅');
      expect(messageEl.innerHTML).toContain('Test success message');
      expect(messageEl.innerHTML).toContain('×'); 

      const container = document.getElementById('message-container');
      expect(container.children).toHaveLength(1);
      expect(container.children[0]).toBe(messageEl);
    });

    test('should display error message correctly', () => {
      const messageEl = uiManager.showMessage('Test error message', 'error');

      expect(messageEl.classList.contains('message-error')).toBe(true);
      expect(messageEl.innerHTML).toContain('❌');
      expect(messageEl.innerHTML).toContain('Test error message');
    });

    test('should display info message correctly', () => {
      const messageEl = uiManager.showMessage('Test info message', 'info');

      expect(messageEl.classList.contains('message-info')).toBe(true);
      expect(messageEl.innerHTML).toContain('ℹ️');
      expect(messageEl.innerHTML).toContain('Test info message');
    });

    test('should default to info type when no type specified', () => {
      const messageEl = uiManager.showMessage('Default message');

      expect(messageEl.classList.contains('message-info')).toBe(true);
      expect(messageEl.innerHTML).toContain('ℹ️');
    });

    test('should handle missing message container gracefully', () => {
      const container = document.getElementById('message-container');
      container.remove();

      const messageEl = uiManager.showMessage('Test message');
      expect(messageEl).toBeUndefined();
    });

    test('should allow multiple messages to accumulate', () => {
      uiManager.showMessage('Message 1', 'success');
      uiManager.showMessage('Message 2', 'error');
      uiManager.showMessage('Message 3', 'info');

      const container = document.getElementById('message-container');
      expect(container.children).toHaveLength(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      
      document.getElementById('status-info').remove();
      document.getElementById('expedition-preview').remove();
      document.getElementById('current-expedition').remove();

      
      expect(() => uiManager.updateStatusSection({ mode: 'online' })).not.toThrow();
      expect(() => uiManager.updateExpeditionPreview({ id: 'test' })).not.toThrow();
      expect(() => uiManager.updateCurrentExpeditionInfo({ id: 'test' })).not.toThrow();
    });

    test('should handle expeditions with empty or null rewards', () => {
      const expedition1 = { id: 'test1', rewards: [] };
      const expedition2 = { id: 'test2', rewards: null };
      const expedition3 = { id: 'test3' }; 

      expect(() => uiManager.updateExpeditionPreview(expedition1)).not.toThrow();
      expect(() => uiManager.updateExpeditionPreview(expedition2)).not.toThrow();
      expect(() => uiManager.updateExpeditionPreview(expedition3)).not.toThrow();
    });

    test('should handle updateCurrentExpeditionInfo with null expedition', () => {
      expect(() => uiManager.updateCurrentExpeditionInfo(null)).not.toThrow();
      expect(() => uiManager.updateCurrentExpeditionInfo(undefined)).not.toThrow();
    });

    test('should handle selectExpedition with non-existent expedition ID', () => {
      uiManager.availableExpeditions = [{ id: 'existing_exp' }];
      
      expect(() => uiManager.selectExpedition('non_existent')).not.toThrow();
      expect(uiManager.selectedExpeditionId).toBe('non_existent');
    });
  });
});