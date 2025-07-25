// Cross-browser API compatibility - must be at the very top
const browserAPI = (function() {
  if (typeof browser !== 'undefined') {
    return browser; // Firefox
  } else if (typeof chrome !== 'undefined') {
    return chrome; // Chrome
  } else {
    console.error('No browser API available');
    return {};
  }
})();

// Context detection
const isFirefox = typeof browser !== 'undefined';
const isChrome = typeof chrome !== 'undefined' && typeof browser === 'undefined';
const isSidebar = window.location.search.includes('sidebar') || 
                 document.body.clientWidth > 300 ||
                 window.name === 'sidebar';

console.log('Extension context:', {
  isFirefox,
  isChrome,
  isSidebar,
  width: document.body.clientWidth
});

// --------------------------- Init log box ---------------------------
const logBox = document.querySelector("#log");
const logQueue = [];

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logQueue.unshift({ timestamp, message });

  if (logQueue.length > 6) {
    logQueue.pop();
  }

  logBox.innerHTML = logQueue.map(log => `
    <div class="log-entry">
      <div class="log-timestamp">${log.timestamp}</div>
      <div class="log-message">${log.message}</div>
    </div>
  `).join('');
}

// --------------------------- Global Settings ---------------------------

const settings = {
  idoitUrl: 'https://idoit.example.com',
  zplTemplate: `^XA
^CF0,27
^FO0,10^BQN,2,4^FDQA,{URL}/objID={ID}^FS
^FO145,25^FD{LINE1}^FS
^FO145,60^FD{LINE2}^FS
^FO145,100^A0N,20,20^FD{TYPE}^FS
^FO145,130^A0N,27,27^FD{ID}^FS
^XZ`,
  printerUrl: 'http://localhost:631/pstprnt',
  previewApiUrl: 'http://api.labelary.com/v1/printers/12dpmm/labels/0.94x0.55/0/',
  replaceList: 'Development=Dev,Temperature=Temp.'
};

// Replace all direct browser/chrome calls with browserAPI

async function loadSettings() {
  try {
    // Use cross-browser storage API
    if (browserAPI.storage && browserAPI.storage.local) {
      const data = await browserAPI.storage.local.get([
        'idoit-base-url', 'zpl-template', 'printer-url', 
        'preview-api-url', 'replace-list'
      ]);
      
      settings.idoitUrl = data['idoit-base-url'] || settings.idoitUrl;
      settings.zplTemplate = data['zpl-template'] || settings.zplTemplate;
      settings.printerUrl = data['printer-url'] || settings.printerUrl;
      settings.previewApiUrl = data['preview-api-url'] || settings.previewApiUrl;
      settings.replaceList = data['replace-list'] || settings.replaceList;
    } else {
      // Fallback to localStorage
      settings.idoitUrl = localStorage.getItem('idoit-base-url') || settings.idoitUrl;
      settings.zplTemplate = localStorage.getItem('zpl-template') || settings.zplTemplate;
      settings.printerUrl = localStorage.getItem('printer-url') || settings.printerUrl;
      settings.previewApiUrl = localStorage.getItem('preview-api-url') || settings.previewApiUrl;
      settings.replaceList = localStorage.getItem('replace-list') || settings.replaceList;
    }
    
    // Update UI elements
    const elements = {
      'idoit-base-url': settings.idoitUrl,
      'zpl-template': settings.zplTemplate,
      'printer-url': settings.printerUrl,
      'preview-api-url': settings.previewApiUrl,
      'replace-list': settings.replaceList
    };
    
    Object.keys(elements).forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = elements[id];
      }
    });
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const settingsToSave = {
      'idoit-base-url': document.getElementById('idoit-base-url')?.value || settings.idoitUrl,
      'zpl-template': document.getElementById('zpl-template')?.value || settings.zplTemplate,
      'printer-url': document.getElementById('printer-url')?.value || settings.printerUrl,
      'preview-api-url': document.getElementById('preview-api-url')?.value || settings.previewApiUrl,
      'replace-list': document.getElementById('replace-list')?.value || settings.replaceList
    };

    // Update global settings
    Object.keys(settingsToSave).forEach(key => {
      const settingKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase()).replace('-', '');
      if (settingKey === 'idoitBaseUrl') settings.idoitUrl = settingsToSave[key];
      else if (settingKey === 'zplTemplate') settings.zplTemplate = settingsToSave[key];
      else if (settingKey === 'printerUrl') settings.printerUrl = settingsToSave[key];
      else if (settingKey === 'previewApiUrl') settings.previewApiUrl = settingsToSave[key];
      else if (settingKey === 'replaceList') settings.replaceList = settingsToSave[key];
    });

    // Save to extension storage
    if (browserAPI.storage && browserAPI.storage.local) {
      await browserAPI.storage.local.set(settingsToSave);
    } else {
      // Fallback to localStorage
      Object.keys(settingsToSave).forEach(key => {
        localStorage.setItem(key, settingsToSave[key]);
      });
    }
    
    log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    log('Error saving settings: ' + error.message);
  }
}

