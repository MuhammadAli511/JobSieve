# JobSieve Chrome Extension Deployment Guide

## 🚀 Deployment Options

### Option 1: Chrome Web Store (Public Release)

**Prerequisites:**
- Google Developer Account ($5 one-time fee)
- Extension package (.zip file)
- Store listing materials (screenshots, descriptions, etc.)

**Steps:**
1. **Create Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Pay $5 registration fee
   - Verify your identity

2. **Prepare Extension Package**
   ```bash
   # Create deployment package
   zip -r jobsieve-extension.zip . -x "*.DS_Store" "*.git*" "DEVELOPMENT_TESTING.md" "TESTING.md" "debug-extension.js" "test-selectors.js"
   ```

3. **Create Store Listing**
   - Upload your .zip file
   - Add detailed description
   - Upload screenshots (1280x800 or 640x400)
   - Set category: "Productivity"
   - Add privacy policy (required)

4. **Review Process**
   - Initial review: 1-3 days
   - Updates: Usually within 24 hours
   - May require changes based on Google's review

### Option 2: Developer Mode (Personal/Testing Use)

**Steps:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select your JobSieve folder
5. Extension is now installed locally

**Pros:**
- ✅ Instant deployment
- ✅ No review process
- ✅ Perfect for testing

**Cons:**
- ❌ Only works on your computer
- ❌ Shows "Developer mode" warning
- ❌ Can't share easily with others

### Option 3: Package for Private Distribution

**Steps:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Pack extension"
4. Select your extension folder
5. Generate .crx file and private key

**Use Cases:**
- Internal company distribution
- Beta testing with specific users
- Educational purposes

## 📋 Pre-Deployment Checklist

### Required Files Verification
- ✅ `manifest.json` - Extension configuration
- ✅ `popup.html` - Extension popup interface
- ✅ `popup.css` - Popup styling
- ✅ `popup.js` - Popup functionality
- ✅ `content.js` - LinkedIn page interaction
- ✅ `background.js` - Background service worker
- ✅ `icons/` folder with all icon sizes
- ✅ `styles.css` - Content styles (optional, now injected)

### Testing Checklist
- ✅ Test on LinkedIn job search pages
- ✅ Verify all filters work correctly
- ✅ Test popup functionality
- ✅ Check console for errors
- ✅ Test reset functionality
- ✅ Verify extension persistence

### Store Listing Requirements
- **Name:** JobSieve - LinkedIn Job Filter
- **Description:** Filter and customize LinkedIn job searches with powerful filtering
- **Category:** Productivity
- **Screenshots:** At least 1, maximum 5
- **Privacy Policy:** Required (create simple one)
- **Permissions Justification:** Explain storage and activeTab usage

## 🔧 Build Script (Recommended)

Create a build script to prepare your extension:

```bash
#!/bin/bash
# build.sh

echo "Building JobSieve Extension..."

# Create build directory
mkdir -p build

# Copy essential files
cp manifest.json build/
cp popup.html build/
cp popup.css build/
cp popup.js build/
cp content.js build/
cp background.js build/
cp styles.css build/
cp -r icons build/

# Create zip for upload
cd build
zip -r ../jobsieve-v1.0.0.zip .
cd ..

echo "✅ Extension built successfully!"
echo "📦 Upload jobsieve-v1.0.0.zip to Chrome Web Store"
```

## 📱 Privacy Policy Template

```markdown
# JobSieve Privacy Policy

## Data Collection
JobSieve does not collect, store, or transmit any personal data.

## Local Storage
- Filter preferences are stored locally in your browser
- No data is sent to external servers
- Data never leaves your device

## Permissions
- **Storage:** Save your filter preferences locally
- **ActiveTab:** Access LinkedIn job pages to apply filters

## Contact
For questions: [your-email@domain.com]

Last updated: [DATE]
```

## 🚀 Quick Deployment (Developer Mode)

For immediate use:
1. Download/clone your extension files
2. Open `chrome://extensions/`
3. Toggle "Developer mode" ON
4. Click "Load unpacked"
5. Select the JobSieve folder
6. Start using on LinkedIn!

## 📈 Post-Deployment

### Monitor Performance
- Check Chrome Web Store reviews
- Monitor user feedback
- Track installation/usage stats
- Update based on LinkedIn changes

### Maintenance
- LinkedIn frequently updates their selectors
- Monitor console for selector warnings
- Update fallback selectors as needed
- Release updates for compatibility

---

**Need Help?** Check the troubleshooting section in README.md or create an issue. 