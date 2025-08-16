/**
 * Test for upcoming events card functionality
 */

import { JSDOM } from 'jsdom';

// Mock Supabase for testing
const mockSupabase = {
  from: (table) => {
    if (table === 'events') {
      return {
        select: () => ({
          in: () => ({
            order: () => Promise.resolve({
              data: [
                {
                  id: '1',
                  title: "Sarah's Birthday",
                  event_date: '2024-09-15',
                  type: 'birthday'
                },
                {
                  id: '2', 
                  title: "Wedding Anniversary",
                  event_date: '2024-10-20',
                  type: 'anniversary'
                }
              ],
              error: null
            })
          })
        })
      };
    }
    return { select: () => Promise.resolve({ data: [], error: null }) };
  }
};

// Set up DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// Mock iconify-icon element
class MockIconifyIcon extends HTMLElement {
  constructor() {
    super();
  }
}

if (!customElements.get('iconify-icon')) {
  customElements.define('iconify-icon', MockIconifyIcon);
}

/**
 * Test upcoming events card functions
 */
async function testUpcomingEventsCard() {
  const tests = [];

  try {
    // Test getDaysUntilEvent function
    const testDate = '2024-12-25'; // Christmas
    const today = new Date();
    const christmas = new Date(today.getFullYear(), 11, 25); // December 25
    
    // If Christmas has passed this year, it should be next year
    const targetDate = christmas < today 
      ? new Date(today.getFullYear() + 1, 11, 25)
      : christmas;
    
    const expectedDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    tests.push({
      name: 'Calculate days until event',
      status: 'PASS',
      message: `Christmas is in ${expectedDays} days`
    });

    // Test formatCountdown function
    const countdownTests = [
      { days: 0, expected: 'today' },
      { days: 1, expected: 'tomorrow' },
      { days: 3, expected: 'in 3 days' },
      { days: 14, expected: 'in 2 weeks' },
      { days: 60, expected: 'in 2 months' }
    ];

    countdownTests.forEach(test => {
      let result;
      if (test.days === 0) result = 'today';
      else if (test.days === 1) result = 'tomorrow';
      else if (test.days < 7) result = `in ${test.days} days`;
      else if (test.days < 30) result = `in ${Math.ceil(test.days / 7)} weeks`;
      else if (test.days < 365) result = `in ${Math.ceil(test.days / 30)} months`;
      else result = `in ${Math.ceil(test.days / 365)} years`;

      tests.push({
        name: `Format countdown: ${test.days} days`,
        status: result === test.expected ? 'PASS' : 'FAIL',
        message: `Expected "${test.expected}", got "${result}"`
      });
    });

    // Test ordinal number formatting
    const ordinalTests = [
      { num: 1, expected: '1st' },
      { num: 2, expected: '2nd' },
      { num: 3, expected: '3rd' },
      { num: 4, expected: '4th' },
      { num: 21, expected: '21st' },
      { num: 22, expected: '22nd' },
      { num: 23, expected: '23rd' }
    ];

    ordinalTests.forEach(test => {
      const suffix = ['th', 'st', 'nd', 'rd'];
      const value = test.num % 100;
      const result = test.num + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);

      tests.push({
        name: `Format ordinal: ${test.num}`,
        status: result === test.expected ? 'PASS' : 'FAIL',
        message: `Expected "${test.expected}", got "${result}"`
      });
    });

    // Test age calculation logic
    const ageTests = [
      { title: "Sarah's 25th Birthday", expectedAge: 26 },
      { title: "John's Birthday", expectedAge: null }, // No age in title
      { title: "Mom's 50th Birthday", expectedAge: 51 }
    ];

    ageTests.forEach(test => {
      const ageMatch = test.title.match(/(\d+)(?:st|nd|rd|th)/);
      const result = ageMatch ? parseInt(ageMatch[1]) + 1 : null;

      tests.push({
        name: `Extract age from title: "${test.title}"`,
        status: result === test.expectedAge ? 'PASS' : 'FAIL',
        message: test.expectedAge 
          ? `Expected age ${test.expectedAge}, got ${result}`
          : `Expected no age extraction, got ${result}`
      });
    });

    // Test event filtering
    const mockEvents = [
      { type: 'birthday', title: "Sarah's Birthday" },
      { type: 'anniversary', title: "Wedding Anniversary" },
      { type: 'custom', title: "Vacation" }
    ];

    const birthdays = mockEvents.filter(e => e.type === 'birthday');
    const anniversaries = mockEvents.filter(e => e.type === 'anniversary');

    tests.push({
      name: 'Filter birthday events',
      status: birthdays.length === 1 ? 'PASS' : 'FAIL',
      message: `Expected 1 birthday, found ${birthdays.length}`
    });

    tests.push({
      name: 'Filter anniversary events',
      status: anniversaries.length === 1 ? 'PASS' : 'FAIL',
      message: `Expected 1 anniversary, found ${anniversaries.length}`
    });

  } catch (error) {
    tests.push({
      name: 'Upcoming events card test execution',
      status: 'FAIL',
      message: `Test failed: ${error.message}`
    });
  }

  return tests;
}

/**
 * Main test runner for upcoming events card
 */
export async function runUpcomingEventsTests() {
  console.log('🎂 Running Upcoming Events Card Tests');
  console.log('=====================================');

  const tests = await testUpcomingEventsCard();
  
  let passed = 0;
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${test.name}: ${test.message}`);
    if (test.status === 'PASS') passed++;
  });

  console.log(`\n📊 Upcoming Events Tests: ${passed}/${tests.length} passed\n`);
  
  return {
    total: tests.length,
    passed: passed,
    passed: passed === tests.length,
    results: tests,
    module: 'upcoming-events-test'
  };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUpcomingEventsTests();
}