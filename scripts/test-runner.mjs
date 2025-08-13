#!/usr/bin/env node
/**
 * Minimal test runner for FamilyNest
 * Runs existing tests in a Node.js environment with jsdom
 */

import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM globally available
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.DocumentFragment = dom.window.DocumentFragment;
global.console = console;

// Mock Lit framework
global.window.LitElement = class LitElement extends dom.window.HTMLElement {
  static properties = {};
  static styles = '';
  constructor() {
    super();
    this.render = () => '';
  }
  connectedCallback() {}
  attributeChangedCallback() {}
};

// Mock Iconify icon element
class MockIconifyIcon extends dom.window.HTMLElement {
  constructor() {
    super();
    this.icon = '';
  }
}
dom.window.customElements.define('iconify-icon', MockIconifyIcon);

// Mock component registration for card components
const mockComponents = [
  'fn-page-title',
  'fn-card-events', 
  'fn-card-birthday',
  'fn-card-tip',
  'fn-card-goal'
];

mockComponents.forEach(tagName => {
  if (!dom.window.customElements.get(tagName)) {
    dom.window.customElements.define(tagName, class extends dom.window.HTMLElement {
      constructor() {
        super();
        this.tagName = tagName;
      }
    });
  }
});

/**
 * Run a single test module
 */
async function runTestModule(testPath, testFunction) {
  try {
    console.log(`\n🧪 Running ${testPath}...`);
    
    const testModule = await import(pathToFileURL(join(ROOT_DIR, testPath)));
    
    if (typeof testModule[testFunction] === 'function') {
      const result = await testModule[testFunction]();
      
      if (result && typeof result === 'object' && 'passed' in result) {
        const { passed, results } = result;
        
        results.forEach(result => {
          const status = result.status === 'PASS' ? '✅' : '❌';
          console.log(`  ${status} ${result.test}`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
          if (result.details) {
            console.log(`     Details: ${result.details}`);
          }
        });
        
        const passCount = results.filter(r => r.status === 'PASS').length;
        console.log(`  📊 Result: ${passed ? '✅ PASSED' : '❌ FAILED'} (${passCount}/${results.length})`);
        
        return { passed, results, module: testPath };
      } else {
        console.log('  ❌ Test function did not return expected result format');
        return { passed: false, results: [], module: testPath };
      }
    } else {
      console.log(`  ❌ Test function '${testFunction}' not found in module`);
      return { passed: false, results: [], module: testPath };
    }
  } catch (error) {
    console.log(`  ❌ Failed to run test: ${error.message}`);
    return { passed: false, results: [], module: testPath, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 FamilyNest Test Runner');
  console.log('========================\n');
  
  const testSuites = [
    { path: 'src/cards/birthdays-test.js', function: 'runBirthdayTests' },
    { path: 'src/ui-contract-test.js', function: 'runUIContractTests' }
  ];
  
  const results = [];
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const suite of testSuites) {
    const result = await runTestModule(suite.path, suite.function);
    results.push(result);
    
    if (result.results) {
      totalTests += result.results.length;
      totalPassed += result.results.filter(r => r.status === 'PASS').length;
    }
  }
  
  console.log('\n📈 Overall Summary');
  console.log('==================');
  
  const allSuitesPassed = results.every(r => r.passed);
  const overallStatus = allSuitesPassed ? '✅ ALL PASSED' : '❌ SOME FAILED';
  
  console.log(`Status: ${overallStatus}`);
  console.log(`Tests: ${totalPassed}/${totalTests} passed`);
  
  results.forEach(result => {
    const suiteStatus = result.passed ? '✅' : '❌';
    console.log(`  ${suiteStatus} ${result.module}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  // Exit with appropriate code
  process.exit(allSuitesPassed ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this file is executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}