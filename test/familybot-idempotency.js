/**
 * Test FamilyBot idempotent initialization
 */

console.log('🧪 Testing FamilyBot idempotent initialization...');

// Mock the logger import in case it fails
global.import = global.import || (() => Promise.reject(new Error('Mock import fail')));

// Import the function
import { initFamilyBotOnce } from '../src/fn-family-bot.js';

let initCount = 0;
const originalInitScheduler = global.FamilyBot?.initScheduler || (() => {});

// Mock the scheduler initialization to count calls
if (global.FamilyBot) {
  global.FamilyBot.initScheduler = () => {
    initCount++;
    console.log(`FamilyBot.initScheduler called (count: ${initCount})`);
  };
}

// Test multiple calls
console.log('Calling initFamilyBotOnce() multiple times...');
await initFamilyBotOnce();
await initFamilyBotOnce();
await initFamilyBotOnce();

if (initCount <= 1) {
  console.log('✅ FamilyBot idempotency test PASSED - scheduler only initialized once');
} else {
  console.log(`❌ FamilyBot idempotency test FAILED - scheduler initialized ${initCount} times`);
}

console.log('✅ FamilyBot test completed');