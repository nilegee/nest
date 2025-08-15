/**
 * Tests for event bus system
 */

import { bus, emit, on } from '../src/services/event-bus.js';

export function runEventBusTests() {
  const results = [];

  // Test basic event emission and listening
  let eventReceived = false;
  let eventDetail = null;

  const unsubscribe = on('TEST_EVENT', (event) => {
    eventReceived = true;
    eventDetail = event.detail;
  });

  emit('TEST_EVENT', { message: 'hello' });

  results.push({
    name: 'Event emission and subscription',
    passed: eventReceived && eventDetail?.message === 'hello',
    info: eventReceived ? `Received: ${JSON.stringify(eventDetail)}` : 'No event received'
  });

  // Test unsubscribe
  unsubscribe();
  eventReceived = false;
  emit('TEST_EVENT', { message: 'should not receive' });

  results.push({
    name: 'Event unsubscription',
    passed: !eventReceived,
    info: eventReceived ? 'Event received after unsubscribe' : 'Event correctly blocked'
  });

  // Test multiple listeners
  let listener1Called = false;
  let listener2Called = false;

  const unsub1 = on('MULTI_TEST', () => { listener1Called = true; });
  const unsub2 = on('MULTI_TEST', () => { listener2Called = true; });

  emit('MULTI_TEST');

  results.push({
    name: 'Multiple listeners',
    passed: listener1Called && listener2Called,
    info: `Listener 1: ${listener1Called}, Listener 2: ${listener2Called}`
  });

  unsub1();
  unsub2();

  return results;
}

export function runAndLogEventBusTests() {
  console.log('\n🧪 Running Event Bus Tests...');
  const results = runEventBusTests();
  
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