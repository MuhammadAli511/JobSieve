// JobSieve Content Script - LinkedIn Job Filter
class JobSieveFilter {
    constructor() {
        this.settings = {};
        this.isRunning = false;
        this.observer = null;
        this.selectorConfig = this.initializeSelectorConfig();
        this.healthCheck = {
            cardsFound: 0,
            selectorsWorking: true,
            lastUpdate: Date.now()
        };

        this.init();
    }

    // Abstracted selector configuration - easy to update when LinkedIn changes
    initializeSelectorConfig() {
        return {
            jobCards: {
                primary: '[data-job-id]',
                fallbacks: [
                    '[data-occludable-job-id]',
                    '.job-card-container',
                    '.jobs-search-results__list-item',
                    '.job-card-list',
                    '.ember-view[data-occludable-job-id]'
                ]
            },
            company: {
                primary: '.artdeco-entity-lockup__subtitle span[dir="ltr"]',
                fallbacks: [
                    '.artdeco-entity-lockup__subtitle span',
                    '.artdeco-entity-lockup__subtitle',
                    '.job-card-container__company-name',
                    '[data-entity-urn*="company"]',
                    '.job-card-search__company-name',
                    '[aria-label*="company" i]'
                ]
            },
            location: {
                primary: '.job-card-container__metadata-wrapper li span[dir="ltr"]',
                fallbacks: [
                    '.artdeco-entity-lockup__caption li span[dir="ltr"]',
                    '.artdeco-entity-lockup__caption li span',
                    '.job-card-container__metadata-wrapper li',
                    '.artdeco-entity-lockup__caption li',
                    '.job-card-container__location',
                    '.job-card-search__location',
                    '[aria-label*="location" i]'
                ]
            },
            title: {
                primary: '.artdeco-entity-lockup__title a',
                fallbacks: [
                    '.job-card-list__title--link',
                    '.job-card-container__link',
                    '.job-card-container__title',
                    '.job-card-search__title',
                    'h3[aria-label]',
                    '.artdeco-entity-lockup__title'
                ]
            }
        };
    }

    async init() {
        // Check if we're on the correct LinkedIn page
        if (!this.isValidLinkedInJobsPage()) {
            console.log('JobSieve: Not on LinkedIn jobs search page, extension disabled');
            return;
        }

        try {
            // Small delay to ensure extension context is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Inject styles
            this.injectStyles();

            await this.loadSettings();
            this.startFiltering();
            this.setupObserver();
            console.log('JobSieve: Initialized successfully');
        } catch (error) {
            console.error('JobSieve: Initialization failed:', error);
            // Try again after a longer delay
            setTimeout(() => {
                this.init();
            }, 1000);
        }
    }

