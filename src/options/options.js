// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Default settings - ONLY HERE!
const defaultSettings = {
  idoitUrl: 'https://idoit.example.com',
  zplTemplate: `^XA
^PW280          ; Set print width (1.00 in)
^LL164          ; Set label length (0.50 in)
^CF0,27
^FO0,10^BQN,2,4^FDQA,{URL}/objID={ID}^FS
^FO145,25^FD{LINE1}^FS
^FO145,60^FD{LINE2}^FS
^FO145,100^A0N,20,20^FD{TYPE}^FS
^FO145,130^A0N,27,27^FD{ID}^FS
^XZ`,
  previewApiUrl: 'http://api.labelary.com/v1/printers/12dpmm/labels/0.94x0.55/0/',
  replaceList: 'Development=Dev,Temperature=Temp.',
  printerUrl: 'https://localhost/pstprnt'
};

// Load settings
async function loadSettings() {
  const result = await browserAPI.storage.local.get([
    'idoit-base-url',
    'zpl-template', 
    'preview-api-url',
    'replace-list',
    'printer-url'
  ]);
  
  // Use defaults if not set
  document.getElementById('idoit-base-url').value = result['idoit-base-url'] || defaultSettings.idoitUrl;
  document.getElementById('zpl-template').value = result['zpl-template'] || defaultSettings.zplTemplate;
  document.getElementById('preview-api-url').value = result['preview-api-url'] || defaultSettings.previewApiUrl;
  document.getElementById('replace-list').value = result['replace-list'] || defaultSettings.replaceList;
  document.getElementById('printer-url').value = result['printer-url'] || defaultSettings.printerUrl;
}

// Save settings
async function saveSettings() {
  const settings = {
    'idoit-base-url': document.getElementById('idoit-base-url').value,
    'zpl-template': document.getElementById('zpl-template').value,
    'preview-api-url': document.getElementById('preview-api-url').value,
    'replace-list': document.getElementById('replace-list').value,
    'printer-url': document.getElementById('printer-url').value
  };
  
  try {
    await browserAPI.storage.local.set(settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Reset to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to their default values?')) {
    document.getElementById('idoit-base-url').value = defaultSettings.idoitUrl;
    document.getElementById('zpl-template').value = defaultSettings.zplTemplate;
    document.getElementById('preview-api-url').value = defaultSettings.previewApiUrl;
    document.getElementById('replace-list').value = defaultSettings.replaceList;
    document.getElementById('printer-url').value = defaultSettings.printerUrl;
    
    showStatus('Settings reset to defaults. Don\'t forget to save!', 'info');
  }
}

// Reset template only
function resetTemplate() {
  if (confirm('Reset ZPL template to default?')) {
    document.getElementById('zpl-template').value = defaultSettings.zplTemplate;
    showStatus('Template reset to default. Don\'t forget to save!', 'info');
  }
}

// Show status message
function showStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'status';
  }, 5000);
}

// Test functions
async function testConnection() {
  const url = document.getElementById('idoit-base-url').value;
  const resultsElement = document.getElementById('test-results');
  
  resultsElement.textContent = 'Testing I-Doit connection...';
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      resultsElement.textContent = `✅ Connection successful (Status: ${response.status})`;
    } else {
      resultsElement.textContent = `❌ Connection failed (Status: ${response.status})`;
    }
  } catch (error) {
    resultsElement.textContent = `❌ Connection failed: ${error.message}`;
  }
}

// Simple printer test
async function testPrinter() {
  const url = document.getElementById('printer-url').value;
  const resultsElement = document.getElementById('test-results');
  
  if (!url) {
    resultsElement.textContent = '❌ Please enter a printer URL first';
    return;
  }
  
  resultsElement.textContent = 'Testing printer connection...';
  const testZpl = '^XA^FO20,20^A0N,25,25^FDTest Label^FS^XZ';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: testZpl,
      headers: {
        'Content-Type': 'application/x-zpl'
      }
    });
    
    if (response.ok) {
      resultsElement.textContent = `✅ Printer test successful (Status: ${response.status})`;
    } else {
      resultsElement.textContent = `❌ Printer test failed (Status: ${response.status})`;
    }
  } catch (error) {
    resultsElement.textContent = `❌ Printer test failed: ${error.message}`;
  }
}

async function testPreview() {
  const url = document.getElementById('preview-api-url').value;
  const resultsElement = document.getElementById('test-results');
  
  resultsElement.textContent = 'Testing preview API...';
  
  try {
    const testZpl = '^XA^FO20,20^A0N,25,25^FDTest Preview^FS^XZ';
    const previewUrl = `${url}${encodeURIComponent(testZpl)}`;
    
    const response = await fetch(previewUrl, { method: 'HEAD' });
    if (response.ok) {
      resultsElement.textContent = `✅ Preview API test successful (Status: ${response.status})`;
    } else {
      resultsElement.textContent = `❌ Preview API test failed (Status: ${response.status})`;
    }
  } catch (error) {
    resultsElement.textContent = `❌ Preview API test failed: ${error.message}`;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  // Event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
  document.getElementById('reset-template').addEventListener('click', resetTemplate);
  document.getElementById('test-connection').addEventListener('click', testConnection);
  document.getElementById('test-printer').addEventListener('click', testPrinter);
  document.getElementById('test-preview').addEventListener('click', testPreview);
});