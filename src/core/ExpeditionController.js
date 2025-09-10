class ExpeditionController {
    constructor(appState) {
        this.appState = appState;
        this.nmsMonitoringInterval = null;
    }

    async refreshExpeditionState() {
        try {
            const state = await window.electronAPI.getCurrentExpeditionState();
            this.appState.updateExpeditionState(state);
            return state;
        } catch (error) {
            console.error('Error refreshing expedition state:', error);
            this.appState.addMessage('Erreur lors de la récupération de l\'état', 'error');
            return null;
        }
    }

    async loadAvailableExpeditions() {
        try {
            const result = await window.electronAPI.getAvailableExpeditions();
            
            if (result.success) {
                this.appState.setAvailableExpeditions(result.expeditions);
                return result.expeditions;
            } else {
                this.appState.addMessage('Erreur lors du chargement des expéditions', 'error');
                return [];
            }
        } catch (error) {
            console.error('Error loading expeditions:', error);
            this.appState.addMessage('Erreur lors du chargement des expéditions', 'error');
            return [];
        }
    }

    selectExpedition(expeditionId) {
        this.appState.selectExpedition(expeditionId);
    }

    async activateExpedition(expeditionId) {
        if (!expeditionId) {
            this.appState.addMessage('Aucune expédition sélectionnée', 'error');
            return false;
        }

        const state = this.appState.getState();
        if (state.nmsRunning) {
            this.appState.addMessage('No Man\'s Sky doit être fermé pour changer d\'expédition', 'error');
            return false;
        }

        try {
            const result = await window.electronAPI.activateExpedition(expeditionId);
            
            if (result.success) {
                this.appState.addMessage(`Expédition "${result.metadata.displayName}" activée avec succès`, 'success');
                await this.refreshExpeditionState();
                return true;
            } else {
                this.appState.addMessage(result.error || 'Erreur lors de l\'activation', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error activating expedition:', error);
            this.appState.addMessage('Erreur lors de l\'activation de l\'expédition', 'error');
            return false;
        }
    }

    async restoreOriginal() {
        const state = this.appState.getState();
        if (state.nmsRunning) {
            this.appState.addMessage('No Man\'s Sky doit être fermé pour revenir en mode online', 'error');
            return false;
        }

        try {
            const result = await window.electronAPI.restoreOriginal();
            
            if (result.success) {
                this.appState.addMessage('Mode online restauré avec succès', 'success');
                await this.refreshExpeditionState();
                this.appState.selectExpedition(null);
                return true;
            } else {
                this.appState.addMessage(result.error || 'Erreur lors de la restauration', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error restoring original:', error);
            this.appState.addMessage('Erreur lors de la restauration du mode online', 'error');
            return false;
        }
    }

    switchToOnlineMode() {
        this.appState.selectExpedition(null);
    }

    startNMSMonitoring() {
        if (this.nmsMonitoringInterval) {
            clearInterval(this.nmsMonitoringInterval);
        }

        this.checkNMSStatus();
        this.nmsMonitoringInterval = setInterval(() => {
            this.checkNMSStatus();
        }, 3000);
    }

    stopNMSMonitoring() {
        if (this.nmsMonitoringInterval) {
            clearInterval(this.nmsMonitoringInterval);
            this.nmsMonitoringInterval = null;
        }
    }

    async checkNMSStatus() {
        try {
            const isRunning = await window.electronAPI.isNMSRunning();
            this.appState.updateNMSStatus(isRunning);
        } catch (error) {
            console.error('Error checking NMS status:', error);
        }
    }

    getExpeditionById(expeditionId) {
        const state = this.appState.getState();
        return state.availableExpeditions.find(exp => exp.id === expeditionId) || null;
    }

    getCurrentExpedition() {
        const state = this.appState.getState();
        if (!state.currentState || state.currentState.mode !== 'expedition') {
            return null;
        }
        return state.currentState.currentExpedition || null;
    }

    destroy() {
        this.stopNMSMonitoring();
    }
}

window.ExpeditionController = ExpeditionController;