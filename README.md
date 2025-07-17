# Fast Label Printing Extension

**Fast Label Printing Extension** is a Firefox browser extension that allows printing 25x14mm Inventory labels from IDoit using ZPL on Zebra printers.
This is a generalized version that must be configured in the settings tab of the extension to work properly.

## 📥 Download

The latest version of the extension is available at:
**[GitHub Pages - Fast Label Printering](https://jszeibert.github.io/fast-label-printering/)**

## Installation

### Option 1: Via GitHub Pages (Recommended)
1. Visit [https://jszeibert.github.io/fast-label-printering/](https://jszeibert.github.io/fast-label-printering/)
2. Download the `.xpi` file
3. Open Firefox and go to `about:addons`
4. Click the gear icon and select "Install Add-on From File..."
5. Select the downloaded `.xpi` file

### Option 2: Development Version
1. Clone the repository: `git clone https://github.com/jszeibert/fast-label-printering.git`
2. Open Firefox and go to `about:debugging`
3. Click on "Load Temporary Add-On" and select `src/manifest.json`

## 🔄 Automatic Updates

The extension is configured for automatic updates via GitHub Pages. Firefox will automatically check for and install updates when they become available.

## 🚀 Development & Build

### Local Development
For local development, you can load the extension directly from the `src/` folder:

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `src/` folder and select `manifest.json`

### Release Process

**Simple Version-Based Releases:**

1. **Update version in `src/manifest.json`:**
   ```json
   {
     "version": "1.1"
   }
   ```

2. **Commit and push to main:**
   ```bash
   git add src/manifest.json
   git commit -m "Release v1.1: Add new features"
   git push origin main
   ```

3. **Automatic Release Process:**
   - ✅ GitHub Actions detects the new version
   - ✅ Builds and packages the extension from `src/` folder
   - ✅ Creates a GitHub Release with the `.xpi` file
   - ✅ Updates `update.json` with all available versions
   - ✅ Deploys to GitHub Pages

### Project Structure

```
├── src/                    # Extension source files
│   ├── manifest.json      # Extension manifest
│   ├── sidebar/           # Sidebar components
│   └── icons/             # Extension icons
├── .github/workflows/     # GitHub Actions
├── .gitignore            # Git ignore rules
└── README.md             # Documentation
```

**Key Benefits:**
- 🎯 **Version-driven**: Only the manifest.json version matters
- 🚀 **Zero-config releases**: Just update version and push
- 🧹 **Clean builds**: Only necessary files from `src/` are packaged
- 🔄 **Smart updates**: Comprehensive update.json with version history
- 📦 **No dependencies**: No npm or build tools required

## Usage

1. Open IDoit and navigate to an object.
2. Click on the extension icon to open the sidebar.
3. The extension will automatically populate the fields with the object information.
4. Click on "Show Preview" to display a preview of the label.
5. Click on "Print" to print the label.

## Settings

The following settings need to be configured in the extension:

- **I-Doit URL**: The base URL of your IDoit instance without trailing `/`. e.g. `https://idoit.example.com`
- **Zebra Printer URL**: The URL of the Zebra printer's print API. e.g.: `http://localhost:631/pstprnt`

The following settings are prefilled and can be adjusted to your liking:

- **I-Doit ZPL Label Template**: The ZPL template for the label, including placeholders for the data input fields.
    - Placeholders are: `{ID}, {Line1}, {Line2}, {TYPE}`
- **Preview API URL**: The URL of the API used to generate label previews.
- **Replace List**: A JSON list of strings that should be replaced in the label data.

## Permissions

This extension requires the following permissions:
- Access to tabs and active tabs
- Access to all URLs "http://*/*", "https://*/*" for requests to the printer API and the preview API
- Access to the storage to store the settings