    // Validate that we're on the correct LinkedIn page
    isValidLinkedInJobsPage() {
        const url = window.location.href;
        return url.includes('linkedin.com/jobs/search');
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
            if (response && response.success) {
                this.settings = response.data;
            } else {
                throw new Error('Failed to load settings from background');
            }
        } catch (error) {
            // Use default settings if background communication fails
            this.settings = {
                filtersEnabled: {
                    companyBlacklist: false,
                    locationBlacklist: false,
                    keywordBlacklist: false,
                    keywordWhitelist: false
                },
                companyBlacklist: [],
                locationBlacklist: [],
                keywordBlacklist: [],
                keywordWhitelist: []
            };
        }
    }

    // Safe element selection with fallback logic
    findElement(container, selectorType) {
        const selectors = this.selectorConfig[selectorType];
        if (!selectors) return null;

        // Try primary selector first
        let element = container.querySelector(selectors.primary);
        if (element) return element;

        // Try fallback selectors
        for (const fallback of selectors.fallbacks) {
            element = container.querySelector(fallback);
            if (element) {
                // Note: Selector fallback in use (for maintenance monitoring)
                return element;
            }
        }

        return null;
    }

    // Health monitoring
    async reportHealth() {
        try {
            await chrome.runtime.sendMessage({
                type: 'HEALTH_CHECK',
                data: this.healthCheck
            });
        } catch (error) {
            // Silently handle health reporting errors to avoid console spam
            // Health reporting is not critical for functionality
        }
    }

    // Enhanced health check - tests individual selectors
    checkSelectorHealth(jobCards) {
        if (jobCards.length === 0) {
            return {
                selectorsWorking: false,
                brokenSelectors: ['jobCards'],
                workingSelectors: []
            };
        }

        const selectorTypes = ['company', 'location', 'title'];
        const workingSelectors = [];
        const brokenSelectors = [];

        // Test each selector type on a sample of job cards
        const sampleSize = Math.min(3, jobCards.length);
        const sampleCards = jobCards.slice(0, sampleSize);

        for (const selectorType of selectorTypes) {
            let working = false;

            // Test selector on sample cards
            for (const card of sampleCards) {
                const element = this.findElement(card, selectorType);
                if (element && element.textContent.trim()) {
                    working = true;
                    break;
                }
            }

            if (working) {
                workingSelectors.push(selectorType);
            } else {
                brokenSelectors.push(selectorType);
            }
        }

        return {
            selectorsWorking: brokenSelectors.length === 0,
            brokenSelectors,
            workingSelectors
        };
    }

    startFiltering() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.filterJobs();
    }

    async filterJobs() {
        const jobCards = this.getJobCards();
        this.healthCheck.cardsFound = jobCards.length;

        // Enhanced health check
        const selectorHealth = this.checkSelectorHealth(jobCards);
        this.healthCheck.selectorsWorking = selectorHealth.selectorsWorking;
        this.healthCheck.brokenSelectors = selectorHealth.brokenSelectors;
        this.healthCheck.workingSelectors = selectorHealth.workingSelectors;
        this.healthCheck.lastUpdate = Date.now();

        // Log broken selectors for debugging
        if (selectorHealth.brokenSelectors.length > 0) {
            console.warn('JobSieve: Broken selectors detected:', selectorHealth.brokenSelectors);
        }

        let filtered = 0;
        let highlighted = 0;

        // Process each job card
        for (const card of jobCards) {
            if (this.shouldHideCard(card)) {
                this.hideCard(card); // This now removes the li element completely
                filtered++;
            } else if (this.shouldHighlightCard(card)) {
                this.highlightCard(card);
                highlighted++;
            } else {
                this.resetCardStyle(card);
            }
        }

        // Report health status
        await this.reportHealth();

        console.log(`JobSieve: Processed ${jobCards.length} jobs, removed ${filtered}, highlighted ${highlighted}`);
    }

    getJobCards() {
        const selectors = this.selectorConfig.jobCards;
        let cards = Array.from(document.querySelectorAll(selectors.primary));

        if (cards.length === 0) {
            // Try fallback selectors
            for (const fallback of selectors.fallbacks) {
                cards = Array.from(document.querySelectorAll(fallback));
                if (cards.length > 0) {
                    break;
                }
            }
        }

        return cards;
    }

    shouldHideCard(card) {
        return this.isCompanyBlacklisted(card) ||
            this.isLocationBlacklisted(card) ||
            this.hasBlacklistedKeywords(card);
    }

    shouldHighlightCard(card) {
        return this.settings.filtersEnabled.keywordWhitelist &&
            this.hasWhitelistedKeywords(card);
    }

    isCompanyBlacklisted(card) {
        if (!this.settings.filtersEnabled.companyBlacklist || !this.settings.companyBlacklist?.length) {
            return false;
        }

        const companyElement = this.findElement(card, 'company');
        if (!companyElement) return false;

        const companyText = companyElement.textContent.trim().toLowerCase();
        return this.settings.companyBlacklist.some(company =>
            companyText.includes(company.toLowerCase())
        );
    }

    isLocationBlacklisted(card) {
        if (!this.settings.filtersEnabled.locationBlacklist || !this.settings.locationBlacklist?.length) {
            return false;
        }

        const locationElement = this.findElement(card, 'location');
        if (!locationElement) return false;

        const locationText = locationElement.textContent.trim().toLowerCase();
        return this.settings.locationBlacklist.some(location =>
            locationText.includes(location.toLowerCase())
        );
    }

    hasBlacklistedKeywords(card) {
        if (!this.settings.filtersEnabled.keywordBlacklist || !this.settings.keywordBlacklist?.length) {
            return false;
        }

        const cardText = this.getCardText(card).toLowerCase();
        return this.settings.keywordBlacklist.some(keyword =>
            cardText.includes(keyword.toLowerCase())
        );
    }

    hasWhitelistedKeywords(card) {
        if (!this.settings.keywordWhitelist?.length) return false;

        const cardText = this.getCardText(card).toLowerCase();
        return this.settings.keywordWhitelist.some(keyword =>
            cardText.includes(keyword.toLowerCase())
        );
    }

    getCardText(card) {
        // Get all text content from title and company
        const titleElement = this.findElement(card, 'title');
        const companyElement = this.findElement(card, 'company');

        let text = '';
        if (titleElement) text += titleElement.textContent + ' ';
        if (companyElement) text += companyElement.textContent + ' ';

        return text.trim();
    }

    hideCard(card) {
        // Find the parent li element
        const listItem = card.closest('li[data-occludable-job-id]');
        if (listItem) {
            // Completely remove the li element from DOM
            listItem.remove();
        } else {
            // Fallback: hide the card itself if no li parent found
            card.style.display = 'none';
            card.classList.add('jobsieve-hidden');
        }
    }

    highlightCard(card) {
        card.classList.add('jobsieve-highlighted');
        card.style.outline = '2px solid #21838f';
        card.style.backgroundColor = 'rgba(76, 175, 80, 0.25)';
    }

    resetCardStyle(card) {
        // Since we're removing elements, we don't need to reset styles
        // for removed elements. Only reset for visible cards.
        card.style.display = '';
        card.style.outline = '';
        card.style.backgroundColor = '';
        card.classList.remove('jobsieve-hidden', 'jobsieve-highlighted');
    }

    setupObserver() {
        // Watch for new job cards being added
        this.observer = new MutationObserver((mutations) => {
            let shouldRefilter = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new job cards were added
                            if (node.matches && node.matches('[data-job-id]')) {
                                shouldRefilter = true;
                                break;
                            }

                            // Check for job cards in added subtrees
                            if (node.querySelector && node.querySelector('[data-job-id]')) {
                                shouldRefilter = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (shouldRefilter) {
                // Debounce filtering
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => this.filterJobs(), 500);
            }
        });

        // Start observing
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Public method to reload settings and refilter
    async refresh() {
        await this.loadSettings();
        this.filterJobs();
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        clearTimeout(this.filterTimeout);
        this.isRunning = false;
    }

    injectStyles() {
        try {
            // Check if styles are already injected
            if (document.getElementById('jobsieve-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'jobsieve-styles';
            style.textContent = `
                /* JobSieve Content Styles */
                .jobsieve-hidden {
                    display: none !important;
                }

                .jobsieve-highlighted {
                    position: relative;
                    outline: 2px solid #21838f !important;
                    background-color: rgba(76, 175, 80, 0.25) !important;
                    border-radius: 8px !important;
                    animation: jobsieve-highlight 0.3s ease;
                    z-index: 1 !important;
                }

                .jobsieve-highlighted::before {
                    content: "✨ Highlighted by JobSieve";
                    position: absolute;
                    top: -8px;
                    left: 12px;
                    background: #21838f;
                    color: white;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 12px;
                    z-index: 10;
                    pointer-events: none;
                }

                @keyframes jobsieve-highlight {
                    0% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(33, 131, 143, 0.7);
                    }
                    50% {
                        transform: scale(1.02);
                        box-shadow: 0 0 0 10px rgba(33, 131, 143, 0);
                    }
                    100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(33, 131, 143, 0);
                    }
                }

                .jobsieve-fade-out {
                    opacity: 0 !important;
                    transform: scale(0.95) !important;
                    transition: opacity 0.3s ease, transform 0.3s ease !important;
                }
            `;

            document.head.appendChild(style);
        } catch (error) {
            console.warn('JobSieve: Failed to inject styles:', error.message);
        }
    }
}

// Initialize the filter
let jobSieveFilter;

// Function to check if extension context is valid
function isExtensionContextValid() {
    try {
        return chrome.runtime && chrome.runtime.id;
    } catch (error) {
        return false;
    }
}

// Wait for page to be ready and extension context to be valid
function initializeExtension() {
    if (!isExtensionContextValid()) {
        // Extension context not ready, retry
        setTimeout(initializeExtension, 500);
        return;
    }

    jobSieveFilter = new JobSieveFilter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeExtension();
    });
} else {
    initializeExtension();
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.type === 'PING') {
            // Respond to ping to confirm content script is loaded
            sendResponse({ success: true, status: 'ready' });
            return true;
        } else if (message.type === 'SETTINGS_UPDATED' && jobSieveFilter) {
            jobSieveFilter.refresh();
            sendResponse({ success: true });
            return true;
        } else if (message.type === 'GET_HEALTH_STATUS' && jobSieveFilter) {
            // Return current health status
            sendResponse({
                success: true,
                healthStatus: jobSieveFilter.healthCheck
            });
            return true;
        }
    } catch (error) {
        console.warn('JobSieve: Message handling error:', error.message);
        sendResponse({ success: false, error: error.message });
    }
    return false;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (jobSieveFilter) {
        jobSieveFilter.destroy();
    }
}); 