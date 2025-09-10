class PlatformController {
    constructor(appState) {
        this.appState = appState;
    }

    async loadConfig() {
        try {
            const config = await window.electronAPI.loadConfig();
            this.appState.updateConfig(config);
            return config;
        } catch (error) {
            console.error('Error loading config:', error);
            const defaultConfig = { firstSetup: true };
            this.appState.updateConfig(defaultConfig);
            return defaultConfig;
        }
    }

    selectPlatform(platform) {
        this.appState.selectPlatform(platform);
        
        if (platform === 'steam') {
            this.detectSteamIds();
        }
    }

    async detectSteamIds() {
        try {
            const steamIds = await window.electronAPI.detectSteamIds();
            
            if (steamIds.length === 0) {
                this.appState.addMessage('Aucun Steam ID détecté. Vérifiez que NMS a été lancé au moins une fois.', 'error');
                return [];
            }

            if (steamIds.length === 1) {
                this.appState.selectSteamId(steamIds[0].steamId);
                this.appState.addMessage(`Steam ID détecté automatiquement: ${steamIds[0].steamId}`, 'success');
            } else {
                this.appState.addMessage(`${steamIds.length} Steam IDs détectés. Sélectionnez celui à utiliser.`, 'info');
            }

            return steamIds;
        } catch (error) {
            console.error('Error detecting Steam IDs:', error);
            this.appState.addMessage('Erreur lors de la détection des Steam IDs', 'error');
            return [];
        }
    }

    selectSteamId(steamId) {
        this.appState.selectSteamId(steamId);
    }

    canContinueSetup() {
        const state = this.appState.getState();
        if (!state.selectedPlatform) return false;
        
        if (state.selectedPlatform === 'steam') {
            return !!state.selectedSteamId;
        }
        
        return true;
    }

    async saveConfiguration() {
        const state = this.appState.getState();
        
        if (!this.canContinueSetup()) {
            this.appState.addMessage('Configuration incomplète', 'error');
            return false;
        }

        try {
            const cachePath = await window.electronAPI.buildCachePath(
                state.selectedPlatform, 
                state.selectedSteamId
            );

            if (!cachePath) {
                this.appState.addMessage('Impossible de déterminer le chemin de cache', 'error');
                return false;
            }

            const newConfig = {
                platform: state.selectedPlatform,
                steamId: state.selectedSteamId,
                firstSetup: false,
                cachePath: cachePath
            };

            const success = await window.electronAPI.saveConfig(newConfig);
            
            if (success) {
                this.appState.updateConfig(newConfig);
                this.appState.addMessage('Configuration sauvegardée avec succès', 'success');
                return true;
            } else {
                this.appState.addMessage('Erreur lors de la sauvegarde', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving config:', error);
            this.appState.addMessage('Erreur lors de la sauvegarde de la configuration', 'error');
            return false;
        }
    }

    async changePlatform() {
        this.appState.setState({
            selectedPlatform: null,
            selectedSteamId: null,
            currentScreen: 'setup'
        });
    }
}

window.PlatformController = PlatformController;