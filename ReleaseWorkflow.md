# Release Workflow

This workflow describes how to publish new versions of the Fast Label Printing Extension.

## 🚀 Step-by-Step Guide

### A) Develop New Version

```bash
# 1. Work in main branch
git checkout main
git pull origin main

# 2. Make code changes
# ... develop, test, debug ...

# 3. Increase version in BOTH manifests
# Edit src/manifest.json (Chrome) - Line: "version": "1.2"
# Edit src/manifest-firefox.json (Firefox) - Line: "version": "1.2"
# IMPORTANT: Both versions must be identical!

# 4. Commit and push changes
git add src/manifest*.json
git add . # for other changes
git commit -m "Release v1.2: [Description of changes]"
git push origin main
```

**✅ Result:** Automatic pre-release is created with both extension files.

### B) Mozilla Signing (Firefox only)

```bash
# 1. Download Firefox .xpi from pre-release
# Go to: https://github.com/jszeibert/fast-label-printering/releases
# Download: fast-label-printering-firefox-v1.2.xpi

# 2. Mozilla Add-ons Developer Hub
# - Go to: https://addons.mozilla.org/developers/
# - Upload the .xpi file
# - Wait for automatic signing
# - Download the signed .xpi

# 3. Rename signed version (optional)
# mv downloaded-file.xpi fast-label-printering-firefox-v1.2-signed.xpi
```

### C) Create Manual Release

```bash
# 1. Create new release on GitHub
# Go to: https://github.com/jszeibert/fast-label-printering/releases/new

# Release Information:
# - Tag: v1.2
# - Title: Release v1.2
# - Description: [Changelog and features]
# - Upload files:
#   * fast-label-printering-firefox-v1.2.xpi (signed version)
#   * fast-label-printering-chrome-v1.2.zip (from pre-release)

# 2. Delete pre-release (optional)
# The pre-release can be deleted after the final release
```

### D) Update GitHub Pages

```bash
# 1. Switch to gh-pages branch
git checkout gh-pages
git pull origin gh-pages

# 2. Update Firefox update manifest
nano update.json
# Change:
# - "version": "1.2"
# - "update_link": "https://github.com/jszeibert/fast-label-printering/releases/download/v1.2/fast-label-printering-firefox-v1.2.xpi"

# 3. Update website (optional)
nano index.html
# Change version number in:
# - <div class="version">Current Version: v1.2</div>
# - Download links if necessary

# 4. Commit and push changes
git add .
git commit -m "Update to version 1.2"
git push origin gh-pages

# 5. Return to main branch
git checkout main
```

**✅ Result:** Firefox users receive automatic updates, website shows new version.

## 📋 Release Checklist

### Before Release:
- [ ] Code works in both browsers
- [ ] Versions in both manifests are identical
- [ ] All tests performed
- [ ] Changelog prepared

### Release Process:
- [ ] Version increased in manifests
- [ ] Tagged and pushed → Pre-release created
- [ ] Firefox .xpi signed by Mozilla
- [ ] Manual release created with both files
- [ ] Pre-release deleted (optional)
- [ ] GitHub Pages updated (update.json)
- [ ] Website version updated (optional)

### After Release:
- [ ] Firefox automatic updates work
- [ ] Download links on website work
- [ ] Both browser versions tested

## 🔧 Useful Commands

```bash
# Show current version
grep -r "version" src/manifest*.json

# Show all branches
git branch -a

# Switch between branches
git checkout main
git checkout gh-pages

# View pre-releases
# Go to: https://github.com/jszeibert/fast-label-printering/releases

# GitHub Pages status
# Go to: https://jszeibert.github.io/fast-label-printering/
```

## ⚠️ Avoid Common Mistakes

1. **Different versions:** Both manifests must have identical version numbers
2. **Forgotten Pages:** Update update.json after each release
3. **Wrong branch:** Always check which branch you're in
4. **Forgotten pre-release:** Delete pre-release after final release

## 📞 Support

For problems:
- GitHub Issues: https://github.com/jszeibert/fast-label-printering/issues
- Mozilla Developer Support: https://developer.mozilla.org/docs/Mozilla/Add-ons