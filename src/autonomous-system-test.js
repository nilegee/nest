// @ts-check
/**
 * Autonomous System Tests - Verify event-driven architecture
 * Tests the autonomous operation of FamilyNest components
 */

/**
 * Run tests for autonomous system functionality
 * @returns {Promise<{passed: boolean, results: Array}>}
 */
export async function runAutonomousSystemTests() {
  const results = [];
  
  // Test 1: Event Bus functionality
  try {
    const { EventBus } = await import('./services/event-bus.js');
    const testBus = new EventBus();
    
    let eventReceived = null;
    testBus.on('TEST_EVENT', (event) => {
      eventReceived = event;
    });
    
    await testBus.emit('TEST_EVENT', { data: 'test' });
    
    results.push({
      test: 'Event Bus - Emit and receive events',
      status: eventReceived && eventReceived.data === 'test' ? 'PASS' : 'FAIL',
      details: eventReceived ? 'Event received correctly' : 'Event not received'
    });
  } catch (error) {
    results.push({
      test: 'Event Bus - Emit and receive events',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 2: Rate Limiter functionality
  try {
    const { rateLimiter } = await import('./services/rate-limit.js');
    
    // First request should succeed
    const firstCheck = rateLimiter.check('test-user', 'test_operation');
    
    // Exhaust the rate limit
    for (let i = 0; i < 10; i++) {
      rateLimiter.check('test-user', 'test_operation');
    }
    
    // This should fail due to rate limiting
    const limitedCheck = rateLimiter.check('test-user', 'test_operation');
    
    results.push({
      test: 'Rate Limiter - Token bucket algorithm',
      status: firstCheck && !limitedCheck ? 'PASS' : 'FAIL',
      details: `First: ${firstCheck}, Limited: ${limitedCheck}`
    });
  } catch (error) {
    results.push({
      test: 'Rate Limiter - Token bucket algorithm',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 3: Context Store functionality
  try {
    const { contextStore } = await import('./services/context-store.js');
    
    let notificationReceived = false;
    const unsubscribe = contextStore.subscribe('testValue', (newValue) => {
      notificationReceived = newValue === 'testData';
    });
    
    contextStore.setState('testValue', 'testData');
    const retrievedValue = contextStore.getState('testValue');
    
    unsubscribe();
    
    results.push({
      test: 'Context Store - State management and subscriptions',
      status: retrievedValue === 'testData' && notificationReceived ? 'PASS' : 'FAIL',
      details: `Value: ${retrievedValue}, Notification: ${notificationReceived}`
    });
  } catch (error) {
    results.push({
      test: 'Context Store - State management and subscriptions',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 4: Activity Logger initialization
  try {
    const { activityLogger } = await import('./services/acts.js');
    const stats = activityLogger.getStats();
    
    results.push({
      test: 'Activity Logger - Initialization and stats',
      status: stats.initialized ? 'PASS' : 'FAIL',
      details: `Initialized: ${stats.initialized}, Buffer size: ${stats.bufferSize}`
    });
  } catch (error) {
    results.push({
      test: 'Activity Logger - Initialization and stats',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 5: DB Call wrapper error handling
  try {
    const { dbCall } = await import('./services/db-call.js');
    
    let errorCaught = false;
    try {
      await dbCall(() => {
        throw new Error('Test error');
      }, { silent: true });
    } catch (error) {
      errorCaught = true;
    }
    
    results.push({
      test: 'DB Call - Error handling wrapper',
      status: errorCaught ? 'PASS' : 'FAIL',
      details: errorCaught ? 'Error properly caught and handled' : 'Error not handled'
    });
  } catch (error) {
    results.push({
      test: 'DB Call - Error handling wrapper',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 6: FamilyBot autonomous initialization
  try {
    // Import FamilyBot - this should auto-initialize
    const { FamilyBot } = await import('./fn-family-bot.js');
    
    // Check if it has the autonomous methods
    const hasAutonomousMethods = typeof FamilyBot.init === 'function' &&
                                typeof FamilyBot.handlePostCreated === 'function';
    
    results.push({
      test: 'FamilyBot - Autonomous initialization',
      status: hasAutonomousMethods ? 'PASS' : 'FAIL',
      details: hasAutonomousMethods ? 'Autonomous methods available' : 'Missing autonomous methods'
    });
  } catch (error) {
    results.push({
      test: 'FamilyBot - Autonomous initialization',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 7: New view components registration
  try {
    const { PlanView } = await import('./views/plan-view.js');
    const { JournalView } = await import('./views/journal-view.js');
    
    const planViewExists = typeof PlanView === 'function';
    const journalViewExists = typeof JournalView === 'function';
    
    results.push({
      test: 'Consolidated Views - Plan and Journal components',
      status: planViewExists && journalViewExists ? 'PASS' : 'FAIL',
      details: `Plan: ${planViewExists}, Journal: ${journalViewExists}`
    });
  } catch (error) {
    results.push({
      test: 'Consolidated Views - Plan and Journal components',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 8: Session timeout functionality
  try {
    const { getActivityInfo, extendSession } = await import('./services/session-store.js');
    
    const activityInfo = getActivityInfo();
    const extensionResult = extendSession();
    
    results.push({
      test: 'Session Management - Activity tracking and timeout',
      status: typeof activityInfo === 'object' ? 'PASS' : 'FAIL',
      details: `Activity info available: ${activityInfo.active !== undefined}`
    });
  } catch (error) {
    results.push({
      test: 'Session Management - Activity tracking and timeout',
      status: 'FAIL',
      error: error.message
    });
  }

  // Calculate overall results
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const totalTests = results.length;
  const allPassed = passedTests === totalTests;

  return {
    passed: allPassed,
    results,
    summary: `${passedTests}/${totalTests} autonomous system tests passed`
  };
}

// Auto-export for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAutonomousSystemTests };
}