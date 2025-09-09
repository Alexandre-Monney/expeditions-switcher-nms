class NMSExpeditionManager {
    constructor() {
        this.selectedPlatform = null;
        this.selectedSteamId = null;
        this.config = null;
        this.currentState = null;
        this.availableExpeditions = [];
        this.selectedExpeditionId = null;
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        
        if (this.config && this.config.firstSetup === false) {
            await this.showMainScreen();
        } else {
            this.showSetupScreen();
        }
    }

    async loadConfig() {
        try {
            this.config = await window.electronAPI.loadConfig();
            console.log('Config chargée:', this.config);
        } catch (error) {
            console.error('Erreur chargement config:', error);
            this.config = { firstSetup: true };
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPlatform(btn.dataset.platform);
            });
        });

        const detectSteamBtn = document.getElementById('detect-steam-btn');
        if (detectSteamBtn) {
            detectSteamBtn.addEventListener('click', () => {
                this.detectSteamIds();
            });
        }

        const continueBtn = document.getElementById('setup-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.completeSetup();
            });
        }

        const changePlatformBtn = document.getElementById('change-platform-btn');
        if (changePlatformBtn) {
            changePlatformBtn.addEventListener('click', () => {
                this.showSetupScreen();
            });
        }

        this.setupExpeditionEventListeners();
    }

    selectPlatform(platform) {
        this.selectedPlatform = platform;
        
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-platform="${platform}"]`).classList.add('selected');

        const steamSection = document.getElementById('steam-section');
        if (platform === 'steam') {
            steamSection.classList.remove('hidden');
        } else {
            steamSection.classList.add('hidden');
            this.selectedSteamId = null;
            this.updateContinueButton();
        }

        this.updateContinueButton();
    }

    async detectSteamIds() {
        const detectBtn = document.getElementById('detect-steam-btn');
        const resultsDiv = document.getElementById('steam-results');
        
        detectBtn.textContent = '🔍 Détection en cours...';
        detectBtn.disabled = true;
        
        try {
            const steamIds = await window.electronAPI.detectSteamIds();
            
            if (steamIds.length === 0) {
                resultsDiv.innerHTML = '<p style="color: #dc3545;">Aucun Steam ID trouvé. Vérifiez que No Man\'s Sky est installé via Steam.</p>';
            } else {
                resultsDiv.innerHTML = '<p>Steam IDs détectés :</p>';
                
                steamIds.forEach((steamData, index) => {
                    const option = document.createElement('div');
                    option.className = 'steam-id-option';
                    option.dataset.steamId = steamData.steamId;
                    option.innerHTML = `
                        <strong>Steam ID: ${steamData.steamId}</strong>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            ${steamData.cachePath}
                        </div>
                    `;
                    
                    option.addEventListener('click', () => {
                        this.selectSteamId(steamData.steamId);
                    });
                    
                    resultsDiv.appendChild(option);
                });

                if (steamIds.length === 1) {
                    this.selectSteamId(steamIds[0].steamId);
                }
            }
        } catch (error) {
            console.error('Erreur détection Steam:', error);
            resultsDiv.innerHTML = '<p style="color: #dc3545;">Erreur lors de la détection Steam.</p>';
        }
        
        detectBtn.textContent = '🔍 Détecter automatiquement';
        detectBtn.disabled = false;
    }

    selectSteamId(steamId) {
        this.selectedSteamId = steamId;
        
        document.querySelectorAll('.steam-id-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-steam-id="${steamId}"]`).classList.add('selected');
        
        this.updateContinueButton();
    }

    updateContinueButton() {
        const continueBtn = document.getElementById('setup-continue-btn');
        const canContinue = this.selectedPlatform && 
                           (this.selectedPlatform !== 'steam' || this.selectedSteamId);
        
        continueBtn.disabled = !canContinue;
    }

    async completeSetup() {
        try {
            const cachePath = await window.electronAPI.buildCachePath(
                this.selectedPlatform, 
                this.selectedSteamId
            );
            
            const newConfig = {
                platform: this.selectedPlatform,
                steamId: this.selectedSteamId,
                firstSetup: false,
                cachePath: cachePath
            };

            const success = await window.electronAPI.saveConfig(newConfig);
            if (success) {
                this.config = newConfig;
                this.showMainScreen();
            } else {
                alert('Erreur lors de la sauvegarde de la configuration.');
            }
        } catch (error) {
            console.error('Erreur sauvegarde config:', error);
            alert('Erreur lors de la sauvegarde de la configuration.');
        }
    }

    showSetupScreen() {
        this.hideAllScreens();
        document.getElementById('setup-screen').classList.remove('hidden');
    }

    async showMainScreen() {
        this.hideAllScreens();
        document.getElementById('main-screen').classList.remove('hidden');
        this.updateMainScreenInfo();
        
        await this.initializeExpeditionManager();
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

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }


    setupExpeditionEventListeners() {
        const refreshBtn = document.getElementById('refresh-status-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshExpeditionState();
            });
        }

        const expeditionSelect = document.getElementById('expedition-select');
        if (expeditionSelect) {
            expeditionSelect.addEventListener('change', (e) => {
                this.selectExpedition(e.target.value);
            });
        }

        const activateBtn = document.getElementById('activate-expedition-btn');
        if (activateBtn) {
            activateBtn.addEventListener('click', () => {
                this.activateSelectedExpedition();
            });
        }

        const restoreBtn = document.getElementById('restore-original-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.restoreOriginal();
            });
        }

        const switchBtn = document.getElementById('switch-expedition-btn');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                this.switchToOnlineMode();
            });
        }

        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.initializeExpeditionManager();
            });
        }

        this.setupNMSStatusMonitoring();
    }

    async initializeExpeditionManager() {
        try {
            await this.loadAvailableExpeditions();
            
            await this.refreshExpeditionState();
            
            await window.electronAPI.startNMSMonitoring(3000);
            
        } catch (error) {
            console.error('Error initializing expedition manager:', error);
            this.showError('Erreur lors de l\'initialisation du gestionnaire d\'expéditions');
        }
    }

    async loadAvailableExpeditions() {
        try {
            const result = await window.electronAPI.getAvailableExpeditions();
            
            if (result.success) {
                this.availableExpeditions = result.expeditions;
                this.populateExpeditionSelect();
            } else {
                throw new Error(result.error || 'Failed to load expeditions');
            }
        } catch (error) {
            console.error('Error loading expeditions:', error);
            this.showError('Erreur lors du chargement des expéditions');
        }
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
            
        } catch (error) {
            console.error('Error refreshing state:', error);
            this.showError('Erreur lors de la vérification de l\'état');
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

        const imagePath = `assets/images/expeditions/${expedition.id}.png`;
        
        preview.innerHTML = `
            <div class="expedition-card preview">
                <div class="expedition-header">
                    <h4>${expedition.displayName || expedition.id}</h4>
                    <span class="expedition-order">#${expedition.order || '?'}</span>
                </div>
                <div class="expedition-content-with-image">
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
                    <div class="expedition-image-right">
                        <img src="${imagePath}" alt="${expedition.displayName || expedition.id}" onerror="this.style.display='none'">
                    </div>
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
        if (!this.selectedExpeditionId) return;

        const activateBtn = document.getElementById('activate-expedition-btn');
        if (activateBtn) {
            activateBtn.disabled = true;
            activateBtn.textContent = '🚀 Activation en cours...';
        }

        try {
            const result = await window.electronAPI.activateExpedition(this.selectedExpeditionId);
            
            if (result.success) {
                this.showMessage(`Expédition "${result.metadata?.displayName || result.expeditionId}" activée avec succès !`, 'success');
                await this.refreshExpeditionState();
            } else {
                this.showMessage(`Erreur: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error activating expedition:', error);
            this.showMessage('Erreur lors de l\'activation de l\'expédition', 'error');
        }

        if (activateBtn) {
            activateBtn.disabled = false;
            activateBtn.textContent = '🚀 Activer cette Expédition';
        }
    }

    async restoreOriginal() {
        const restoreBtn = document.getElementById('restore-original-btn');
        if (restoreBtn) {
            restoreBtn.disabled = true;
            restoreBtn.textContent = '🔄 Restauration en cours...';
        }

        try {
            const result = await window.electronAPI.restoreOriginal();
            
            if (result.success) {
                this.showMessage('Retour au mode online effectué avec succès !', 'success');
                await this.refreshExpeditionState();
            } else {
                this.showMessage(`Erreur: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error restoring original:', error);
            this.showMessage('Erreur lors de la restauration', 'error');
        }

        if (restoreBtn) {
            restoreBtn.disabled = false;
            restoreBtn.textContent = '🔄 Retour Mode Online';
        }
    }

    switchToOnlineMode() {
        this.updateControlSections({ mode: 'online' });
        this.clearExpeditionPreview();
        
        const select = document.getElementById('expedition-select');
        if (select) select.value = '';
        this.selectedExpeditionId = null;
    }

    setupNMSStatusMonitoring() {
        window.electronAPI.onNMSStatusChange((isRunning) => {
            this.updateNMSStatus(isRunning);
        });
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

        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.nmsManager = new NMSExpeditionManager();
});