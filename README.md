# Fast Label Printering

Browser extension for printing inventory labels from I-Doit using ZPL on Zebra printers.

## 📥 Download

### Firefox
- **Stable:** [Download from GitHub Pages](https://jszeibert.github.io/fast-label-printering/)
- **Latest:** [Download from GitHub Releases](https://github.com/jszeibert/fast-label-printering/releases/latest)

### Chrome/Edge
- **Latest:** [Download ZIP from GitHub Releases](https://github.com/jszeibert/fast-label-printering/releases/latest)

## 🚀 Installation

### Firefox
1. Download the `.xpi` file
2. Open Firefox → `about:addons`
3. Click gear icon → "Install Add-on From File..."
4. Select the downloaded `.xpi` file

### Chrome/Edge
1. Download and extract the `.zip` file
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select extracted folder

## ✨ Features

- **Auto-extract** object data from I-Doit pages
- **Live preview** of labels before printing
- **Direct printing** to Zebra printers via HTTP
- **Customizable** ZPL templates and text replacements
- **Cross-browser** compatible (Firefox & Chrome)

## 🔧 Configuration

Configure in the extension options page:

### Required Settings
- **I-Doit URL**: Your I-Doit instance URL (e.g., `https://idoit.example.com`)
- **Zebra Printer URL**: Printer API endpoint (e.g., `http://localhost:631/pstprnt`)

### Optional Settings
- **ZPL Template**: Customize label layout with placeholders `{ID}`, `{Line1}`, `{Line2}`, `{TYPE}`
- **Preview API**: Label preview service URL
- **Text Replacements**: JSON list for text substitutions

## 📖 Usage

1. Navigate to an I-Doit object page
2. Click the extension icon in the toolbar
3. Extension auto-populates fields from the page
4. Click "Show Preview" to see label preview
5. Click "Print" to send to Zebra printer

## 🔄 Updates

- **Firefox**: Automatic updates via GitHub Pages
- **Chrome**: Manual updates from GitHub Releases

## 🛠️ Development

### Local Development
```bash
git clone https://github.com/jszeibert/fast-label-printering.git
```

**Firefox:**
1. Open `about:debugging`
2. "Load Temporary Add-on" → select `src/manifest.json`

**Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. "Load unpacked" → select `src/` folder

### Release Process
1. Update version in `src/manifest.json`
2. Commit and push to main branch
3. GitHub Actions automatically builds and releases

## 📁 Project Structure

```
├── src/
│   ├── manifest.json       # Extension manifest (Firefox + Chrome compatible)
│   ├── popup/             # Extension popup UI
│   ├── options/           # Settings page
│   └── icons/             # Extension icons
└── .github/workflows/     # Automated builds
```

## 🔑 Permissions

- **Storage**: Save extension settings
- **Active Tab**: Access current I-Doit page
- **Host Permissions**: Communicate with printer and preview APIs

## 📄 License

MIT