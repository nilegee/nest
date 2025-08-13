/**
 * Unit tests for birthday calculations
 * Tests the nextOccurrence logic with edge cases
 */

import { getNextOccurrence, getUpcomingBirthdays } from './birthdays.js';

/**
 * Test nextOccurrence function with various scenarios
 * @returns {Promise<{passed: boolean, results: Array}>} Test results
 */
export async function runBirthdayTests() {
  const results = [];
  let passed = true;

  // Helper function to create UTC date
  const utcDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

  // Test 1: Birthday today
  try {
    const birthDate = utcDate(1990, 1, 30); // Jan 30, 1990
    const now = utcDate(2024, 1, 30); // Jan 30, 2024 (birthday today)
    const result = getNextOccurrence(birthDate, now);
    
    if (result.nextOccurrence.getUTCFullYear() === 2024 && 
        result.nextOccurrence.getUTCMonth() === 0 && 
        result.nextOccurrence.getUTCDate() === 30 &&
        result.turningAge === 34) {
      results.push({ test: 'Birthday today calculation', status: 'PASS' });
    } else {
      results.push({ test: 'Birthday today calculation', status: 'FAIL', 
        details: `Expected age 34, got ${result.turningAge}` });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Birthday today calculation', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 2: Birthday passed this year
  try {
    const birthDate = utcDate(1990, 1, 30); // Jan 30, 1990
    const now = utcDate(2024, 6, 15); // June 15, 2024 (birthday passed)
    const result = getNextOccurrence(birthDate, now);
    
    if (result.nextOccurrence.getUTCFullYear() === 2025 && 
        result.nextOccurrence.getUTCMonth() === 0 && 
        result.nextOccurrence.getUTCDate() === 30 &&
        result.turningAge === 35) {
      results.push({ test: 'Birthday passed this year', status: 'PASS' });
    } else {
      results.push({ test: 'Birthday passed this year', status: 'FAIL',
        details: `Expected next year (2025) age 35, got year ${result.nextOccurrence.getUTCFullYear()} age ${result.turningAge}` });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Birthday passed this year', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 3: Dec-to-Jan boundary (birthday in January, current date in December)
  try {
    const birthDate = utcDate(1990, 1, 15); // Jan 15, 1990
    const now = utcDate(2024, 12, 20); // Dec 20, 2024
    const result = getNextOccurrence(birthDate, now);
    
    if (result.nextOccurrence.getUTCFullYear() === 2025 && 
        result.nextOccurrence.getUTCMonth() === 0 && 
        result.nextOccurrence.getUTCDate() === 15 &&
        result.turningAge === 35) {
      results.push({ test: 'Dec-to-Jan boundary', status: 'PASS' });
    } else {
      results.push({ test: 'Dec-to-Jan boundary', status: 'FAIL',
        details: `Expected Jan 2025 age 35, got ${result.nextOccurrence.toISOString()} age ${result.turningAge}` });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Dec-to-Jan boundary', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 4: Birthday coming up this year
  try {
    const birthDate = utcDate(1990, 6, 15); // June 15, 1990
    const now = utcDate(2024, 3, 10); // March 10, 2024
    const result = getNextOccurrence(birthDate, now);
    
    if (result.nextOccurrence.getUTCFullYear() === 2024 && 
        result.nextOccurrence.getUTCMonth() === 5 && 
        result.nextOccurrence.getUTCDate() === 15 &&
        result.turningAge === 34) {
      results.push({ test: 'Birthday upcoming this year', status: 'PASS' });
    } else {
      results.push({ test: 'Birthday upcoming this year', status: 'FAIL',
        details: `Expected June 2024 age 34, got ${result.nextOccurrence.toISOString()} age ${result.turningAge}` });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'Birthday upcoming this year', status: 'FAIL', error: error.message });
    passed = false;
  }

  // Test 5: Full getUpcomingBirthdays function
  try {
    const now = utcDate(2024, 6, 15); // June 15, 2024
    const birthdays = getUpcomingBirthdays(now);
    
    if (Array.isArray(birthdays) && birthdays.length === 4) {
      results.push({ test: 'getUpcomingBirthdays returns array', status: 'PASS' });
      
      // Check if sorted by daysUntil
      const isSorted = birthdays.every((birthday, i) => 
        i === 0 || birthday.daysUntil >= birthdays[i - 1].daysUntil
      );
      
      if (isSorted) {
        results.push({ test: 'Birthdays sorted by daysUntil', status: 'PASS' });
      } else {
        results.push({ test: 'Birthdays sorted by daysUntil', status: 'FAIL' });
        passed = false;
      }
      
      // Check if all required fields are present
      const hasRequiredFields = birthdays.every(b => 
        b.name && b.daysUntil !== undefined && b.turningAge !== undefined && 
        b.dateText && b.countdownText && b.avatar
      );
      
      if (hasRequiredFields) {
        results.push({ test: 'All required fields present', status: 'PASS' });
      } else {
        results.push({ test: 'All required fields present', status: 'FAIL' });
        passed = false;
      }
    } else {
      results.push({ test: 'getUpcomingBirthdays returns array', status: 'FAIL' });
      passed = false;
    }
  } catch (error) {
    results.push({ test: 'getUpcomingBirthdays function', status: 'FAIL', error: error.message });
    passed = false;
  }

  return { passed, results };
}

/**
 * Run tests and log results to console
 */
export async function runAndLogBirthdayTests() {
  console.log('🎂 Running Birthday Calculations Tests...\n');
  
  const { passed, results } = await runBirthdayTests();
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  });
  
  console.log(`\n📊 Birthday Tests Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`📈 Tests: ${results.filter(r => r.status === 'PASS').length}/${results.length} passed`);
  
  return { passed, results };
}

// Auto-run tests if loaded directly
if (typeof window !== 'undefined' && window.location?.search?.includes('test=birthdays')) {
  runAndLogBirthdayTests();
}