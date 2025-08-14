/**
 * Debug logging test - verify logger works correctly
 * Tests both DEBUG=true and DEBUG=false scenarios
 */

import { logger } from '../src/utils/logger.js';

console.log('🧪 Testing debug logging functionality...');

const log = logger('debug-test');

// Test in current environment (should respect .env.local DEBUG setting)
console.log('\n=== Testing current DEBUG setting ===');
log.info('This info message respects DEBUG flag');
log.warn('This warning respects DEBUG flag');
log.error('This error always shows');

// Test localStorage override
console.log('\n=== Testing localStorage DEBUG override ===');
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('DEBUG', '1');
  const logOverride = logger('debug-test-override');
  logOverride.info('This should show with localStorage DEBUG=1');
  
  localStorage.removeItem('DEBUG');
  const logNoOverride = logger('debug-test-no-override');
  logNoOverride.info('This respects original DEBUG setting');
} else {
  console.log('localStorage not available in this environment');
}

console.log('\n✅ Debug logging test completed');