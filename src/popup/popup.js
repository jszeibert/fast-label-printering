// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

let currentSettings = {};
let currentZplData = '';

// Load settings from storage - NO DEFAULTS HERE
async function loadSettings() {
  const result = await browserAPI.storage.local.get([
    'idoit-base-url',
    'zpl-template', 
    'preview-api-url',
    'replace-list',
    'printer-url'
  ]);
  
  currentSettings = {
    idoitUrl: result['idoit-base-url'] || '',
    zplTemplate: result['zpl-template'] || '',
    previewApiUrl: result['preview-api-url'] || '',
    replaceList: result['replace-list'] || '',
    printerUrl: result['printer-url'] || ''
  };
  
  return currentSettings;
}

// Check if essential settings are configured
function checkRequiredSettings() {
  const missing = [];
  
  if (!currentSettings.idoitUrl) missing.push('I-Doit URL');
  if (!currentSettings.printerUrl) missing.push('Printer URL');
  if (!currentSettings.previewApiUrl) missing.push('Preview API URL');
  if (!currentSettings.zplTemplate) missing.push('ZPL Template');
  
  return missing;
}

// Show settings required message
function showSettingsRequiredMessage(missingSettings) {
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <div class="settings-required-message">
        <h3>⚙️ Settings Required</h3>
        <p><strong>Please configure the following settings first:</strong></p>
        <ul>
          ${missingSettings.map(setting => `<li>${setting}</li>`).join('')}
        </ul>
        <p><em>The extension needs these settings to work properly.</em></p>
        <button id="open-settings-btn" class="settings-btn">Open Settings</button>
      </div>
    `;
    
    // Add event listener for settings button
    const settingsBtn = document.getElementById('open-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openOptionsPage();
      });
    }
  }
}

// Parse replace list
function parseReplaceList(input) {
  if (!input || input.trim() === '') return [];
  return input.split(',').map(pair => {
    const parts = pair.split('=');
    return parts.length === 2 ? [parts[0].trim(), parts[1].trim()] : null;
  }).filter(pair => pair !== null);
}

// Apply replace list to text
function applyReplaceList(text, replaceList) {
  if (!text || !replaceList) return text;
  
  const replacements = parseReplaceList(replaceList);
  let result = text;
  
  for (const [search, replace] of replacements) {
    result = result.replace(new RegExp(search, 'g'), replace);
  }
  
  return result;
}

// Split name intelligently
function splitName(name) {
  if (!name || name.length <= 11) {
    return [name || '', ''];
  }

  let splitIndex = Math.max(
    name.lastIndexOf(' ', 11),
    name.lastIndexOf('-', 10),
    name.lastIndexOf('_', 10),
    name.lastIndexOf('.', 11)
  );

  if (splitIndex === -1) {
    splitIndex = 11;
  }

  const line1 = name.substring(0, splitIndex).trim();
  const line2 = name.substring(splitIndex).trim();

  return [line1, line2];
}

// Generate ZPL code
function generateZPL(data, template, idoitUrl) {
  return template
    .replace('{URL}', idoitUrl)
    .replace(/{ID}/g, data.id || '')
    .replace('{LINE1}', data.line1 || '')
    .replace('{LINE2}', data.line2 || '')
    .replace('{TYPE}', data.type || '');
}

// Get current form data
function getFormData() {
  const idElement = document.getElementById('id');
  const line1Element = document.getElementById('line1');
  const line2Element = document.getElementById('line2');
  const typeElement = document.getElementById('type');
  
  return {
    id: idElement ? idElement.value : '',
    line1: line1Element ? line1Element.value : '',
    line2: line2Element ? line2Element.value : '',
    type: typeElement ? typeElement.value : ''
  };
}

// Populate form with data
function populateForm(data) {
  console.log('Populating form with data:', data);
  
  const idElement = document.getElementById('id');
  const typeElement = document.getElementById('type');
  const line1Element = document.getElementById('line1');
  const line2Element = document.getElementById('line2');
  
  if (idElement) idElement.value = data.id || '';
  if (typeElement) typeElement.value = data.type || '';
  if (line1Element) line1Element.value = data.line1 || '';
  if (line2Element) line2Element.value = data.line2 || '';
}

// Open options page
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

// Fallback method to open options in new tab
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

// Show not I-Doit message
function showNotIdoitMessage() {
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <div class="not-idoit-message">
        <h3>🏷️ Fast Label Printer</h3>
        <p><strong>This extension works only on I-Doit object pages.</strong></p>
        <p>Please navigate to an I-Doit object page that contains <code>objID=</code> in the URL.</p>
        <p><em>Current URL does not match your configured I-Doit URL.</em></p>
        <button id="options-link-inline" class="options-link">⚙️ Check Settings</button>
      </div>
    `;
    
    const optionsLinkInline = document.getElementById('options-link-inline');
    if (optionsLinkInline) {
      optionsLinkInline.addEventListener('click', function(e) {
        e.preventDefault();
        openOptionsPage();
      });
    }
  }
}

