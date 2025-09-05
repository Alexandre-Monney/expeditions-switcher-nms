class NMSExpeditionManager {
    constructor() {
        this.selectedPlatform = null;
        this.selectedSteamId = null;
        this.config = null;
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        
        // Décider quel écran afficher
        if (this.config && this.config.firstSetup === false) {
            this.showMainScreen();
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
        // Platform selection
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPlatform(btn.dataset.platform);
            });
        });

        // Steam detection
        const detectSteamBtn = document.getElementById('detect-steam-btn');
        if (detectSteamBtn) {
            detectSteamBtn.addEventListener('click', () => {
                this.detectSteamIds();
            });
        }

        // Continue button
        const continueBtn = document.getElementById('setup-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.completeSetup();
            });
        }

        // Change platform button
        const changePlatformBtn = document.getElementById('change-platform-btn');
        if (changePlatformBtn) {
            changePlatformBtn.addEventListener('click', () => {
                this.showSetupScreen();
            });
        }
    }

    selectPlatform(platform) {
        this.selectedPlatform = platform;
        
        // Update UI
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-platform="${platform}"]`).classList.add('selected');

        // Show/hide Steam section
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

                // Auto-select le premier si un seul
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
        
        // Update UI
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
        const newConfig = {
            platform: this.selectedPlatform,
            steamId: this.selectedSteamId,
            firstSetup: false,
            cachePath: this.buildCachePath()
        };

        try {
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

    buildCachePath() {
        // Cette logique sera déplacée côté main process
        return null;
    }

    showSetupScreen() {
        this.hideAllScreens();
        document.getElementById('setup-screen').classList.remove('hidden');
    }

    showMainScreen() {
        this.hideAllScreens();
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

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.nmsManager = new NMSExpeditionManager();
});