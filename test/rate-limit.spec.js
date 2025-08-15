/**
 * Tests for rate limiting service
 */

import { rateLimiter, checkRateLimit } from '../src/services/rate-limit.js';

export function runRateLimitTests() {
  const results = [];

  // Test basic rate limiting
  let allowed = checkRateLimit('posts:create', 'user123');
  results.push({
    name: 'First request allowed',
    passed: allowed === true,
    info: `First request: ${allowed}`
  });

  // Test rapid requests (should be allowed up to limit)
  let allowedCount = 0;
  for (let i = 0; i < 15; i++) {
    if (checkRateLimit('posts:create', 'user123')) {
      allowedCount++;
    }
  }

  results.push({
    name: 'Rate limiting enforcement',
    passed: allowedCount <= 10, // posts:create has capacity of 10
    info: `Allowed ${allowedCount} out of 15 requests`
  });

  // Test different users have separate limits
  const user456Allowed = checkRateLimit('posts:create', 'user456');
  results.push({
    name: 'Per-user rate limiting',
    passed: user456Allowed === true,
    info: `Different user request: ${user456Allowed}`
  });

  // Test different operation types
  const eventsAllowed = checkRateLimit('events:create', 'user123');
  results.push({
    name: 'Different operation types',
    passed: eventsAllowed === true,
    info: `Events operation: ${eventsAllowed}`
  });

  // Test cleanup doesn't break functionality
  rateLimiter.cleanup();
  const afterCleanup = checkRateLimit('notes:create', 'newuser');
  results.push({
    name: 'Functionality after cleanup',
    passed: afterCleanup === true,
    info: `After cleanup: ${afterCleanup}`
  });

  return results;
}

export function runAndLogRateLimitTests() {
  console.log('\n🧪 Running Rate Limit Tests...');
  const results = runRateLimitTests();
  
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