// JobSieve Popup Script
class PopupManager {
    constructor() {
        this.settings = {};
        this.elements = {};
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeElements() {
        // Toggle switches
        this.elements.companyBlacklistEnabled = document.getElementById('companyBlacklistEnabled');
        this.elements.locationBlacklistEnabled = document.getElementById('locationBlacklistEnabled');
        this.elements.keywordBlacklistEnabled = document.getElementById('keywordBlacklistEnabled');
        this.elements.keywordWhitelistEnabled = document.getElementById('keywordWhitelistEnabled');

        // Input fields
        this.elements.companyInput = document.getElementById('companyInput');
        this.elements.locationInput = document.getElementById('locationInput');
        this.elements.keywordBlacklistInput = document.getElementById('keywordBlacklistInput');
        this.elements.keywordWhitelistInput = document.getElementById('keywordWhitelistInput');

        // Buttons
        this.elements.addCompany = document.getElementById('addCompany');
        this.elements.addLocation = document.getElementById('addLocation');
        this.elements.addKeywordBlacklist = document.getElementById('addKeywordBlacklist');
        this.elements.addKeywordWhitelist = document.getElementById('addKeywordWhitelist');
        this.elements.resetSettings = document.getElementById('resetSettings');

        // Tag containers
        this.elements.companyTags = document.getElementById('companyTags');
        this.elements.locationTags = document.getElementById('locationTags');
        this.elements.keywordBlacklistTags = document.getElementById('keywordBlacklistTags');
        this.elements.keywordWhitelistTags = document.getElementById('keywordWhitelistTags');

        // Status elements
        this.elements.statusIndicator = document.getElementById('statusIndicator');
        this.elements.statusText = document.getElementById('statusText');
    }

    setupEventListeners() {
        // Toggle switches - auto-save when changed
        this.elements.companyBlacklistEnabled.addEventListener('change', () => {
            this.toggleSection('companyBlacklist', this.elements.companyBlacklistEnabled.checked);
            this.saveSettings(false);
        });

        this.elements.locationBlacklistEnabled.addEventListener('change', () => {
            this.toggleSection('locationBlacklist', this.elements.locationBlacklistEnabled.checked);
            this.saveSettings(false);
        });

        this.elements.keywordBlacklistEnabled.addEventListener('change', () => {
            this.toggleSection('keywordBlacklist', this.elements.keywordBlacklistEnabled.checked);
            this.saveSettings(false);
        });

        this.elements.keywordWhitelistEnabled.addEventListener('change', () => {
            this.toggleSection('keywordWhitelist', this.elements.keywordWhitelistEnabled.checked);
            this.saveSettings(false);
        });

        // Add buttons
        this.elements.addCompany.addEventListener('click', () => {
            this.addTag('companyBlacklist', this.elements.companyInput.value.trim());
            this.elements.companyInput.value = '';
        });

        this.elements.addLocation.addEventListener('click', () => {
            this.addTag('locationBlacklist', this.elements.locationInput.value.trim());
            this.elements.locationInput.value = '';
        });

        this.elements.addKeywordBlacklist.addEventListener('click', () => {
            this.addTag('keywordBlacklist', this.elements.keywordBlacklistInput.value.trim());
            this.elements.keywordBlacklistInput.value = '';
        });

        this.elements.addKeywordWhitelist.addEventListener('click', () => {
            this.addTag('keywordWhitelist', this.elements.keywordWhitelistInput.value.trim());
            this.elements.keywordWhitelistInput.value = '';
        });

        // Enter key handlers for inputs
        this.elements.companyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.addCompany.click();
        });

