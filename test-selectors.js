// JobSieve Selector Test Script
// Run this in the browser console on a LinkedIn jobs page to test selectors

console.log('🔍 JobSieve Selector Test Starting...');

// Selector configuration (matches content.js)
const selectorConfig = {
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
        primary: '.artdeco-entity-lockup__subtitle .LFUkJATCjtUDMAIItJefilLEzXXTDvlvyvDDc',
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
        primary: '.artdeco-entity-lockup__caption .BssLzPLeahgrzlSIUWAgqYJrVUWZanEMaDo',
        fallbacks: [
            '.artdeco-entity-lockup__caption li span',
            '.job-card-container__metadata-wrapper li',
            '.job-card-container__location',
            '.job-card-search__location',
            '[aria-label*="location" i]',
            '.artdeco-entity-lockup__subtitle'
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

// Helper function to test selectors
function findElement(container, selectorType) {
    const selectors = selectorConfig[selectorType];
    if (!selectors) return null;

    // Try primary selector first
    let element = container.querySelector(selectors.primary);
    if (element) return { element, selectorUsed: selectors.primary, isPrimary: true };

    // Try fallback selectors
    for (const fallback of selectors.fallbacks) {
        element = container.querySelector(fallback);
        if (element) {
            return { element, selectorUsed: fallback, isPrimary: false };
        }
    }

    return null;
}

// Get job cards
const jobCardsResult = [];
let cards = Array.from(document.querySelectorAll(selectorConfig.jobCards.primary));

if (cards.length === 0) {
    for (const fallback of selectorConfig.jobCards.fallbacks) {
        cards = Array.from(document.querySelectorAll(fallback));
        if (cards.length > 0) {
            console.warn(`⚠️ Using fallback job card selector: ${fallback}`);
            break;
        }
    }
}

console.log(`📋 Found ${cards.length} job cards`);

if (cards.length === 0) {
    console.error('❌ No job cards found! Check if you\'re on a LinkedIn jobs page.');
} else {
    // Test each selector type on the first few cards
    const testCards = cards.slice(0, Math.min(3, cards.length));

    testCards.forEach((card, index) => {
        console.log(`\n🧪 Testing Card ${index + 1}:`);

        // Test each selector type
        Object.keys(selectorConfig).forEach(selectorType => {
            if (selectorType === 'jobCards') return; // Skip, already tested

            const result = findElement(card, selectorType);
            if (result) {
                const text = result.element.textContent?.trim().substring(0, 50) + '...';
                const status = result.isPrimary ? '✅' : '⚠️';
                console.log(`  ${status} ${selectorType}: "${text}" (${result.selectorUsed})`);
            } else {
                console.log(`  ❌ ${selectorType}: Not found`);
            }
        });
    });

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`Total job cards found: ${cards.length}`);
}

console.log('\n✅ JobSieve Selector Test Complete!');
console.log('Copy and paste this script into the browser console on any LinkedIn jobs page to test.'); 