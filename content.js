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
        // Stats tracking
        this.sessionStats = {
            filtered: 0,
            highlighted: 0,
            totalProcessed: 0,
            byFilter: {
                companyBlacklist: 0,
                locationBlacklist: 0,
                keywordBlacklist: 0,
                promoted: 0,
                viewed: 0
            }
        };
        this.filterCounts = {
            companyBlacklist: {},
            locationBlacklist: {},
            keywordBlacklist: {}
        };
        // Detect page type
        this.pageType = this.detectPageType();

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
                    '.ember-view[data-occludable-job-id]',
                    '.scaffold-layout__list-item'
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
                    'a[aria-label]',
                    'h3[aria-label]',
                    '.artdeco-entity-lockup__title'
                ]
            },
            promoted: {
                primary: '.job-card-container__footer-item--promoted',
                fallbacks: [
                    '.job-card-container__footer-item',
                    '.job-card-list__footer-wrapper .job-card-container__footer-job-state',
                    '.artdeco-entity-lockup__badge',
                    '.job-card-container__footer-wrapper'
                ]
            }
        };
    }

    // Detect the type of LinkedIn page we're on
    detectPageType() {
        const url = window.location.href;
        if (url.includes('/jobs/search')) return 'search';
        if (url.includes('/jobs/collections')) return 'collections';
        if (url.includes('/jobs/view')) return 'view';
        return 'unknown';
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

    // Validate that we're on a supported LinkedIn page
    isValidLinkedInJobsPage() {
        const url = window.location.href;
        return url.includes('linkedin.com/jobs/');
    }

    async loadSettings() {
        try {
            if (!isExtensionContextValid()) {
                this.destroy();
                return;
            }
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
                    keywordWhitelist: false,
                    hidePromoted: false,
                    hideViewed: false
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
            if (!isExtensionContextValid()) {
                this.destroy();
                return;
            }
            await chrome.runtime.sendMessage({
                type: 'HEALTH_CHECK',
                data: this.healthCheck
            });
        } catch (error) {
            // Extension context likely invalidated (e.g., extension reloaded)
            if (error.message?.includes('Extension context invalidated')) {
                this.destroy();
            }
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

        // Reset per-run filter counts
        this.filterCounts = {
            companyBlacklist: {},
            locationBlacklist: {},
            keywordBlacklist: {}
        };
        const byFilter = {
            companyBlacklist: 0,
            locationBlacklist: 0,
            keywordBlacklist: 0,
            promoted: 0,
            viewed: 0
        };

        // Process each job card
        for (const card of jobCards) {
            const hideReason = this.getHideReason(card);
            if (hideReason) {
                this.hideCard(card);
                filtered++;
                byFilter[hideReason]++;
            } else if (this.shouldHighlightCard(card)) {
                this.highlightCard(card);
                highlighted++;
            } else {
                this.resetCardStyle(card);
            }
        }

        // Update session stats
        this.sessionStats.filtered = filtered;
        this.sessionStats.highlighted = highlighted;
        this.sessionStats.totalProcessed = jobCards.length;
        this.sessionStats.byFilter = byFilter;

        // Include stats in health check
        this.healthCheck.filtered = filtered;
        this.healthCheck.highlighted = highlighted;
        this.healthCheck.filterCounts = this.filterCounts;
        this.healthCheck.byFilter = byFilter;

        // Report health status
        await this.reportHealth();

        console.log(`JobSieve: Processed ${jobCards.length} jobs, hidden ${filtered}, highlighted ${highlighted}`);
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
        return !!this.getHideReason(card);
    }

    // Returns the reason string for hiding, or null if card should not be hidden
    getHideReason(card) {
        if (this.isPromoted(card)) return 'promoted';
        if (this.isViewed(card)) return 'viewed';
        if (this.isCompanyBlacklisted(card)) return 'companyBlacklist';
        if (this.isLocationBlacklisted(card)) return 'locationBlacklist';
        if (this.hasBlacklistedKeywords(card)) return 'keywordBlacklist';
        return null;
    }

    shouldHighlightCard(card) {
        return this.settings.filtersEnabled.keywordWhitelist &&
            this.hasWhitelistedKeywords(card);
    }

    isPromoted(card) {
        if (!this.settings.filtersEnabled?.hidePromoted) return false;

        // Check for promoted label in footer/metadata area
        const promotedEl = this.findElement(card, 'promoted');
        if (promotedEl && /promoted/i.test(promotedEl.textContent)) {
            return true;
        }

        // Fallback: scan footer area for "Promoted" text (avoid title matches)
        const footerEls = card.querySelectorAll(
            '.job-card-container__footer-wrapper, .job-card-list__footer-wrapper, .artdeco-entity-lockup__badge'
        );
        for (const el of footerEls) {
            if (/\bpromoted\b/i.test(el.textContent)) return true;
        }

        return false;
    }

    isViewed(card) {
        if (!this.settings.filtersEnabled?.hideViewed) return false;

        // Check for "Viewed" text in the footer/status area
        const footerItems = card.querySelectorAll(
            '.job-card-container__footer-job-state, .job-card-container__footer-item'
        );
        for (const el of footerItems) {
            if (/\bviewed\b/i.test(el.textContent.trim())) return true;
        }

        // Check for visited link CSS class indicators
        const titleLink = this.findElement(card, 'title');
        if (titleLink) {
            if (titleLink.classList.contains('job-card-list__title--is-visited')) return true;
            if (titleLink.closest('.job-card-list__entity-lockup--is-visited')) return true;
        }

        // Check for visited class on parent container
        const cardParent = card.closest('li[data-occludable-job-id]') || card;
        if (cardParent.classList.contains('jobs-search-results__list-item--visited')) return true;

        return false;
    }

    isCompanyBlacklisted(card) {
        if (!this.settings.filtersEnabled.companyBlacklist || !this.settings.companyBlacklist?.length) {
            return false;
        }

        const companyElement = this.findElement(card, 'company');
        if (!companyElement) return false;

        const companyText = companyElement.textContent.trim().toLowerCase();
        let matched = false;
        for (const company of this.settings.companyBlacklist) {
            if (companyText.includes(company.toLowerCase())) {
                this.filterCounts.companyBlacklist[company] = (this.filterCounts.companyBlacklist[company] || 0) + 1;
                matched = true;
            }
        }
        return matched;
    }

    isLocationBlacklisted(card) {
        if (!this.settings.filtersEnabled.locationBlacklist || !this.settings.locationBlacklist?.length) {
            return false;
        }

        const locationElement = this.findElement(card, 'location');
        if (!locationElement) return false;

        const locationText = locationElement.textContent.trim().toLowerCase();
        let matched = false;
        for (const location of this.settings.locationBlacklist) {
            if (locationText.includes(location.toLowerCase())) {
                this.filterCounts.locationBlacklist[location] = (this.filterCounts.locationBlacklist[location] || 0) + 1;
                matched = true;
            }
        }
        return matched;
    }

    hasBlacklistedKeywords(card) {
        if (!this.settings.filtersEnabled.keywordBlacklist || !this.settings.keywordBlacklist?.length) {
            return false;
        }

        const cardText = this.getCardText(card).toLowerCase();
        let matched = false;
        for (const keyword of this.settings.keywordBlacklist) {
            if (cardText.includes(keyword.toLowerCase())) {
                this.filterCounts.keywordBlacklist[keyword] = (this.filterCounts.keywordBlacklist[keyword] || 0) + 1;
                matched = true;
            }
        }
        return matched;
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
        // Find the parent li element and hide via CSS (not DOM removal, so toggles can restore)
        const listItem = card.closest('li[data-occludable-job-id]');
        if (listItem) {
            listItem.classList.add('jobsieve-hidden');
        } else {
            card.classList.add('jobsieve-hidden');
        }
    }

    highlightCard(card) {
        // Use CSS class only — no inline styles that would override the class
        card.classList.add('jobsieve-highlighted');
    }

    resetCardStyle(card) {
        // Remove hiding from both the card and its parent li
        const listItem = card.closest('li[data-occludable-job-id]');
        if (listItem) {
            listItem.classList.remove('jobsieve-hidden');
        }
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
                if (!isExtensionContextValid()) {
                    this.destroy();
                    return;
                }
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
                    position: relative !important;
                    box-shadow: inset 0 0 0 2.5px #21838f,
                                0 2px 12px rgba(33, 131, 143, 0.18) !important;
                    background-color: rgba(33, 131, 143, 0.06) !important;
                    border-radius: 10px !important;
                    margin-top: 28px !important;
                    z-index: 1 !important;
                    animation: jobsieve-highlight-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .jobsieve-highlighted::before {
                    content: "✨ Highlighted by JobSieve";
                    position: absolute;
                    top: -22px;
                    left: 10px;
                    background: linear-gradient(135deg, #21838f 0%, #1a6b75 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 10.5px;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                    padding: 3px 10px;
                    border-radius: 8px;
                    line-height: 1.4;
                    z-index: 10;
                    pointer-events: none;
                    box-shadow: 0 2px 6px rgba(33, 131, 143, 0.3);
                    white-space: nowrap;
                }

                .jobsieve-highlighted:hover {
                    box-shadow: inset 0 0 0 2.5px #1a6b75,
                                0 4px 20px rgba(33, 131, 143, 0.22) !important;
                }

                @keyframes jobsieve-highlight-in {
                    0% {
                        opacity: 0.6;
                        box-shadow: inset 0 0 0 2.5px rgba(33, 131, 143, 0),
                                    0 0 0 0 rgba(33, 131, 143, 0);
                    }
                    100% {
                        opacity: 1;
                        box-shadow: inset 0 0 0 2.5px #21838f,
                                    0 2px 12px rgba(33, 131, 143, 0.18);
                    }
                }

                .jobsieve-fade-out {
                    opacity: 0 !important;
                    transform: scale(0.97) !important;
                    transition: opacity 0.25s ease, transform 0.25s ease !important;
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
    if (!isExtensionContextValid()) return false;
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
        } else if (message.type === 'GET_FILTER_STATS' && jobSieveFilter) {
            // Return full filter stats for popup display
            sendResponse({
                success: true,
                sessionStats: jobSieveFilter.sessionStats,
                filterCounts: jobSieveFilter.filterCounts
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