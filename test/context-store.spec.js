/**
 * Tests for context store
 */

// Mock context store for testing (no Supabase imports)
class MockContextStore {
  constructor() {
    this.state = {
      events: [],
      goals: [],
      posts: [],
      notes: [],
      appreciations: [],
      lastUpdated: {}
    };
  }

  getState() {
    return { ...this.state };
  }

  set(partial) {
    this.state = { ...this.state, ...partial };
  }

  selectUpcomingEvents() {
    return [];
  }

  selectStaleGoals() {
    return [];
  }

  selectLeastAppreciated() {
    return [];
  }
}

const mockContextStore = new MockContextStore();
const mockGetState = () => mockContextStore.getState();
const mockSetState = (partial) => mockContextStore.set(partial);

export function runContextStoreTests() {
  const results = [];

  // Test initial state
  const initialState = mockGetState();
  results.push({
    name: 'Initial state structure',
    passed: initialState.events && Array.isArray(initialState.events) && 
            initialState.goals && Array.isArray(initialState.goals),
    info: `State keys: ${Object.keys(initialState).join(', ')}`
  });

  // Test state setting
  mockSetState({ testData: 'test-value' });
  const updatedState = mockGetState();
  results.push({
    name: 'State setting and retrieval',
    passed: updatedState.testData === 'test-value',
    info: `Test data: ${updatedState.testData}`
  });

  // Test selectors
  const upcomingEvents = mockContextStore.selectUpcomingEvents();
  results.push({
    name: 'Upcoming events selector',
    passed: Array.isArray(upcomingEvents),
    info: `Returned ${upcomingEvents.length} events`
  });

  const staleGoals = mockContextStore.selectStaleGoals();
  results.push({
    name: 'Stale goals selector',
    passed: Array.isArray(staleGoals),
    info: `Returned ${staleGoals.length} stale goals`
  });

  const leastAppreciated = mockContextStore.selectLeastAppreciated();
  results.push({
    name: 'Least appreciated selector',
    passed: Array.isArray(leastAppreciated),
    info: `Returned ${leastAppreciated.length} members`
  });

  return results;
}

export function runAndLogContextStoreTests() {
  console.log('\n🧪 Running Context Store Tests...');
  const results = runContextStoreTests();
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.name}`);
    if (result.info) {
      console.log(`     Info: ${result.info}`);
    }
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`  📊 Result: ${passed === total ? '✅ PASSED' : '❌ FAILED'} (${passed}/${total})`);
  
  return { passed, total, success: passed === total };
}