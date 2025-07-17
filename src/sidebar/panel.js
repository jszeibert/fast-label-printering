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

  // @previewApiUrl: fixed Label size of 25x14mm
  // -1mm in width as pos 0 is offset by that
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

function validateJSON(input) {
  try {
    JSON.parse(input);
    return true;
  } catch (e) {
    return false;
  }
}

function loadSettings() {
  settings.idoitUrl = localStorage.getItem('idoit-base-url') || settings.idoitUrl;
  settings.zplTemplate = localStorage.getItem('zpl-template') || settings.zplTemplate;
  settings.printerUrl = localStorage.getItem('printer-url') || settings.printerUrl;
  settings.previewApiUrl = localStorage.getItem('preview-api-url') || settings.previewApiUrl;
  settings.replaceList = localStorage.getItem('replace-list') || settings.replaceList;

  document.getElementById('idoit-base-url').value = settings.idoitUrl;
  document.getElementById('zpl-template').value = settings.zplTemplate;
  document.getElementById('printer-url').value = settings.printerUrl;
  document.getElementById('preview-api-url').value = settings.previewApiUrl;
  document.getElementById('replace-list').value = settings.replaceList;
}

function saveSettings() {
  settings.idoitUrl = document.getElementById('idoit-base-url').value;
  settings.zplTemplate = document.getElementById('zpl-template').value;
  settings.printerUrl = document.getElementById('printer-url').value;
  settings.previewApiUrl = document.getElementById('preview-api-url').value;
  settings.replaceList = document.getElementById('replace-list').value;

  localStorage.setItem('idoit-base-url', settings.idoitUrl);
  localStorage.setItem('zpl-template', settings.zplTemplate);
  localStorage.setItem('printer-url', settings.printerUrl);
  localStorage.setItem('preview-api-url', settings.previewApiUrl);
  localStorage.setItem('replace-list', settings.replaceList);
  log('Settings saved');
}

function parseReplaceList(input) {
  return input.split(',').map(pair => pair.split('='));
}

loadSettings();
const saveSettingsButton = document.getElementById('save-settings-button');
saveSettingsButton.addEventListener('click', function () {
  saveSettings();
});

// --------------------------- General UI elements ---------------------------
// Toggle visibility of sections
document.querySelectorAll('.tab-button').forEach(tabBtn => {
  tabBtn.addEventListener('click', function () {
    document.querySelectorAll('.tab-content').forEach(tabContent => {
      tabContent.style.display = 'none';
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(tabBtn.getAttribute('data-tab')).style.display = 'block';
    tabBtn.classList.add('active');
  });
});

// --------------------------- retreive I-Doit Data ---------------------------

let myWindowId;
let title, url;
let objData = [];

/*
Update the sidebar's content with the title and URL of the active tab if its an I-Doit object.

1) Get the active tab in this sidebar's window.
2) Get its title and URL.
3) Put them in the content box.
*/
function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
      const activeTab = tabs[0];
      title = activeTab.title;
      url = activeTab.url;

      if (url.startsWith(settings.idoitUrl) && url.includes('objID')) {
        const urlObj = new URL(url);
        const urlParams = new URLSearchParams(urlObj.search);
        objData['id'] = urlParams.get('objID');

        // retreive the object Name and type from the title
        let titleSplit = title.split(' > ');
        objData['type'] = titleSplit[1];
        objData['name'] = titleSplit[2];
        log(`Loaded I-Doit Obejct from aktive Tab<br\><b>ID:</b> ${objData['id']}<br\><b>Name:</b> ${objData['name']}<br\><b>Type:</b> ${objData['type']}`);

        // Prefill the input fields
        prefillInputFields(objData);
      } else {
        log(`No I-DOIT Data found.`);
      }
    });
}

/*
Split the name into two lines in a semi intelligent way.
The split can be done on ' ', '-', '_' and '.' characters.
The characters should be kept.
The first line should be shorter than 11 characters.
The normal label size is 25x14mm, so the first line should be shorter than 11 characters.
*/
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
  log("Name to long, splitting into: <br\>" + [line1, line2]);
  return [line1, line2];
}


/*
Prefill the input fields with the retrieved data.
*/
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
  document.getElementById('zpl-input').value = '';
}

/*
Update content when a new tab becomes active.
*/
browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
// --------------------------- Label preview ---------------------------

function showPreview(zplData) {
  zplInput.value = zplData;
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
    .replace('{TYPE}', type)
    .replace('{ID}', id);
}

async function printLabel(zplData) {
  try {
    const response = await fetch(settings.printerUrl, {
      method: 'POST',
      body: zplData
    });
    const result = await response.text();
    log('Print successful:', result);
  } catch (error) {
    log('Print failed:', error);
  }
}

// --------------------------- Label data ---------------------------
const inputFields = [
  document.getElementById('id'),
  document.getElementById('line1'),
  document.getElementById('line2'),
  document.getElementById('type')
];
const previewInputButton = document.getElementById('preview-input-button');
const printInputButton = document.getElementById('print-input-button');

previewInputButton.addEventListener('click', function () {
    const zplData = generateZPL(inputFields);
    document.getElementById('zpl-input-textarea').value = zplData;
    showPreview(zplData);
  }
);

printInputButton.addEventListener('click', function () {
    const zplData = generateZPL(inputFields);
    printLabel(zplData);
  }
);
  
// --------------------------- ZPL data ---------------------------
  
const zplInput = document.getElementById('zpl-input-textarea');
const previewZplButton = document.getElementById('preview-zpl-button');
const printZplButton = document.getElementById('print-zpl-button');
previewZplButton.addEventListener('click', function () {
    showPreview(zplInput.value);
  }
);

printZplButton.addEventListener('click', function () {
    printLabel(zplInput.value);
  }
);
