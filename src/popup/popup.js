// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Default settings
const defaultSettings = {
  idoitUrl: 'https://idoit.fast-lta.de',
  zplTemplate: `^XA
^CF0,27
^FO0,10^BQN,2,4^FDQA,{URL}/objID={ID}^FS
^FO145,25^FD{LINE1}^FS
^FO145,60^FD{LINE2}^FS
^FO145,100^A0N,20,20^FD{TYPE}^FS
^FO145,130^A0N,27,27^FD{ID}^FS
^XZ`,
  previewApiUrl: 'http://api.labelary.com/v1/printers/12dpmm/labels/0.94x0.55/0/',
  replaceList: 'Development=Dev,Temperature=Temp.',
  printerUrl: 'http://localhost:631/pstprnt'
};

let currentSettings = {};
let currentZplData = '';

// Load settings from storage - using browserAPI
async function loadSettings() {
  const result = await browserAPI.storage.local.get([
    'idoit-base-url',
    'zpl-template', 
    'preview-api-url',
    'replace-list',
    'printer-url'
  ]);
  
  currentSettings = {
    idoitUrl: result['idoit-base-url'] || defaultSettings.idoitUrl,
    zplTemplate: result['zpl-template'] || defaultSettings.zplTemplate,
    previewApiUrl: result['preview-api-url'] || defaultSettings.previewApiUrl,
    replaceList: result['replace-list'] || defaultSettings.replaceList,
    printerUrl: result['printer-url'] || defaultSettings.printerUrl
  };
  
  return currentSettings;
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
  return {
    id: document.getElementById('id').value,
    line1: document.getElementById('line1').value,
    line2: document.getElementById('line2').value,
    type: document.getElementById('type').value
  };
}

// Fill form with data
function fillForm(data) {
  document.getElementById('id').value = data.id || '';
  document.getElementById('line1').value = data.line1 || '';
  document.getElementById('line2').value = data.line2 || '';
  document.getElementById('type').value = data.type || '';
}

// Open options page - improved cross-browser compatibility
function openOptionsPage() {
  try {
    // Method 1: Try runtime.openOptionsPage (most reliable)
    if (browserAPI.runtime && browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage().then(() => {
        window.close();
      }).catch(() => {
        // Fallback if openOptionsPage fails
        openOptionsTabFallback();
      });
    } else {
      // Method 2: Direct tab creation fallback
      openOptionsTabFallback();
    }
  } catch (error) {
    console.error('Error opening options:', error);
    // Last resort fallback
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
      // If all else fails, try direct window.open
      window.open(optionsUrl, '_blank');
      window.close();
    });
  } catch (error) {
    console.error('Fallback failed:', error);
  }
}

// Show not I-Doit message with working options link
function showNotIdoitMessage() {
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="not-idoit-message">
      <h3>🏷️ Fast Label Printer</h3>
      <p><strong>This extension works only on I-Doit object pages.</strong></p>
      <p>Please navigate to an I-Doit object page that contains <code>objID=</code> in the URL.</p>
      <p><em>You may need to configure your I-Doit URL in the settings.</em></p>
      <button id="options-link-inline" class="options-link">⚙️ Open Settings</button>
    </div>
  `;
  
  // Add event listener for inline options link
  const optionsLinkInline = document.getElementById('options-link-inline');
  if (optionsLinkInline) {
    optionsLinkInline.addEventListener('click', function(e) {
      e.preventDefault();
      openOptionsPage();
    });
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
  
  // Create new image to test if URL loads
  const img = new Image();
  img.onload = function() {
    previewElement.style.backgroundImage = `url('${url}')`;
    previewElement.classList.add('has-preview');
    updateStatus('Preview ready - click print to send to printer', 'success');
    
    // Enable print button
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

// Update preview with current form data
function updatePreview() {
  const formData = getFormData();
  
  // Apply replacement logic to type when updating preview
  formData.type = applyReplaceList(formData.type, currentSettings.replaceList);
  
  currentZplData = generateZPL(formData, currentSettings.zplTemplate, currentSettings.idoitUrl);
  showPreview(currentZplData);
}

// Print label
async function printLabel() {
  if (!currentZplData) {
    updateStatus('No label data to print', 'error');
    return;
  }

  updateStatus('Printing...', 'loading');
  
  try {
    const response = await fetch(currentSettings.printerUrl, {
      method: 'POST',
      body: currentZplData
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

// Get current tab data and initialize
async function initializePopup() {
  try {
    await loadSettings();
    
    // Use browserAPI instead of chrome
    const tabs = await browserAPI.tabs.query({active: true, currentWindow: true});
    const activeTab = tabs[0];
    const title = activeTab.title;
    const url = activeTab.url;

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
      
      // Fill form with extracted data
      fillForm(labelData);
      
      // Generate initial preview
      updatePreview();
      
    } else {
      // Not an I-Doit page, show message
      showNotIdoitMessage();
    }
  } catch (error) {
    showNotIdoitMessage();
    console.error('Popup initialization error:', error);
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', function() {
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
});