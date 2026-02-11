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
            '.ember-view[data-occludable-job-id]',
            '.scaffold-layout__list-item'
        ]
    },
    company: {
        primary: '.artdeco-entity-lockup__subtitle .AEuhFmZyMboxPGoVPjFnHnVGyLtrNdAjWVppI',
        fallbacks: [
            '.artdeco-entity-lockup__subtitle span[dir="ltr"]',
            '.artdeco-entity-lockup__subtitle span',
            '.artdeco-entity-lockup__subtitle',
            '.job-card-container__company-name',
            '[data-entity-urn*="company"]',
            '.job-card-search__company-name',
            '[aria-label*="company" i]'
        ]
    },
    location: {
        primary: '.artdeco-entity-lockup__caption .DJmjhrULCEeVHdRIuxazWNSsFOOdWKIsE',
        fallbacks: [
            '.job-card-container__metadata-wrapper li span[dir="ltr"]',
            '.artdeco-entity-lockup__caption li span[dir="ltr"]',
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

    // Test promoted detection
    let promotedCount = 0;
    let viewedCount = 0;
    cards.forEach(card => {
        // Check promoted
        const promotedResult = findElement(card, 'promoted');
        if (promotedResult && /promoted/i.test(promotedResult.element.textContent)) {
            promotedCount++;
        } else {
            const footerEls = card.querySelectorAll('.job-card-container__footer-wrapper, .job-card-list__footer-wrapper');
            for (const el of footerEls) {
                if (/\bpromoted\b/i.test(el.textContent)) { promotedCount++; break; }
            }
        }
        // Check viewed
        const titleLink = findElement(card, 'title');
        if (titleLink && titleLink.element) {
            if (titleLink.element.classList.contains('job-card-list__title--is-visited')) viewedCount++;
        }
    });
    console.log(`Promoted jobs detected: ${promotedCount}`);
    console.log(`Viewed jobs detected: ${viewedCount}`);
}

console.log('\n✅ JobSieve Selector Test Complete!');
console.log('Copy and paste this script into the browser console on any LinkedIn jobs page (search, collections, or view) to test.'); 