// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Utility Classes
class LabelProcessor {
  static splitName(name, maxLength = 11) {
    if (!name || name.length <= maxLength) return [name || '', ''];
    
    const breakPoints = [' ', '-', '_', '.'];
    let splitIndex = -1;
    
    for (const char of breakPoints) {
      const idx = name.lastIndexOf(char, maxLength);
      if (idx > splitIndex) splitIndex = idx;
    }
    
    if (splitIndex === -1) splitIndex = maxLength;
    
    return [
      name.substring(0, splitIndex).trim(),
      name.substring(splitIndex).trim()
    ];
  }

  static applyReplacements(text, replaceList) {
    if (!text || !replaceList) return text;
    
    return replaceList.split(',')
      .map(pair => pair.split('='))
      .filter(parts => parts.length === 2)
      .reduce((result, [search, replace]) => 
        result.replace(new RegExp(search.trim(), 'g'), replace.trim()), text
      );
  }

  static generateZPL(data, template, idoitUrl) {
    const replacements = { 
      '{URL}': idoitUrl, 
      ...Object.fromEntries(
        Object.entries(data).map(([key, val]) => [`{${key.toUpperCase()}}`, val || ''])
      )
    };
    
    return Object.entries(replacements).reduce(
      (zpl, [placeholder, value]) => zpl.replace(new RegExp(placeholder, 'g'), value),
      template
    );
  }
}

class PopupUI {
  constructor() {
    this.elements = null;
  }

  init() {
    this.elements = {
      container: document.querySelector('.container'),
      mainContent: document.getElementById('main-content'),
      status: document.getElementById('status'),
      preview: document.getElementById('label-preview'),
      printBtn: document.getElementById('print-btn'),
      updateBtn: document.getElementById('update-preview-btn'),
      optionsBtn: document.getElementById('options-btn'),
      inputs: {
        id: document.getElementById('id'),
        type: document.getElementById('type'),
        line1: document.getElementById('line1'),
        line2: document.getElementById('line2')
      }
    };
  }

  updateStatus(message, type = 'info') {
    if (this.elements?.status) {
      this.elements.status.textContent = message;
      this.elements.status.className = `status ${type}`;
    }
  }

  getFormData() {
    if (!this.elements) return {};
    
    return {
      id: this.elements.inputs.id?.value || '',
      line1: this.elements.inputs.line1?.value || '',
      line2: this.elements.inputs.line2?.value || '',
      type: this.elements.inputs.type?.value || ''
    };
  }

  populateForm(data) {
    if (!this.elements) return;
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.elements.inputs[key]) {
        this.elements.inputs[key].value = value || '';
      }
    });
  }
}

class PreviewManager {
  static show(zplData, previewApiUrl, ui) {
    ui.updateStatus('Generating preview...', 'loading');
    
    const url = `${previewApiUrl}${encodeURIComponent(zplData)}`;
    const previewElement = ui.elements?.preview;
    
    if (previewElement) {
      const img = new Image();
      img.onload = function() {
        previewElement.style.backgroundImage = `url('${url}')`;
        previewElement.classList.add('has-preview');
        ui.updateStatus('Preview ready - click print to send to printer', 'success');
        
        const printBtn = ui.elements?.printBtn;
        if (printBtn) printBtn.disabled = false;
      };
      img.onerror = function() {
        ui.updateStatus('Preview generation failed - check your settings', 'error');
        const printBtn = ui.elements?.printBtn;
        if (printBtn) printBtn.disabled = true;
      };
      img.src = url;
    }
  }
}

class SettingsManager {
  static REQUIRED_KEYS = ['idoitUrl', 'printerUrl', 'previewApiUrl', 'zplTemplate'];
  static STORAGE_MAP = {
    idoitUrl: 'idoit-base-url',
    zplTemplate: 'zpl-template',
    previewApiUrl: 'preview-api-url',
    replaceList: 'replace-list',  
    printerUrl: 'printer-url'
  };

  static async load() {
    const storageKeys = Object.values(this.STORAGE_MAP);
    const result = await browserAPI.storage.local.get(storageKeys);
    
    return Object.fromEntries(
      Object.entries(this.STORAGE_MAP).map(([key, storageKey]) => 
        [key, result[storageKey] || '']
      )
    );
  }

