class DOMTranslator {
  constructor(i18nService) {
    this.i18nService = i18nService;
  }

  translateElement(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    
    const translation = this.i18nService.translate(key, params);
    
    if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
      element.value = translation;
    } else if (element.tagName === 'INPUT' && element.type === 'text') {
      element.placeholder = translation;
    } else {
      element.textContent = translation;
    }
  }

  translateAttribute(element, attribute, key, params = {}) {
    if (!element || !this.i18nService) return;
    
    const translation = this.i18nService.translate(key, params);
    element.setAttribute(attribute, translation);
  }

  translateInnerHTML(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    
    const translation = this.i18nService.translate(key, params);
    element.innerHTML = translation;
  }

  translateSelectOptions(selectElement, optionsConfig) {
    if (!selectElement || !this.i18nService) return;
    
    selectElement.innerHTML = '';
    
    optionsConfig.forEach(config => {
      const option = document.createElement('option');
      option.value = config.value;
      option.textContent = this.i18nService.translate(config.textKey, config.params);
      
      if (config.selected) {
        option.selected = true;
      }
      
      selectElement.appendChild(option);
    });
  }

  setTextContent(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    element.textContent = this.i18nService.translate(key, params);
  }

  setInnerHTML(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    element.innerHTML = this.i18nService.translate(key, params);
  }

  setPlaceholder(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    element.placeholder = this.i18nService.translate(key, params);
  }

  setTitle(element, key, params = {}) {
    if (!element || !this.i18nService) return;
    element.title = this.i18nService.translate(key, params);
  }
}

window.DOMTranslator = DOMTranslator;