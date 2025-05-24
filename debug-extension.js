// JobSieve Debug Script
// Run this in the browser console to test extension functionality

console.log('🐛 JobSieve Debug Script Starting...');

// Test 1: Check if we're on the right page
function testPageUrl() {
    const url = window.location.href;
    const isCorrectPage = url.includes('linkedin.com/jobs/search');

    console.log(`📍 Current URL: ${url}`);
    console.log(`✅ Correct page: ${isCorrectPage ? 'YES' : 'NO'}`);

    if (!isCorrectPage) {
        console.warn('⚠️ Extension only works on linkedin.com/jobs/search pages');
    }

    return isCorrectPage;
}

// Test 2: Check if content script is loaded
function testContentScript() {
    const hasJobSieveFilter = typeof jobSieveFilter !== 'undefined';
    console.log(`🔧 Content script loaded: ${hasJobSieveFilter ? 'YES' : 'NO'}`);

    if (hasJobSieveFilter) {
        console.log(`📊 Filter settings:`, jobSieveFilter.settings);
    } else {
        console.warn('⚠️ JobSieve content script not found. Check console for errors.');
    }

    return hasJobSieveFilter;
}

// Test 3: Test selectors
function testSelectors() {
    console.log('🔍 Testing selectors...');

    const selectors = {
        jobCards: '[data-job-id]',
        company: '.artdeco-entity-lockup__subtitle .LFUkJATCjtUDMAIItJefilLEzXXTDvlvyvDDc',
        location: '.artdeco-entity-lockup__caption .BssLzPLeahgrzlSIUWAgqYJrVUWZanEMaDo',
        title: '.artdeco-entity-lockup__title a',
    };

    Object.entries(selectors).forEach(([name, selector]) => {
        const elements = document.querySelectorAll(selector);
        console.log(`  ${name}: ${elements.length} found (${selector})`);
    });
}

// Test 4: Test extension communication
async function testExtensionCommunication() {
    console.log('📡 Testing extension communication...');

    try {
        // Test if chrome.runtime is available
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.error('❌ Chrome runtime not available');
            return false;
        }

        // Test background script communication
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        console.log('✅ Background script communication:', response.success ? 'OK' : 'FAILED');

        if (response.success) {
            console.log('📋 Current settings:', response.data);
        }

        return response.success;
    } catch (error) {
        console.error('❌ Extension communication failed:', error);
        return false;
    }
}

// Test 5: Manual filter test
function testFiltering() {
    console.log('🧪 Testing manual filtering...');

    if (typeof jobSieveFilter === 'undefined') {
        console.error('❌ Cannot test filtering - content script not loaded');
        return;
    }

    const jobCards = jobSieveFilter.getJobCards();
    console.log(`📋 Found ${jobCards.length} job cards`);

    if (jobCards.length > 0) {
        const firstCard = jobCards[0];
        console.log('🔍 Testing first card:');

        const company = jobSieveFilter.findElement(firstCard, 'company');
        const location = jobSieveFilter.findElement(firstCard, 'location');
        const title = jobSieveFilter.findElement(firstCard, 'title');

        console.log(`  Company: ${company ? company.textContent.trim() : 'NOT FOUND'}`);
        console.log(`  Location: ${location ? location.textContent.trim() : 'NOT FOUND'}`);
        console.log(`  Title: ${title ? title.textContent.trim() : 'NOT FOUND'}`);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🔄 Running all JobSieve tests...\n');

    const pageTest = testPageUrl();
    const contentTest = testContentScript();
    const commTest = await testExtensionCommunication();

    console.log('\n🔍 Selector tests:');
    testSelectors();

    if (contentTest) {
        console.log('\n🧪 Filter tests:');
        testFiltering();
    }

    console.log('\n📊 Test Summary:');
    console.log(`  Page URL: ${pageTest ? '✅' : '❌'}`);
    console.log(`  Content Script: ${contentTest ? '✅' : '❌'}`);
    console.log(`  Extension Communication: ${commTest ? '✅' : '❌'}`);

    if (pageTest && contentTest && commTest) {
        console.log('🎉 All tests passed! Extension should be working.');
    } else {
        console.log('⚠️ Some tests failed. Check the issues above.');
    }
}

// Auto-run tests
runAllTests();

// Make functions available globally for manual testing
window.jobSieveDebug = {
    testPageUrl,
    testContentScript,
    testSelectors,
    testExtensionCommunication,
    testFiltering,
    runAllTests
};

console.log('💡 Debug functions available as: window.jobSieveDebug.functionName()');
console.log('🔄 Run window.jobSieveDebug.runAllTests() to test everything again'); 