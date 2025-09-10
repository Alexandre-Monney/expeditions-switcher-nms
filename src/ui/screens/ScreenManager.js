class ScreenManager {
    constructor(appState) {
        this.appState = appState;
        this.screens = new Map();
        this.currentScreen = null;
        
        this.loadingScreen = document.getElementById('loading-screen');
        
        this.appState.subscribe((newState, prevState) => {
            if (newState.currentScreen !== prevState.currentScreen) {
                this.switchTo(newState.currentScreen);
            }
        });
    }

    registerScreen(name, screenInstance) {
        this.screens.set(name, screenInstance);
    }

    switchTo(screenName) {
        this.hideAllScreens();
        
        if (screenName === 'loading') {
            this.showLoadingScreen();
            return;
        }

        const screen = this.screens.get(screenName);
        if (screen) {
            this.currentScreen = screenName;
            screen.show();
        } else {
            console.error(`Screen '${screenName}' not found`);
            this.showLoadingScreen();
        }
    }

    hideAllScreens() {
        this.screens.forEach(screen => screen.hide());
        
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    showLoadingScreen() {
        this.currentScreen = 'loading';
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    resetScreen(screenName) {
        const screen = this.screens.get(screenName);
        if (screen && typeof screen.reset === 'function') {
            screen.reset();
        }
    }
}

window.ScreenManager = ScreenManager;