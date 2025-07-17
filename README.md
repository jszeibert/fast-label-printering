# Fast Label Printing Extention

**Fast Label Printing Extention** is a Firefox browser extension that allows printing 25x14mm Inventory labels from IDoit using ZPL on Zebra printers.
This is a generalized version that must be configured in the settings tab of the extention to work porperly.

## Installation

1. Clone the repository or download the ZIP file and extract it.
2. Open your browser and go to `about:debugging`.
3. Click on "Load Temporary Add-On" and select the extension manifest.

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
- Access to all URLs "http://*/*", "https://*/*" for requests to the printer api and the preview api
- Access to the localStorage to store the settings