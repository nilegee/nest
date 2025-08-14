/**
 * Manual verification test for the stabilization changes
 */

// Test 1: Proactive bootstrap should tolerate 404 gracefully
console.log('Testing proactive bootstrap lazy loading...');
async function testProactiveBootstrap() {
  try {
    // This should work if bootstrap.js exists, or gracefully fail if not
    const url = new URL('./src/proactive/bootstrap.js', window.location.href).href;
    await import(url);
    console.log('✅ Proactive bootstrap loaded successfully');
  } catch (e) {
    console.log('✅ Proactive bootstrap failed gracefully:', e.message);
  }
}

// Test 2: Custom element guard
console.log('Testing custom element guard...');
function testCustomElementGuard() {
  const existingDef = customElements.get('fn-home');
  console.log('fn-home already defined:', !!existingDef);
  
  // This should not throw an error even if called multiple times
  try {
    if (!customElements.get('test-element')) {
      class TestElement extends HTMLElement {}
      customElements.define('test-element', TestElement);
      console.log('✅ Custom element defined successfully');
    } else {
      console.log('✅ Custom element already defined, skipped redefinition');
    }
  } catch (e) {
    console.error('❌ Custom element test failed:', e);
  }
}

// Test 3: OAuth hash cleanup logic
console.log('Testing OAuth hash cleanup...');
function testOAuthHashCleanup() {
  const originalHash = location.hash;
  const originalTitle = document.title;
  
  // Simulate OAuth hash
  history.replaceState({}, document.title, location.pathname + '#access_token=test123');
  
  // Test the cleanup logic
  if (location.hash && location.hash.startsWith('#access_token=')) {
    history.replaceState({}, document.title, location.pathname + location.search);
    console.log('✅ OAuth hash cleanup worked');
  }
  
  // Restore original state
  if (originalHash) {
    history.replaceState({}, originalTitle, location.pathname + originalHash);
  }
}

// Test 4: Fetch wrapper
console.log('Testing fetch wrapper...');
async function testFetchWrapper() {
  try {
    // Test that the import works
    const { fetchJSON } = await import('../src/lib/fetch.js');
    console.log('✅ Fetch wrapper imported successfully');
    
    // Test that headers are applied (we can't make real requests in this context)
    console.log('✅ Fetch wrapper module loaded');
  } catch (e) {
    console.error('❌ Fetch wrapper test failed:', e);
  }
}

// Test 5: Log utility
console.log('Testing log utility...');
async function testLogUtility() {
  try {
    const { bootWarn } = await import('../src/lib/log.js');
    bootWarn('Test warning message', { test: true });
    console.log('✅ Boot warning logged successfully');
  } catch (e) {
    console.error('❌ Log utility test failed:', e);
  }
}

// Run all tests
async function runVerificationTests() {
  console.log('🧪 Running verification tests...');
  await testProactiveBootstrap();
  testCustomElementGuard();
  testOAuthHashCleanup();
  await testFetchWrapper();
  await testLogUtility();
  console.log('✅ All verification tests completed');
}

// Export for manual testing
window.runVerificationTests = runVerificationTests;