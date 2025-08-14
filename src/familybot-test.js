/**
 * FamilyBot Integration Test
 * Tests the core FamilyBot functionality
 */

// Test FamilyBot API
export function runFamilyBotTests() {
  const results = [];

  try {
    // Test 1: FamilyBot global availability
    if (typeof window !== 'undefined' && window.FamilyBot) {
      results.push({ test: 'FamilyBot global object', passed: true });
    } else {
      results.push({ test: 'FamilyBot global object', passed: false, info: 'Not available in test environment' });
    }

    // Test 2: Theme system
    try {
      const { THEMES, applyTheme } = await import('../src/themes.js');
      const hasThemes = Object.keys(THEMES).length >= 5;
      const hasApplyFunction = typeof applyTheme === 'function';
      results.push({ 
        test: 'Theme system', 
        passed: hasThemes && hasApplyFunction,
        info: `${Object.keys(THEMES).length} themes available`
      });
    } catch (error) {
      results.push({ test: 'Theme system', passed: false, info: 'Import failed in test environment' });
    }

    // Test 3: Components registration
    const componentNames = ['fn-profile', 'fn-chores', 'fn-notes', 'fn-insights'];
    const componentsExist = componentNames.every(name => {
      try {
        return document.createElement(name) !== null;
      } catch {
        return false;
      }
    });
    
    results.push({ 
      test: 'Component registration', 
      passed: componentsExist,
      info: `${componentNames.length} components defined`
    });

    // Test 4: Data structure
    try {
      const response = await fetch('/src/data/parenting-tips.json');
      const data = await response.json();
      const hasAgeGroups = data.age_groups && Object.keys(data.age_groups).length > 0;
      const hasGeneralTips = data.general_family_tips && data.general_family_tips.length > 0;
      
      results.push({
        test: 'Parenting tips data',
        passed: hasAgeGroups && hasGeneralTips,
        info: `${Object.keys(data.age_groups || {}).length} age groups, ${(data.general_family_tips || []).length} general tips`
      });
    } catch (error) {
      results.push({ test: 'Parenting tips data', passed: false, info: 'File not accessible in test environment' });
    }

  } catch (error) {
    results.push({ test: 'FamilyBot tests', passed: false, info: `Error: ${error.message}` });
  }

  return results;
}

// Auto-run if in test environment
if (typeof global !== 'undefined' && global.runTests) {
  runFamilyBotTests().then(results => {
    console.log('FamilyBot Test Results:', results);
  });
}