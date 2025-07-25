# Fast Label Printing

**Fast Label Printing** is a cross-browser extension (Firefox & Chrome) that allows printing 25x14mm Inventory labels from IDoit using ZPL on Zebra printers.
This is a generalized version that must be configured in the settings tab of the extension to work properly.

## 📥 Download

The latest version of the extension is available at:
**[GitHub Pages - Fast Label Printering](https://jszeibert.github.io/fast-label-printering/)**

## Installation

### Option 1: Via GitHub Pages (Recommended)
1. Visit [https://jszeibert.github.io/fast-label-printering/](https://jszeibert.github.io/fast-label-printering/)
2. Choose your browser version:
   - **Firefox**: Download the `.xpi` file
   - **Chrome**: Download the `.zip` file
3. Install according to your browser:

**Firefox:**
- Open Firefox and go to `about:addons`
- Click the gear icon and select "Install Add-on From File..."
- Select the downloaded `.xpi` file

**Chrome:**
- Extract the downloaded `.zip` file
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" and select the extracted folder

### Option 2: Development Version
1. Clone the repository: `git clone https://github.com/jszeibert/fast-label-printering.git`
2. Load in your browser:

**Firefox:**
- Copy Firefox manifest: `cp src/manifest-firefox.json src/manifest.json`
- Go to `about:debugging` → "This Firefox" → "Load Temporary Add-on"
- Select `src/manifest.json`

**Chrome:**
- Go to `chrome://extensions/` → Enable "Developer mode"
- Click "Load unpacked" and select the `src/` folder
- (Default `manifest.json` is Chrome-compatible)

## 🌐 Browser Support

### Firefox
- ✅ **Sidebar integration** for enhanced workflow
- ✅ **Automatic updates** via GitHub Pages
- ✅ **Tab management** with window context
- ✅ **Mozilla signing** support

### Chrome
- ✅ **Popup interface** on toolbar icon click
- ✅ **Side panel support** (Chrome 114+)
- ✅ **Manual updates** (download new versions)
- ✅ **Extension manifest V3** compatibility

## 🔄 Automatic Updates

**Firefox:** The extension is configured for automatic updates via GitHub Pages. Firefox will automatically check for and install updates when they become available.

**Chrome:** Manual updates required. Download new versions from GitHub Pages when available.

## 🚀 Development & Build

### Local Development
For local development, you can load the extension directly from the `src/` folder:

**Firefox:**
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Create Firefox build or copy Firefox manifest:
   ```bash
   cp src/manifest-firefox.json src/manifest.json
   ```
5. Select `src/manifest.json`

**Chrome:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src/` folder (default manifest.json is Chrome-compatible)

### Project Structure

```
├── src/                         # Extension source files
│   ├── manifest.json           # Chrome manifest (default)
│   ├── manifest-firefox.json   # Firefox-specific manifest
│   ├── sidebar/                # UI components
│   │   ├── panel.html         # Main interface
│   │   ├── panel.js           # Cross-browser JavaScript
│   │   └── panel.css          # Styling
│   └── icons/                 # Extension icons
├── pages/                      # GitHub Pages content
│   ├── index.html             # Landing page
│   └── update.json            # Firefox update manifest
├── .github/workflows/          # GitHub Actions
│   ├── build-extensions.yml   # Build both versions
│   └── deploy-pages.yml       # Deploy GitHub Pages
├── .gitignore                 # Git ignore rules
└── README.md                  # Documentation
```

## Usage

### Firefox (Sidebar)
1. Open IDoit and navigate to an object
2. The sidebar automatically opens or click the extension icon
3. Extension automatically populates fields with object information
4. Click "Show Preview" to display a label preview
5. Click "Print" to print the label

### Chrome (Popup)
1. Open IDoit and navigate to an object
2. Click the extension icon in the toolbar
3. Extension automatically populates fields with object information
4. Click "Show Preview" to display a label preview
5. Click "Print" to print the label

## Settings

The following settings need to be configured in the extension:

- **I-Doit URL**: The base URL of your IDoit instance without trailing `/`. e.g. `https://idoit.example.com`
- **Zebra Printer URL**: The URL of the Zebra printer's print API. e.g.: `http://localhost:631/pstprnt`

The following settings are prefilled and can be adjusted to your liking:

- **I-Doit ZPL Label Template**: The ZPL template for the label, including placeholders for the data input fields.
    - Placeholders are: `{ID}, {LINE1}, {LINE2}, {TYPE}`
- **Preview API URL**: The URL of the API used to generate label previews.
- **Replace List**: A comma-separated list of replacements in format `Original=Replacement,Another=Replace`

## Permissions

This extension requires the following permissions:

### Firefox
- Access to tabs and active tabs
- Access to all URLs `"http://*/*", "https://*/*"` for printer and preview API requests
- Access to storage to store settings
- Sidebar access for enhanced UI

### Chrome
- Access to tabs and active tabs
- Access to all URLs `"http://*/*", "https://*/*"` for printer and preview API requests
- Access to storage to store settings
- Side panel permission (Chrome 114+)

## 🔧 Technical Details

- **Manifest Version**: 3 (both browsers)
- **Cross-browser compatibility**: Automatic API detection
- **Storage**: Extension storage API with localStorage fallback
- **UI Context**: Sidebar (Firefox) / Popup (Chrome)
- **Update mechanism**: Automatic (Firefox) / Manual (Chrome)

## 🐛 Troubleshooting

### Firefox
- If sidebar doesn't appear, click the extension icon
- Check `about:addons` for extension status
- Updates should install automatically

### Chrome
- If extension doesn't load, check `chrome://extensions/`
- Ensure "Developer mode" is enabled for unpacked extensions
- Updates require manual download and installation

## 📝 License

MIT License - see LICENSE file for details.