        this.elements.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.addLocation.click();
        });

        this.elements.keywordBlacklistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.addKeywordBlacklist.click();
        });

        this.elements.keywordWhitelistInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.elements.addKeywordWhitelist.click();
        });

        // Action buttons
        this.elements.resetSettings.addEventListener('click', () => {
            this.resetSettings();
        });
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
            if (response.success) {
                this.settings = response.data;
                this.populateUI();

                // Load real-time health status after UI is populated
                await this.loadRealTimeHealthStatus();
            } else {
                console.error('Failed to load settings:', response.error);
                this.showNotification('Failed to load settings', 'error');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Extension communication error', 'error');
        }
    }

    async loadRealTimeHealthStatus() {
        try {
            // Try to get real-time health status from content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.url) {
                return;
            }

            if (tab.url.includes('linkedin.com/jobs/search')) {
                try {
                    // Request current health status from content script
                    const healthResponse = await chrome.tabs.sendMessage(tab.id, {
                        type: 'GET_HEALTH_STATUS'
                    });

                    if (healthResponse && healthResponse.success && healthResponse.healthStatus) {
                        this.updateHealthDisplay(healthResponse.healthStatus);
                    } else {
                        // Fallback to stored health status
                        this.loadStoredHealthStatus();
                    }
                } catch (messageError) {
                    // Content script not available or still loading - use stored status
                    this.loadStoredHealthStatus();
                }
            } else {
                // Not on LinkedIn jobs page, show appropriate status
                this.updateHealthDisplay({
                    selectorsWorking: false,
                    brokenSelectors: ['page'],
                    workingSelectors: []
                });
            }
        } catch (error) {
            this.loadStoredHealthStatus();
        }
    }

    async loadStoredHealthStatus() {
        try {
            // Health status is included in settings
            if (this.settings.healthStatus) {
                this.updateHealthDisplay(this.settings.healthStatus);
            }
        } catch (error) {
            // Fallback to basic working status
            this.updateHealthDisplay({
                selectorsWorking: true,
                brokenSelectors: [],
                workingSelectors: []
            });
        }
    }

    populateUI() {
        // Set toggle states
        this.elements.companyBlacklistEnabled.checked = this.settings.filtersEnabled?.companyBlacklist || false;
        this.elements.locationBlacklistEnabled.checked = this.settings.filtersEnabled?.locationBlacklist || false;
        this.elements.keywordBlacklistEnabled.checked = this.settings.filtersEnabled?.keywordBlacklist || false;
        this.elements.keywordWhitelistEnabled.checked = this.settings.filtersEnabled?.keywordWhitelist || false;

        // Populate tags
        this.renderTags('companyBlacklist', this.settings.companyBlacklist || []);
        this.renderTags('locationBlacklist', this.settings.locationBlacklist || []);
        this.renderTags('keywordBlacklist', this.settings.keywordBlacklist || []);
        this.renderTags('keywordWhitelist', this.settings.keywordWhitelist || []);

        // Update section states
        this.updateSectionStates();

        // Update health status
        if (this.settings.healthStatus) {
            this.updateHealthDisplay(this.settings.healthStatus);
        }
    }

    updateSectionStates() {
        this.toggleSection('companyBlacklist', this.elements.companyBlacklistEnabled.checked);
        this.toggleSection('locationBlacklist', this.elements.locationBlacklistEnabled.checked);
        this.toggleSection('keywordBlacklist', this.elements.keywordBlacklistEnabled.checked);
        this.toggleSection('keywordWhitelist', this.elements.keywordWhitelistEnabled.checked);
    }

    toggleSection(sectionName, enabled) {
        const sectionMap = {
            companyBlacklist: this.elements.companyTags.closest('.filter-card') || this.elements.companyTags.closest('.filter-section'),
            locationBlacklist: this.elements.locationTags.closest('.filter-card') || this.elements.locationTags.closest('.filter-section'),
            keywordBlacklist: this.elements.keywordBlacklistTags.closest('.filter-card') || this.elements.keywordBlacklistTags.closest('.filter-section'),
            keywordWhitelist: this.elements.keywordWhitelistTags.closest('.filter-card') || this.elements.keywordWhitelistTags.closest('.filter-section')
        };

        const section = sectionMap[sectionName];
        if (section) {
            if (enabled) {
                section.classList.remove('disabled');
            } else {
                section.classList.add('disabled');
            }
        }
    }

    addTag(listType, value) {
        if (!value) return;

        // Initialize array if it doesn't exist
        if (!this.settings[listType]) {
            this.settings[listType] = [];
        }

        // Check for duplicates
        if (this.settings[listType].includes(value)) {
            this.showNotification('Item already exists', 'warning');
            return;
        }

        // Add to settings
        this.settings[listType].push(value);

        // Re-render tags
        this.renderTags(listType, this.settings[listType]);

        // Auto-save and notify content script
        this.saveSettings(false);
        this.showNotification('Filter added successfully', 'success');
    }

    removeTag(listType, value) {
        if (!this.settings[listType]) return;

        const index = this.settings[listType].indexOf(value);
        if (index > -1) {
            this.settings[listType].splice(index, 1);
            this.renderTags(listType, this.settings[listType]);

            // Auto-save and notify content script
            this.saveSettings(false);

            // Show reload prompt for removed filters
            this.showReloadPrompt();
        }
    }

    renderTags(listType, items) {
        const containerMap = {
            companyBlacklist: this.elements.companyTags,
            locationBlacklist: this.elements.locationTags,
            keywordBlacklist: this.elements.keywordBlacklistTags,
            keywordWhitelist: this.elements.keywordWhitelistTags
        };

        const container = containerMap[listType];
        if (!container) return;

        container.innerHTML = '';

        items.forEach(item => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
        <span>${this.escapeHtml(item)}</span>
        <button type="button" class="tag-remove" title="Remove">×</button>
      `;

            tag.querySelector('.tag-remove').addEventListener('click', () => {
                this.removeTag(listType, item);
            });

            container.appendChild(tag);
        });
    }

    async saveSettings(showNotification = true) {
        try {
            // Collect current UI state
            const updatedSettings = {
                ...this.settings,
                filtersEnabled: {
                    companyBlacklist: this.elements.companyBlacklistEnabled.checked,
                    locationBlacklist: this.elements.locationBlacklistEnabled.checked,
                    keywordBlacklist: this.elements.keywordBlacklistEnabled.checked,
                    keywordWhitelist: this.elements.keywordWhitelistEnabled.checked
                }
            };

            const response = await chrome.runtime.sendMessage({
                type: 'UPDATE_SETTINGS',
                data: updatedSettings
            });

            if (response.success) {
                this.settings = updatedSettings;
                if (showNotification) {
                    this.showNotification('Settings saved successfully', 'success');
                }

                // Notify content script of settings update
                this.notifyContentScript();
            } else {
                throw new Error(response.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({ type: 'RESET_SETTINGS' });
            if (response.success) {
                await this.loadSettings();
                this.showNotification('Settings reset successfully', 'success');

                // Reload the current tab if it's on LinkedIn jobs search
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab && tab.url && tab.url.includes('linkedin.com/jobs/search')) {
                        await chrome.tabs.reload(tab.id);
                    }
                } catch (reloadError) {
                    console.log('Could not reload tab:', reloadError);
                    // Still notify content script as fallback
                    this.notifyContentScript();
                }
            } else {
                throw new Error(response.error || 'Failed to reset settings');
            }
        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showNotification('Failed to reset settings', 'error');
        }
    }

    async notifyContentScript() {
        try {
            // Get active tab and send update message
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.url) {
                return;
            }

            if (tab.url.includes('linkedin.com/jobs/search')) {
                try {
                    // Check if content script is loaded by sending a ping first
                    await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
                    // If ping succeeds, send the actual update
                    await chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' });
                } catch (messageError) {
                    // Content script not loaded or not responding - this is normal during page loads
                    this.showNotification('Settings saved, refresh page!', 'info');
                }
            } else if (tab.url.includes('linkedin.com')) {
                // User is on LinkedIn but wrong page
                this.showNotification('JobSieve only works on LinkedIn Jobs Search pages', 'warning');
            }
        } catch (error) {
            // Silently handle tab query errors
        }
    }

    updateHealthDisplay(healthStatus) {
        const { selectorsWorking, brokenSelectors, workingSelectors } = healthStatus;

        // Update status indicator
        let statusClass = 'error';
        let statusText = 'Offline';
        let statusTitle = 'Extension status';

        if (selectorsWorking) {
            statusClass = '';
            statusText = 'Working';
            statusTitle = 'All selectors working properly';
        } else {
            statusClass = 'error';
            if (brokenSelectors && brokenSelectors.includes('page')) {
                statusText = 'Wrong Page';
                statusTitle = 'Navigate to LinkedIn Jobs Search page to use filters';
            } else if (brokenSelectors && brokenSelectors.includes('jobCards')) {
                statusText = 'No Jobs Found';
                statusTitle = 'No job cards detected on page';
            } else if (brokenSelectors && brokenSelectors.length > 0) {
                statusText = 'Selector Issues';
                const brokenList = brokenSelectors.join(', ');
                statusTitle = `Broken selectors: ${brokenList}. Filters may not work correctly.`;
            } else {
                statusText = 'Unknown Error';
                statusTitle = 'Extension not responding';
            }
        }

        this.elements.statusIndicator.className = `status-indicator ${statusClass}`;
        this.elements.statusText.textContent = statusText;
        this.elements.statusText.title = statusTitle;

        // Show detailed warning if selectors are broken
        if (!selectorsWorking && brokenSelectors && brokenSelectors.length > 0) {
            this.showSelectorWarning(brokenSelectors, workingSelectors);
        } else {
            this.hideSelectorWarning();
        }

        // Check if user is on wrong page (but only if not already detected as page issue)
        if (!brokenSelectors || !brokenSelectors.includes('page')) {
            this.checkCurrentPage();
        }
    }

    showSelectorWarning(brokenSelectors, workingSelectors = []) {
        let warningBanner = document.getElementById('selectorWarning');
        if (!warningBanner) {
            warningBanner = document.createElement('div');
            warningBanner.id = 'selectorWarning';
            warningBanner.style.cssText = `
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                padding: 16px 20px;
                margin: -24px -20px 20px -20px;
                font-size: 13px;
                line-height: 1.4;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            `;
            document.querySelector('.content').prepend(warningBanner);
        }

        if (brokenSelectors.includes('page')) {
            warningBanner.innerHTML = `
                <strong>📍 Not on LinkedIn Jobs Page</strong><br>
                Navigate to <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">linkedin.com/jobs/search</code> to use JobSieve filters.
            `;
        } else if (brokenSelectors.includes('jobCards')) {
            warningBanner.innerHTML = `
                <strong>⚠️ No Job Cards Detected</strong><br>
                Extension cannot find job listings on this page. 
                Try refreshing or navigate to a LinkedIn jobs search page.
                <br><br>
                <button id="reloadPageBtn" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px;">
                    🔄 Reload Page
                </button>
            `;
        } else {
            const brokenList = brokenSelectors.filter(s => s !== 'jobCards' && s !== 'page').join(', ');
            warningBanner.innerHTML = `
                <strong>⚠️ Selector Issues Detected</strong><br>
                Broken: <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">${brokenList}</code><br>
                <small>Some filters may not work correctly. LinkedIn may have updated their page structure.</small>
                <br><br>
                <button id="reloadPageBtn" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px;">
                    🔄 Reload Page to Fix
                </button>
            `;
        }

        // Add reload button functionality
        const reloadBtn = warningBanner.querySelector('#reloadPageBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', async () => {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab && tab.url && tab.url.includes('linkedin.com')) {
                        await chrome.tabs.reload(tab.id);
                        this.showNotification('Page reloading...', 'info');
                    }
                } catch (error) {
                    console.error('Failed to reload page:', error);
                    this.showNotification('Failed to reload page', 'error');
                }
            });
        }
    }

    hideSelectorWarning() {
        const warningBanner = document.getElementById('selectorWarning');
        if (warningBanner) {
            warningBanner.remove();
        }
    }

    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                if (!tab.url.includes('linkedin.com/jobs/search')) {
                    if (tab.url.includes('linkedin.com')) {
                        this.showPageWarning('JobSieve only works on LinkedIn Jobs Search pages. Navigate to linkedin.com/jobs/search to use filters.');
                    } else {
                        this.showPageWarning('JobSieve only works on LinkedIn Jobs Search pages.');
                    }
                }
            }
        } catch (error) {
            // Silently handle tab query errors
        }
    }

    showPageWarning(message) {
        // Add a warning banner to the popup
        let warningBanner = document.getElementById('pageWarning');
        if (!warningBanner) {
            warningBanner = document.createElement('div');
            warningBanner.id = 'pageWarning';
            warningBanner.style.cssText = `
                background: #f59e0b;
                color: white;
                padding: 12px;
                margin: -24px -20px 20px -20px;
                font-size: 13px;
                text-align: center;
            `;
            document.querySelector('.content').prepend(warningBanner);
        }
        warningBanner.textContent = message;
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Remove any existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const colors = {
            success: 'linear-gradient(135deg, #22c55e, #16a34a)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #21838f, #1a6b75)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 18px;
            border-radius: 100px;
            color: white;
            font-weight: 500;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            background: ${colors[type] || colors.info};
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            white-space: nowrap;
            font-family: inherit;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-8px)';
            setTimeout(() => notification.remove(), 200);
        }, duration);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showReloadPrompt() {
        this.showNotification('Filter removed, refresh page!', 'info', 4000);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(-50%) translateY(-16px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0) scale(1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style); 