// Update status message
function updateStatus(message, type = 'info') {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
  }
}

// Show preview
function showPreview(zplData) {
  updateStatus('Generating preview...', 'loading');
  
  const url = `${currentSettings.previewApiUrl}${encodeURIComponent(zplData)}`;
  const previewElement = document.getElementById('label-preview');
  
  if (previewElement) {
    const img = new Image();
    img.onload = function() {
      previewElement.style.backgroundImage = `url('${url}')`;
      previewElement.classList.add('has-preview');
      updateStatus('Preview ready - click print to send to printer', 'success');
      
      const printBtn = document.getElementById('print-btn');
      if (printBtn) printBtn.disabled = false;
    };
    img.onerror = function() {
      updateStatus('Preview generation failed - check your settings', 'error');
      const printBtn = document.getElementById('print-btn');
      if (printBtn) printBtn.disabled = true;
    };
    img.src = url;
  }
}

// Update preview with current form data
function updatePreview() {
  const formData = getFormData();
  formData.type = applyReplaceList(formData.type, currentSettings.replaceList);
  currentZplData = generateZPL(formData, currentSettings.zplTemplate, currentSettings.idoitUrl);
  showPreview(currentZplData);
}

// Print function
async function printLabel() {
  if (!currentZplData) {
    updateStatus('No label data to print', 'error');
    return;
  }

  updateStatus('Printing...', 'loading');
  
  try {
    const response = await fetch(currentSettings.printerUrl, {
      method: 'POST',
      body: currentZplData,
      headers: {
        'Content-Type': 'application/x-zpl'
      }
    });
    
    if (response.ok) {
      updateStatus('Print sent successfully', 'success');
    } else {
      updateStatus('Print failed: ' + response.statusText, 'error');
    }
  } catch (error) {
    updateStatus('Print failed: ' + error.message, 'error');
  }
}

// Initialize popup
async function initializePopup() {
  try {
    console.log('Initializing popup...');
    await loadSettings();
    console.log('Settings loaded:', currentSettings);
    
    // Check if required settings are configured
    const missingSettings = checkRequiredSettings();
    if (missingSettings.length > 0) {
      console.log('Missing required settings:', missingSettings);
      showSettingsRequiredMessage(missingSettings);
      return;
    }
    
    const tabs = await browserAPI.tabs.query({active: true, currentWindow: true});
    const activeTab = tabs[0];
    
    if (!activeTab) {
      console.error('No active tab found');
      showNotIdoitMessage();
      return;
    }
    
    const title = activeTab.title;
    const url = activeTab.url;
    console.log('Active tab:', { title, url });

    // Check if this is an I-Doit page with objID
    if (url.startsWith(currentSettings.idoitUrl) && url.includes('objID')) {
      const urlObj = new URL(url);
      const urlParams = new URLSearchParams(urlObj.search);
      const id = urlParams.get('objID');

      // Extract name and type from title
      const titleSplit = title.split(' > ');
      let type = titleSplit[1] || '';
      const name = titleSplit[2] || '';

      // Apply replace list to type
      type = applyReplaceList(type, currentSettings.replaceList);

      // Split name into two lines
      const [line1, line2] = splitName(name);

      const labelData = { id, line1, line2, type };
      console.log('Extracted label data:', labelData);
      
      // Fill form with extracted data
      populateForm(labelData);
      
      // Generate initial preview
      updatePreview();
      
    } else {
      console.log('Not an I-Doit page');
      showNotIdoitMessage();
    }
  } catch (error) {
    console.error('Popup initialization error:', error);
    showNotIdoitMessage();
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, starting initialization...');
  
  initializePopup();
  
  // Add event listeners
  const updateBtn = document.getElementById('update-preview-btn');
  const printBtn = document.getElementById('print-btn');
  const optionsBtn = document.getElementById('options-btn');
  
  if (updateBtn) {
    updateBtn.addEventListener('click', updatePreview);
  }
  
  if (printBtn) {
    printBtn.addEventListener('click', printLabel);
    printBtn.disabled = true; // Initially disable
  }
  
  if (optionsBtn) {
    optionsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openOptionsPage();
    });
  }
  
  console.log('Event listeners added');
});