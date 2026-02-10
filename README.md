# 🔍 JobSieve - LinkedIn Job Filter Extension

A powerful browser extension that helps you filter and customize your LinkedIn job search experience with intelligent blacklists, whitelists, and smart filtering options.

## ✨ Features

### 🚫 **Company Blacklist**
- Block job listings from specific companies by name
- Add multiple companies to your blacklist
- Case-insensitive matching

### 📍 **Location Exclusion**
- Hide roles located in specified cities, regions, or countries
- Flexible location matching (e.g., "Remote", "New York", "California")
- Support for multiple location filters

### 🔤 **Keyword Blocklist**
- Exclude postings containing unwanted terms
- Filter out roles like "Senior", "Contract", "Remote", etc.
- Smart text matching across job titles and keywords

### ⭐ **Keyword Whitelist**
- Highlight jobs that include required skills or perks
- Surface listings with technologies like "React", "Python", "Remote"
- Visual highlighting with LinkedIn-blue accents


## 🛡️ **Built-in Mitigations**

### 1. **Abstracted Selectors**
- All LinkedIn selectors are centralized in a single configuration object
- Easy to update when LinkedIn changes their structure
- Multiple fallback selectors for robustness

### 2. **Fallback Logic**
- Primary selectors with multiple fallback options
- Graceful degradation when selectors fail
- Automatic detection of aria-labels and text patterns

### 3. **Health Monitoring**
- Real-time monitoring of filter effectiveness
- Logs "no cards found" situations to background script
- Visual status indicators in the popup

## 🚀 Installation

### Development Installation

1. **Clone or Download**
   ```bash
   git clone https://github.com/MuhammadAli511/JobSieve.git
   cd JobSieve
   ```

2. **Load in Chrome/Edge**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the JobSieve folder

3. **Load in Firefox**
   - Open `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file

### Chrome Web Store
Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/jobsieve-linkedin-job-fil/anoideekpmpbjcmlkpmhlhbbnnkklfkm).

## 🎯 Usage

1. **Navigate to LinkedIn Jobs**
   - Go to `linkedin.com/jobs`
   - Search for jobs as usual

2. **Configure Filters**
   - Click the JobSieve extension icon
   - Enable/disable filters as needed
   - Add companies, locations, keywords to blacklists

3. **View Results**
   - Unwanted jobs will be automatically hidden
   - Highlighted jobs will have a blue outline and badge
   - Check the health status in the popup

## ⚙️ Configuration Options

### Filter Toggles
Each filter can be individually enabled/disabled:
- ✅ Company Blacklist
- ✅ Location Exclusion  
- ✅ Keyword Blocklist
- ✅ Keyword Whitelist

### Smart Settings
- **Auto-save**: Settings are automatically saved as you type
- **Real-time updates**: Filters apply immediately
- **Cross-tab sync**: Settings sync across LinkedIn tabs

## 🔧 Technical Details

### Architecture
- **Manifest V3** compatible
- **Service Worker** background script
- **Content Script** injection for LinkedIn
- **Chrome Storage API** for settings persistence

### Selector Strategy
```javascript
{
  jobCards: {
    primary: '[data-job-id]',
    fallbacks: [
      '.job-card-container',
      '.jobs-search-results__list-item',
      '[data-occludable-job-id]',
      '.job-card'
    ]
  }
  // ... more selectors
}
```

### Health Monitoring
- Tracks job cards found per scan
- Monitors selector effectiveness
- Reports status to background script
- Visual indicators in popup interface

## 🐛 Troubleshooting

### Extension Not Working?
1. **Check LinkedIn URL**: Make sure you're on `linkedin.com/jobs/*`
2. **Refresh the page**: Try reloading the LinkedIn page
3. **Check health status**: Look at the status indicator in the popup
4. **Console logs**: Open DevTools and check for JobSieve messages

### No Jobs Found?
- LinkedIn may have updated their structure
- Check the health status indicator
- Selector fallbacks should handle most changes automatically

### Filters Not Applying?
1. **Verify settings**: Ensure filters are enabled in the popup
2. **Check spelling**: Blacklist items are case-insensitive but must be spelled correctly
3. **Clear and re-add**: Try removing and re-adding filter items

## 🔒 Privacy & Permissions

### Required Permissions
- **`storage`**: Save your filter preferences
- **`activeTab`**: Access LinkedIn job pages only
- **`*://*.linkedin.com/*`**: Function on LinkedIn domains only

### Data Handling
- ✅ All data stored locally on your device
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ Open source and auditable

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Bug reports
- Feature requests  
- Code contributions
- Selector updates
- Documentation improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [Report bugs via GitHub Issues](https://github.com/MuhammadAli511/JobSieve/issues)
- **Feature Requests**: [Use GitHub Issues](https://github.com/MuhammadAli511/JobSieve/issues/new?template=feature_request.md)
- **Documentation**: Check this README and inline comments

---

**Made with ❤️ for job seekers who want a better LinkedIn experience**