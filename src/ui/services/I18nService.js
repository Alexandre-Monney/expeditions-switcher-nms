class I18nService {
  constructor() {
    this.currentLanguage = 'fr';
    this.translations = {};
    this.subscribers = [];
    this.loaded = false;
  }

  async init() {
    try {
      const config = await window.electronAPI.loadConfig();
      this.currentLanguage = config.language || 'fr';
      await this.loadTranslations(this.currentLanguage);
      this.loaded = true;
      this.notifySubscribers();
    } catch (error) {
      console.error('Error initializing I18nService:', error);
      this.currentLanguage = 'fr';
      await this.loadTranslations('fr');
      this.loaded = true;
    }
  }

  async loadTranslations(language) {
    try {
      const response = await fetch(`src/i18n/${language}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }
      this.translations = await response.json();
      this.currentLanguage = language;
      console.log(`Translations loaded for ${language}`);
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      if (language !== 'fr') {
        console.log('Fallback to French translations');
        await this.loadTranslations('fr');
      }
    }
  }

  async changeLanguage(newLanguage) {
    if (newLanguage === this.currentLanguage) return;

    try {
      const config = await window.electronAPI.loadConfig();
      config.language = newLanguage;
      await window.electronAPI.saveConfig(config);
      
      await this.loadTranslations(newLanguage);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }

  translate(key, params = {}) {
    if (!this.loaded) {
      return key;
    }

    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key does not resolve to string: ${key}`);
      return key;
    }

    return this.interpolate(value, params);
  }

  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error in I18n subscriber:', error);
      }
    });
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  isLoaded() {
    return this.loaded;
  }
}

window.I18nService = I18nService;