function parseReplaceList(input) {
  return input.split(',').map(pair => pair.split('='));
}

// --------------------------- Cross-browser tab management ---------------------------

let myWindowId;
let title, url;
let objData = [];

async function getCurrentTabs() {
  try {
    if (isFirefox && isSidebar) {
      // Firefox sidebar context
      const currentWindow = await browserAPI.windows.getCurrent();
      return await browserAPI.tabs.query({ windowId: currentWindow.id });
    } else {
      // Chrome popup or Firefox popup
      return await browserAPI.tabs.query({ currentWindow: true, active: true });
    }
  } catch (error) {
    console.error('Error getting tabs:', error);
    return [];
  }
}

async function updateContent() {
  try {
    let tabs;
    
    if (isFirefox && isSidebar && myWindowId) {
      tabs = await browserAPI.tabs.query({windowId: myWindowId, active: true});
    } else {
      tabs = await browserAPI.tabs.query({currentWindow: true, active: true});
    }
    
    if (tabs && tabs.length > 0) {
      const activeTab = tabs[0];
      title = activeTab.title;
      url = activeTab.url;

      if (url.startsWith(settings.idoitUrl) && url.includes('objID')) {
        const urlObj = new URL(url);
        const urlParams = new URLSearchParams(urlObj.search);
        objData['id'] = urlParams.get('objID');

        let titleSplit = title.split(' > ');
        objData['type'] = titleSplit[1];
        objData['name'] = titleSplit[2];
        log(`Loaded I-Doit Object from active Tab<br/><b>ID:</b> ${objData['id']}<br/><b>Name:</b> ${objData['name']}<br/><b>Type:</b> ${objData['type']}`);

        prefillInputFields(objData);
      } else {
        log(`No I-DOIT Data found.`);
      }
    }
  } catch (error) {
    console.error('Error updating content:', error);
  }
}

function splitName(name) {
  let line1 = '';
  let line2 = '';
  if (name.length <= 11) {
    line1 = name;
  } else {
    let splitIndex = Math.max(
      name.lastIndexOf(' ', 11),
      name.lastIndexOf('-', 10), // This character take up more space
      name.lastIndexOf('_', 10), // This character take up more space
      name.lastIndexOf('.', 11)
    );
    if (splitIndex === -1) {
      splitIndex = 11;
    }
    line1 = name.substring(0, splitIndex);
    line2 = name.substring(splitIndex, name.length);
  }
  line1 = line1.trim();
  line2 = line2.trim();
  log("Name too long, splitting into: <br/>" + [line1, line2]);
  return [line1, line2];
}

function prefillInputFields(data) {
  document.getElementById('id').value = data['id'];
  
  let nameSplit = splitName(data['name']);
  document.getElementById('line1').value = nameSplit[0];
  document.getElementById('line2').value = nameSplit[1];
  
  // apply the settings replace list to the type
  let replaceList = parseReplaceList(settings.replaceList);
  for (let i = 0; i < replaceList.length; i++) {
    data['type'] = data['type'].replace(replaceList[i][0], replaceList[i][1]);
  }
  document.getElementById('type').value = data['type'];
  
  // clear the preview image
  document.getElementById('label-preview').style.backgroundImage = "url('')";
  // clear the zpl input field
  const zplInputTextarea = document.getElementById('zpl-input-textarea');
  if (zplInputTextarea) {
    zplInputTextarea.value = '';
  }
}

