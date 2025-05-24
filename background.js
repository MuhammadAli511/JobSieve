// Background service worker for JobSieve
class JobSieveBackground {
    constructor() {
        this.setupListeners();
        this.initializeStorage();
    }

    setupListeners() {
        // Handle messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                this.handleMessage(message, sender, sendResponse);
                return true; // Keep channel open for async response
            } catch (error) {
                console.error('JobSieve: Message listener error:', error);
                sendResponse({ success: false, error: error.message });
                return false;
            }
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            this.initializeStorage();
        });
    }

    async initializeStorage() {
        const defaultSettings = {
            companyBlacklist: [],
            locationBlacklist: [],
            keywordBlacklist: [],
            keywordWhitelist: [],
            filtersEnabled: {
                companyBlacklist: true,
                locationBlacklist: true,
                keywordBlacklist: true,
                keywordWhitelist: true
            },
            healthStatus: {
                selectorsWorking: true
            }
        };

        try {
            const stored = await chrome.storage.sync.get(Object.keys(defaultSettings));
            const settings = { ...defaultSettings, ...stored };
            await chrome.storage.sync.set(settings);
        } catch (error) {
            console.error('JobSieve: Failed to initialize storage:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'HEALTH_CHECK':
                    await this.updateHealthStatus(message.data);
                    sendResponse({ success: true });
                    break;

                case 'GET_SETTINGS':
                    const settings = await chrome.storage.sync.get();
                    sendResponse({ success: true, data: settings });
                    break;

                case 'UPDATE_SETTINGS':
                    await chrome.storage.sync.set(message.data);
                    sendResponse({ success: true });
                    break;

                case 'RESET_SETTINGS':
                    await chrome.storage.sync.clear();
                    await this.initializeStorage();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('JobSieve: Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async updateHealthStatus(healthData) {
        try {
            const current = await chrome.storage.sync.get('healthStatus');
            const healthStatus = {
                ...current.healthStatus,
                ...healthData
            };

            await chrome.storage.sync.set({ healthStatus });

            // Log warnings if selectors are failing
            if (!healthData.selectorsWorking || healthData.cardsFound === 0) {
                console.warn('JobSieve: Potential selector issues detected:', healthData);
            }
        } catch (error) {
            console.error('JobSieve: Failed to update health status:', error);
        }
    }
}

// Initialize background service
new JobSieveBackground(); 