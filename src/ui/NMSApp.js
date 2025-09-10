class NMSApp {
    constructor() {
        this.appState = new AppState();
        this.platformController = new PlatformController(this.appState);
        this.expeditionController = new ExpeditionController(this.appState);
        
        this.setupScreen = new SetupScreen(this.appState, this.platformController);
        this.mainScreen = new MainScreen(this.appState, this.platformController, this.expeditionController);
        
        this.screenManager = new ScreenManager(this.appState);
        this.messageSystem = new MessageSystem(this.appState);
        
        this.init();
    }

    async init() {
        this.registerScreens();
        await this.loadInitialConfig();
        this.determineInitialScreen();
    }

    registerScreens() {
        this.screenManager.registerScreen('setup', this.setupScreen);
        this.screenManager.registerScreen('main', this.mainScreen);
    }

    async loadInitialConfig() {
        const config = await this.platformController.loadConfig();
        return config;
    }

    determineInitialScreen() {
        const state = this.appState.getState();
        
        if (state.config && state.config.firstSetup === false) {
            this.appState.setCurrentScreen('main');
        } else {
            this.appState.setCurrentScreen('setup');
        }
    }

    destroy() {
        this.expeditionController.destroy();
        this.appState.reset();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.nmsApp = new NMSApp();
});