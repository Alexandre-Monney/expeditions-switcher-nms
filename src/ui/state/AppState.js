class AppState {
    constructor() {
        this.state = {
            config: null,
            selectedPlatform: null,
            selectedSteamId: null,
            currentScreen: 'loading',
            currentState: null,
            availableExpeditions: [],
            selectedExpeditionId: null,
            nmsRunning: false,
            messages: []
        };
        
        this.listeners = new Set();
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const previousState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifyListeners(this.state, previousState);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners(newState, previousState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState, previousState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    updateConfig(config) {
        this.setState({ config });
    }

    selectPlatform(platform) {
        this.setState({ selectedPlatform: platform });
    }

    selectSteamId(steamId) {
        this.setState({ selectedSteamId: steamId });
    }

    setCurrentScreen(screen) {
        this.setState({ currentScreen: screen });
    }

    updateExpeditionState(currentState) {
        this.setState({ currentState });
    }

    setAvailableExpeditions(expeditions) {
        this.setState({ availableExpeditions: expeditions });
    }

    selectExpedition(expeditionId) {
        this.setState({ selectedExpeditionId: expeditionId });
    }

    updateNMSStatus(isRunning) {
        this.setState({ nmsRunning: isRunning });
    }

    addMessage(message, type = 'info') {
        const newMessage = {
            id: Date.now(),
            text: message,
            type,
            timestamp: new Date()
        };
        
        this.setState({
            messages: [...this.state.messages, newMessage]
        });

        setTimeout(() => {
            this.removeMessage(newMessage.id);
        }, 5000);
    }

    removeMessage(messageId) {
        this.setState({
            messages: this.state.messages.filter(msg => msg.id !== messageId)
        });
    }

    reset() {
        this.state = {
            config: null,
            selectedPlatform: null,
            selectedSteamId: null,
            currentScreen: 'loading',
            currentState: null,
            availableExpeditions: [],
            selectedExpeditionId: null,
            nmsRunning: false,
            messages: []
        };
        this.notifyListeners(this.state, {});
    }
}

window.AppState = AppState;