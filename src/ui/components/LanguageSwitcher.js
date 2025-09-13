class LanguageSwitcher {
  constructor(i18nService) {
    this.i18nService = i18nService;
    this.currentLanguage = 'fr';
    this.element = null;
    this.init();
  }

  init() {
    this.loadCurrentLanguage();
    this.createElement();
    this.setupEventListeners();
    this.setupI18nSubscription();
  }

  async loadCurrentLanguage() {
    if (this.i18nService) {
      this.currentLanguage = this.i18nService.getCurrentLanguage();
    } else {
      try {
        const config = await window.electronAPI.loadConfig();
        this.currentLanguage = config.language || 'fr';
      } catch (error) {
        console.error('Error loading language from config:', error);
        this.currentLanguage = 'fr';
      }
    }
  }

  setupI18nSubscription() {
    if (this.i18nService) {
      this.i18nService.subscribe((language) => {
        this.currentLanguage = language;
        this.updateSelectValue();
      });
    }
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'language-switcher';
    
    const frenchLabel = this.i18nService ? this.i18nService.translate('language.french') : '🇫🇷 Français';
    const englishLabel = this.i18nService ? this.i18nService.translate('language.english') : '🇬🇧 English';
    
    this.element.innerHTML = `
      <select id="language-select" class="language-select">
        <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>${frenchLabel}</option>
        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>${englishLabel}</option>
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
      if (this.i18nService) {
        await this.i18nService.changeLanguage(newLanguage);
        this.currentLanguage = newLanguage;
      } else {
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
      }
    } catch (error) {
      console.error('Error changing language:', error);
      this.element.querySelector('#language-select').value = this.currentLanguage;
    }
  }

  updateSelectValue() {
    const select = this.element?.querySelector('#language-select');
    if (select && select.value !== this.currentLanguage) {
      select.value = this.currentLanguage;
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