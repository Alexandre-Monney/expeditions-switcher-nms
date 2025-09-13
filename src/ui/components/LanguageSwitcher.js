class LanguageSwitcher {
  constructor() {
    this.currentLanguage = 'fr';
    this.element = null;
    this.init();
  }

  init() {
    this.loadCurrentLanguage();
    this.createElement();
    this.setupEventListeners();
  }

  async loadCurrentLanguage() {
    try {
      const config = await window.electronAPI.loadConfig();
      this.currentLanguage = config.language || 'fr';
    } catch (error) {
      console.error('Error loading language from config:', error);
      this.currentLanguage = 'fr';
    }
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'language-switcher';
    this.element.innerHTML = `
      <select id="language-select" class="language-select">
        <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇬🇧 English</option>
      </select>
    `;
  }

  setupEventListeners() {
    const select = this.element.querySelector('#language-select');
    if (select) {
      select.addEventListener('change', async (e) => {
        await this.changeLanguage(e.target.value);
      });
    }
  }

  async changeLanguage(newLanguage) {
    if (newLanguage === this.currentLanguage) return;

    try {
      const config = await window.electronAPI.loadConfig();
      config.language = newLanguage;
      
      const success = await window.electronAPI.saveConfig(config);
      if (success) {
        this.currentLanguage = newLanguage;
        console.log(`Language changed to: ${newLanguage}`);
      } else {
        console.error('Failed to save language to config');
        this.element.querySelector('#language-select').value = this.currentLanguage;
      }
    } catch (error) {
      console.error('Error changing language:', error);
      this.element.querySelector('#language-select').value = this.currentLanguage;
    }
  }

  getElement() {
    return this.element;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

window.LanguageSwitcher = LanguageSwitcher;