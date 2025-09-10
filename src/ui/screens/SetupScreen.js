class SetupScreen {
    constructor(appState, platformController) {
        this.appState = appState;
        this.platformController = platformController;
        this.element = document.getElementById('setup-screen');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPlatform(btn.dataset.platform);
            });
        });

        const detectSteamBtn = document.getElementById('detect-steam-btn');
        if (detectSteamBtn) {
            detectSteamBtn.addEventListener('click', async () => {
                await this.detectSteamIds();
            });
        }

        const continueBtn = document.getElementById('setup-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', async () => {
                await this.continue();
            });
        }

        this.appState.subscribe((newState, prevState) => {
            this.handleStateChange(newState, prevState);
        });
    }

    selectPlatform(platform) {
        this.updatePlatformSelection(platform);
        this.platformController.selectPlatform(platform);
        this.updateSteamSection();
        this.updateContinueButton();
    }

    updatePlatformSelection(selectedPlatform) {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            if (btn.dataset.platform === selectedPlatform) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    updateSteamSection() {
        const state = this.appState.getState();
        const steamSection = document.getElementById('steam-section');
        
        if (state.selectedPlatform === 'steam') {
            steamSection.classList.remove('hidden');
        } else {
            steamSection.classList.add('hidden');
        }
    }

    async detectSteamIds() {
        const detectBtn = document.getElementById('detect-steam-btn');
        const resultsDiv = document.getElementById('steam-results');
        
        detectBtn.disabled = true;
        detectBtn.textContent = '🔍 Détection en cours...';
        
        try {
            const steamIds = await this.platformController.detectSteamIds();
            this.displaySteamResults(steamIds);
        } finally {
            detectBtn.disabled = false;
            detectBtn.textContent = '🔍 Détecter automatiquement';
        }
    }

    displaySteamResults(steamIds) {
        const resultsDiv = document.getElementById('steam-results');
        resultsDiv.innerHTML = '';

        if (steamIds.length === 0) {
            resultsDiv.innerHTML = '<p class="error">Aucun Steam ID trouvé</p>';
            return;
        }

        if (steamIds.length === 1) {
            resultsDiv.innerHTML = `<p class="success">Steam ID détecté: ${steamIds[0].steamId}</p>`;
            return;
        }

        let html = '<div class="steam-ids-list"><p>Plusieurs Steam IDs détectés:</p>';
        steamIds.forEach(steamData => {
            html += `<button class="steam-id-btn" data-steam-id="${steamData.steamId}">
                ${steamData.steamId}
                ${steamData.hasSeasonFile ? '✓' : ''}
            </button>`;
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;

        resultsDiv.querySelectorAll('.steam-id-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectSteamId(btn.dataset.steamId);
            });
        });
    }

    selectSteamId(steamId) {
        this.platformController.selectSteamId(steamId);
        
        document.querySelectorAll('.steam-id-btn').forEach(btn => {
            if (btn.dataset.steamId === steamId) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        this.updateContinueButton();
    }

    updateContinueButton() {
        const continueBtn = document.getElementById('setup-continue-btn');
        const canContinue = this.platformController.canContinueSetup();
        
        continueBtn.disabled = !canContinue;
    }

    async continue() {
        const success = await this.platformController.saveConfiguration();
        
        if (success) {
            this.appState.setCurrentScreen('main');
        }
    }

    handleStateChange(newState, prevState) {
        if (newState.selectedPlatform !== prevState.selectedPlatform) {
            this.updatePlatformSelection(newState.selectedPlatform);
            this.updateSteamSection();
            this.updateContinueButton();
        }

        if (newState.selectedSteamId !== prevState.selectedSteamId) {
            this.updateContinueButton();
        }
    }

    show() {
        this.element.classList.remove('hidden');
        
        const state = this.appState.getState();
        if (state.selectedPlatform) {
            this.updatePlatformSelection(state.selectedPlatform);
            this.updateSteamSection();
        }
        this.updateContinueButton();
    }

    hide() {
        this.element.classList.add('hidden');
    }

    reset() {
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('steam-section').classList.add('hidden');
        document.getElementById('steam-results').innerHTML = '';
        this.updateContinueButton();
    }
}

window.SetupScreen = SetupScreen;