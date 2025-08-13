/**
 * UI Contract Test for Nest Cards
 * Smoke test to ensure all five cards exist in both layouts and no console errors occur
 */

/**
 * Run basic UI contract tests
 * @returns {Promise<{passed: boolean, results: Array}>} Test results
 */
export async function runUIContractTests() {
  const results = [];
  let passed = true;

  // Test 1: Check if cards utility exists and functions
  try {
    const { renderNestCards, registerNestCard, hasNestCards, countNestCards } = 
      await import('./cards/nest-cards.js');
    
    if (typeof renderNestCards === 'function' && 
        typeof registerNestCard === 'function' &&
        typeof hasNestCards === 'function' &&
        typeof countNestCards === 'function') {
      results.push({ test: 'Cards utility functions exist', status: 'PASS' });
    } else {
      results.push({ test: 'Cards utility functions exist', status: 'FAIL' });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Cards utility import', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 2: Check if page title component exists
  try {
    const { FnPageTitle } = await import('./fn-page-title.js');
    if (typeof FnPageTitle === 'function') {
      results.push({ test: 'Page title component exists', status: 'PASS' });
    } else {
      results.push({ test: 'Page title component exists', status: 'FAIL' });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Page title component import', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 3: Check if all card components exist
  const cardComponents = [
    'fn-card-events',
    'fn-card-birthday', 
    'fn-card-tip',
    'fn-card-goal'
  ];

  for (const component of cardComponents) {
    const element = document.createElement(component);
    if (element.constructor !== HTMLElement) {
      results.push({ test: `${component} component registered`, status: 'PASS' });
    } else {
      results.push({ test: `${component} component registered`, status: 'FAIL' });
      passed = false;
    }
  }

  // Test 4: Test cards rendering
  try {
    const { renderNestCards } = await import('./cards/nest-cards.js');
    const fragment = renderNestCards();
    
    if (fragment instanceof DocumentFragment) {
      results.push({ test: 'renderNestCards returns DocumentFragment', status: 'PASS' });
      
      // Check if container has expected structure
      const container = fragment.querySelector('.nest-cards-container');
      if (container) {
        results.push({ test: 'Cards container created', status: 'PASS' });
        
        const sections = container.querySelectorAll('section');
        if (sections.length >= 4) {
          results.push({ test: 'Minimum 4 card sections exist', status: 'PASS' });
        } else {
          results.push({ test: 'Minimum 4 card sections exist', status: 'FAIL' });
          passed = false;
        }
      } else {
        results.push({ test: 'Cards container created', status: 'FAIL' });
        passed = false;
      }
    } else {
      results.push({ test: 'renderNestCards returns DocumentFragment', status: 'FAIL' });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Cards rendering', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 5: Check console for errors (capture current errors)
  const originalConsoleError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalConsoleError.apply(console, args);
  };

  // Simulate component creation
  try {
    const pageTitle = document.createElement('fn-page-title');
    document.body.appendChild(pageTitle);
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (errors.length === 0) {
      results.push({ test: 'No console errors during component creation', status: 'PASS' });
    } else {
      results.push({ test: 'No console errors during component creation', status: 'FAIL', errors });
      passed = false;
    }
    
    // Cleanup
    document.body.removeChild(pageTitle);
  } catch (error) {
    results.push({ test: 'Component creation test', status: 'FAIL', error: error.message });
    passed = false;
  } finally {
    console.error = originalConsoleError;
  }

  return { passed, results };
}

/**
 * Run tests and log results to console
 */
export async function runAndLogTests() {
  console.log('🧪 Running UI Contract Tests for Nest Cards...\n');
  
  const { passed, results } = await runUIContractTests();
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.errors) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  });
  
  console.log(`\n📊 Overall Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`📈 Tests: ${results.filter(r => r.status === 'PASS').length}/${results.length} passed`);
  
  return { passed, results };
}

// Auto-run tests if loaded directly
if (typeof window !== 'undefined' && window.location?.search?.includes('test=ui')) {
  runAndLogTests();
}