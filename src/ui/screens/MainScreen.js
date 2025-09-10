class MainScreen {
    constructor(appState, platformController, expeditionController) {
        this.appState = appState;
        this.platformController = platformController;
        this.expeditionController = expeditionController;
        this.element = document.getElementById('main-screen');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const changePlatformBtn = document.getElementById('change-platform-btn');
        if (changePlatformBtn) {
            changePlatformBtn.addEventListener('click', () => {
                this.platformController.changePlatform();
            });
        }

        const refreshStatusBtn = document.getElementById('refresh-status-btn');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', async () => {
                await this.expeditionController.refreshExpeditionState();
            });
        }

        const expeditionSelect = document.getElementById('expedition-select');
        if (expeditionSelect) {
            expeditionSelect.addEventListener('change', (e) => {
                this.expeditionController.selectExpedition(e.target.value);
            });
        }

        const activateBtn = document.getElementById('activate-expedition-btn');
        if (activateBtn) {
            activateBtn.addEventListener('click', async () => {
                const state = this.appState.getState();
                await this.expeditionController.activateExpedition(state.selectedExpeditionId);
            });
        }

        const restoreBtn = document.getElementById('restore-original-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', async () => {
                await this.expeditionController.restoreOriginal();
            });
        }

        const switchExpeditionBtn = document.getElementById('switch-expedition-btn');
        if (switchExpeditionBtn) {
            switchExpeditionBtn.addEventListener('click', () => {
                this.expeditionController.switchToOnlineMode();
            });
        }

        this.appState.subscribe((newState, prevState) => {
            this.handleStateChange(newState, prevState);
        });
    }

    async initialize() {
        this.updatePlatformInfo();
        await this.expeditionController.loadAvailableExpeditions();
        await this.expeditionController.refreshExpeditionState();
        this.expeditionController.startNMSMonitoring();
    }

    updatePlatformInfo() {
        const state = this.appState.getState();
        const platformInfo = document.getElementById('current-platform-info');
        
        if (!state.config || !platformInfo) return;

        let info = `Plateforme: ${state.config.platform.toUpperCase()}`;
        if (state.config.platform === 'steam' && state.config.steamId) {
            info += ` (${state.config.steamId})`;
        }
        
        platformInfo.textContent = info;
    }

    populateExpeditionSelect() {
        const select = document.getElementById('expedition-select');
        const state = this.appState.getState();
        
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionnez une expédition</option>';
        
        state.availableExpeditions.forEach(expedition => {
            const option = document.createElement('option');
            option.value = expedition.id;
            option.textContent = expedition.displayName || expedition.id;
            select.appendChild(option);
        });
    }

    updateStatusSection(expeditionState) {
        const statusInfo = document.getElementById('status-info');
        if (!statusInfo || !expeditionState) return;

        let statusHtml = '';
        
        switch (expeditionState.mode) {
            case 'online':
                statusHtml = `
                    <div class="status-content online">
                        <div class="status-icon">🌐</div>
                        <div class="status-text">
                            <strong>Mode Online Actuel</strong>
                            <p>Prêt à basculer vers une expédition</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'expedition':
                const expedition = expeditionState.currentExpedition;
                const expeditionImageUrl = expedition?.imageUrl || 'assets/images/expeditions/default.png';
                statusHtml = `
                    <div class="status-content expedition">
                        <div class="status-icon expedition-icon">
                            <img src="${expeditionImageUrl}" alt="${expedition?.displayName}" class="expedition-status-image">
                        </div>
                        <div class="status-text">
                            <strong>${expedition?.displayName || 'Expédition inconnue'}</strong>
                            <p>Mode expédition actif - Jouez hors ligne</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'error':
                statusHtml = `
                    <div class="status-content error">
                        <div class="status-icon">⚠️</div>
                        <div class="status-text">
                            <strong>Erreur de Configuration</strong>
                            <p>${expeditionState.error}</p>
                        </div>
                    </div>
                `;
                break;
                
            case 'no_cache':
                statusHtml = `
                    <div class="status-content no-cache">
                        <div class="status-icon">📁</div>
                        <div class="status-text">
                            <strong>Cache Non Trouvé</strong>
                            <p>Lancez No Man's Sky au moins une fois</p>
                        </div>
                    </div>
                `;
                break;
                
            default:
                statusHtml = `
                    <div class="status-content">
                        <div class="loading-spinner"></div>
                        <span>Vérification de l'état...</span>
                    </div>
                `;
        }
        
        statusInfo.innerHTML = statusHtml;
    }

    updateControlSections(expeditionState) {
        const onlineControls = document.getElementById('online-controls');
        const expeditionControls = document.getElementById('expedition-controls');
        const errorState = document.getElementById('error-state');

        onlineControls?.classList.add('hidden');
        expeditionControls?.classList.add('hidden');
        errorState?.classList.add('hidden');

        if (!expeditionState) return;

        switch (expeditionState.mode) {
            case 'online':
                onlineControls?.classList.remove('hidden');
                this.updateCurrentExpeditionInfo(null);
                break;
                
            case 'expedition':
                expeditionControls?.classList.remove('hidden');
                this.updateCurrentExpeditionInfo(expeditionState.currentExpedition);
                break;
                
            case 'error':
            case 'no_cache':
                errorState?.classList.remove('hidden');
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.textContent = expeditionState.error;
                }
                break;
        }
    }

    updateCurrentExpeditionInfo(expedition) {
        const expeditionDiv = document.getElementById('current-expedition');
        if (!expeditionDiv) return;

        if (!expedition) {
            expeditionDiv.innerHTML = '';
            return;
        }

        const imageUrl = expedition.imageUrl || 'assets/images/expeditions/default.png';
        expeditionDiv.innerHTML = `
            <div class="expedition-info">
                <img src="${imageUrl}" alt="${expedition.displayName}" class="expedition-image">
                <div class="expedition-details">
                    <h3>${expedition.displayName}</h3>
                    <p>${expedition.description || ''}</p>
                </div>
            </div>
        `;
    }

    updateExpeditionPreview(expedition) {
        const previewDiv = document.getElementById('expedition-preview');
        if (!previewDiv) return;

        if (!expedition) {
            previewDiv.innerHTML = '';
            return;
        }

        const imageUrl = expedition.imageUrl || 'assets/images/expeditions/default.png';
        const rewards = expedition.rewards || [];
        
        let rewardsHtml = '';
        if (rewards.length > 0) {
            rewardsHtml = `
                <div class="expedition-rewards">
                    <h4>Récompenses:</h4>
                    <ul>
                        ${rewards.map(reward => `<li>${reward}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        previewDiv.innerHTML = `
            <div class="expedition-card">
                <img src="${imageUrl}" alt="${expedition.displayName}" class="expedition-preview-image">
                <div class="expedition-info">
                    <h3>${expedition.displayName}</h3>
                    <p>${expedition.description || ''}</p>
                    ${rewardsHtml}
                </div>
            </div>
        `;
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
    }

    updateButtonsForNMSStatus(isRunning) {
        const buttons = [
            document.getElementById('activate-expedition-btn'),
            document.getElementById('restore-original-btn')
        ];

        const state = this.appState.getState();
        
        buttons.forEach(btn => {
            if (!btn) return;
            
            if (isRunning) {
                btn.disabled = true;
                btn.title = 'No Man\'s Sky doit être fermé';
            } else {
                if (btn.id === 'activate-expedition-btn') {
                    btn.disabled = !state.selectedExpeditionId;
                    btn.title = state.selectedExpeditionId ? '' : 'Sélectionnez une expédition';
                } else {
                    btn.disabled = false;
                    btn.title = '';
                }
            }
        });
    }

    handleStateChange(newState, prevState) {
        if (newState.config !== prevState.config) {
            this.updatePlatformInfo();
        }

        if (newState.availableExpeditions !== prevState.availableExpeditions) {
            this.populateExpeditionSelect();
        }

        if (newState.currentState !== prevState.currentState) {
            this.updateStatusSection(newState.currentState);
            this.updateControlSections(newState.currentState);
        }

        if (newState.selectedExpeditionId !== prevState.selectedExpeditionId) {
            const selectedExpedition = newState.availableExpeditions.find(
                exp => exp.id === newState.selectedExpeditionId
            );
            this.updateExpeditionPreview(selectedExpedition);
            
            const select = document.getElementById('expedition-select');
            if (select && select.value !== (newState.selectedExpeditionId || '')) {
                select.value = newState.selectedExpeditionId || '';
            }
        }

        if (newState.nmsRunning !== prevState.nmsRunning) {
            this.updateNMSStatus(newState.nmsRunning);
            this.updateButtonsForNMSStatus(newState.nmsRunning);
        }
    }

    show() {
        this.element.classList.remove('hidden');
        this.initialize();
    }

    hide() {
        this.element.classList.add('hidden');
        this.expeditionController.stopNMSMonitoring();
    }
}

window.MainScreen = MainScreen;