  static checkRequired(settings) {
    return this.REQUIRED_KEYS.filter(key => !settings[key]);
  }
}

// Template Functions
function showTemplate(templateId) {
  const template = document.getElementById(templateId);
  const container = document.querySelector('.container');
  
  if (template && container) {
    const clone = template.content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(clone);
    
    // Bind events for template buttons
    if (templateId === 'settings-required-template') {
      document.getElementById('open-settings-btn')?.addEventListener('click', openOptionsPage);
    } else if (templateId === 'not-idoit-template') {
      document.getElementById('options-link-inline')?.addEventListener('click', openOptionsPage);
    }
  }
}

// Options Page Functions
function openOptionsPage() {
  try {
    if (browserAPI.runtime && browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage().then(() => {
        window.close();
      }).catch(() => {
        openOptionsTabFallback();
      });
    } else {
      openOptionsTabFallback();
    }
  } catch (error) {
    console.error('Error opening options:', error);
    openOptionsTabFallback();
  }
}

function openOptionsTabFallback() {
  try {
    const optionsUrl = browserAPI.runtime.getURL('options/options.html');
    browserAPI.tabs.create({ url: optionsUrl }).then(() => {
      window.close();
    }).catch((error) => {
      console.error('Failed to open options tab:', error);
      window.open(optionsUrl, '_blank');
      window.close();
    });
  } catch (error) {
    console.error('Fallback failed:', error);
  }
}

// Main PopupManager
class PopupManager {
  constructor() {
    this.settings = {};
    this.zplData = '';
    this.ui = new PopupUI();
  }

  async initialize() {
    this.ui.init();
    this.settings = await SettingsManager.load();
    
    const missing = SettingsManager.checkRequired(this.settings);
    if (missing.length > 0) {
      return showTemplate('settings-required-template');
    }
    
    const tab = await this.getCurrentTab();
    if (!tab) {
      return showTemplate('not-idoit-template');
    }
    
    if (this.isIdoitPage(tab.url)) {
      this.processIdoitPage(tab);
    } else {
      showTemplate('not-idoit-template');
    }
  }

  async getCurrentTab() {
    const tabs = await browserAPI.tabs.query({active: true, currentWindow: true});
    return tabs[0];
  }

  isIdoitPage(url) {
    return url.startsWith(this.settings.idoitUrl) && url.includes('objID');
  }

  processIdoitPage(tab) {
    const urlParams = new URLSearchParams(new URL(tab.url).search);
    const titleParts = tab.title.split(' > ');
    
    const [line1, line2] = LabelProcessor.splitName(titleParts[2] || '');
    
    const labelData = {
      id: urlParams.get('objID'),
      type: LabelProcessor.applyReplacements(titleParts[1] || '', this.settings.replaceList),
      line1,
      line2
    };
    
    this.ui.populateForm(labelData);
    this.updatePreview();
    this.bindEvents();
  }

  updatePreview() {
    const formData = this.ui.getFormData();
    formData.type = LabelProcessor.applyReplacements(formData.type, this.settings.replaceList);
    this.zplData = LabelProcessor.generateZPL(formData, this.settings.zplTemplate, this.settings.idoitUrl);
    PreviewManager.show(this.zplData, this.settings.previewApiUrl, this.ui);
  }

  bindEvents() {
    const handlers = {
      'update-preview-btn': () => this.updatePreview(),
      'print-btn': () => this.print(),
      'options-btn': () => openOptionsPage()
    };
    
    Object.entries(handlers).forEach(([id, handler]) => {
      document.getElementById(id)?.addEventListener('click', handler);
    });
  }

  async print() {
    if (!this.zplData) {
      return this.ui.updateStatus('No label data to print', 'error');
    }
    
    this.ui.updateStatus('Printing...', 'loading');
    try {
      const response = await fetch(this.settings.printerUrl, {
        method: 'POST', 
        body: this.zplData, 
        headers: {'Content-Type': 'application/x-zpl'}
      });
      
      this.ui.updateStatus(
        response.ok ? 'Print sent successfully' : `Print failed: ${response.statusText}`,
        response.ok ? 'success' : 'error'
      );
    } catch (error) {
      this.ui.updateStatus(`Print failed: ${error.message}`, 'error');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const popupManager = new PopupManager();
  popupManager.initialize();
});