// --------------------------- Label preview ---------------------------

function showPreview(zplData) {
  const zplInputTextarea = document.getElementById('zpl-input-textarea');
  if (zplInputTextarea) {
    zplInputTextarea.value = zplData;
  }
  const url = `${settings.previewApiUrl}${encodeURIComponent(zplData)}`;
  document.getElementById('label-preview').style.backgroundImage = 'url(\'' + url + '\')';
  log('ZPL Preview rendered');
}

// --------------------------- Print Label ---------------------------
function generateZPL(inputs) {
  let url = settings.idoitUrl + "/index.php?objID=";
  const id = inputs[0].value || '';
  const line1 = inputs[1].value || '';
  const line2 = inputs[2].value || '';
  const type = inputs[3].value || '';
  log("ZPL generated for ID:" + id);
  return settings.zplTemplate
    .replace('{URL}', settings.idoitUrl)
    .replace('{ID}', id)
    .replace('{LINE1}', line1)
    .replace('{LINE2}', line2)
    .replace('{TYPE}', type);
}

async function printLabel(zplData) {
  try {
    const response = await fetch(settings.printerUrl, {
      method: 'POST',
      body: zplData
    });
    const result = await response.text();
    log('Print successful: ' + result);
  } catch (error) {
    log('Print failed: ' + error.message);
  }
}

// --------------------------- Initialize ---------------------------

async function initializeExtension() {
  try {
    await loadSettings();
    
    // Setup tab listeners only in sidebar context
    if (isSidebar && browserAPI.tabs) {
      if (browserAPI.tabs.onActivated) {
        browserAPI.tabs.onActivated.addListener(updateContent);
      }
      if (browserAPI.tabs.onUpdated) {
        browserAPI.tabs.onUpdated.addListener(updateContent);
      }
      
      // Get window ID for Firefox sidebar
      if (isFirefox) {
        const windowInfo = await browserAPI.windows.getCurrent({populate: true});
        myWindowId = windowInfo.id;
      }
    }
    
    await updateContent();
    setupEventListeners();
    
  } catch (error) {
    console.error('Initialization error:', error);
    log('Extension initialization failed: ' + error.message);
  }
}

function setupEventListeners() {
  // Settings
  const saveSettingsButton = document.getElementById('save-settings-button');
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', saveSettings);
  }

  // General UI elements - Tab switching
  document.querySelectorAll('.tab-button').forEach(tabBtn => {
    tabBtn.addEventListener('click', function () {
      document.querySelectorAll('.tab-content').forEach(tabContent => {
        tabContent.style.display = 'none';
      });
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      const targetTab = document.getElementById(tabBtn.getAttribute('data-tab'));
      if (targetTab) {
        targetTab.style.display = 'block';
      }
      tabBtn.classList.add('active');
    });
  });

  // Label data section
  const inputFields = [
    document.getElementById('id'),
    document.getElementById('line1'),
    document.getElementById('line2'),
    document.getElementById('type')
  ];

  const previewInputButton = document.getElementById('preview-input-button');
  const printInputButton = document.getElementById('print-input-button');

  if (previewInputButton) {
    previewInputButton.addEventListener('click', function () {
      const zplData = generateZPL(inputFields);
      showPreview(zplData);
    });
  }

  if (printInputButton) {
    printInputButton.addEventListener('click', function () {
      const zplData = generateZPL(inputFields);
      printLabel(zplData);
    });
  }

  // ZPL data section
  const zplInputTextarea = document.getElementById('zpl-input-textarea');
  const previewZplButton = document.getElementById('preview-zpl-button');
  const printZplButton = document.getElementById('print-zpl-button');

  if (previewZplButton) {
    previewZplButton.addEventListener('click', function () {
      if (zplInputTextarea) {
        showPreview(zplInputTextarea.value);
      }
    });
  }

  if (printZplButton) {
    printZplButton.addEventListener('click', function () {
      if (zplInputTextarea) {
        printLabel(zplInputTextarea.value);
      }
    });
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
