/**
 * Tests for database call wrapper
 */

import { dbCall } from '../src/services/db-call.js';
import { bus } from '../src/services/event-bus.js';

export function runDbCallTests() {
  const results = [];
  const events = [];

  // Listen for events during tests
  const unsubscribe = (e) => events.push({ type: 'DB_OK', detail: e.detail });
  const unsubscribeError = (e) => events.push({ type: 'DB_ERROR', detail: e.detail });
  
  bus.addEventListener('DB_OK', unsubscribe);
  bus.addEventListener('DB_ERROR', unsubscribeError);

  // Test successful operation
  async function testSuccess() {
    events.length = 0; // Clear events
    
    const mockOperation = async () => ({ data: 'success' });
    const result = await dbCall(mockOperation, { label: 'test:success' });
    
    const hasSuccessEvent = events.some(e => e.type === 'DB_OK' && e.detail.label === 'test:success');
    
    results.push({
      name: 'Successful database operation',
      passed: result.data === 'success' && hasSuccessEvent,
      info: `Result: ${JSON.stringify(result)}, Events: ${events.length}`
    });
  }

  // Test error handling
  async function testError() {
    events.length = 0; // Clear events
    
    const mockOperation = async () => { throw new Error('Test error'); };
    const result = await dbCall(mockOperation, { label: 'test:error', silent: true });
    
    const hasErrorEvent = events.some(e => e.type === 'DB_ERROR' && e.detail.label === 'test:error');
    
    results.push({
      name: 'Database operation error handling',
      passed: result.error && hasErrorEvent,
      info: `Result: ${JSON.stringify(result)}, Events: ${events.length}`
    });
  }

  // Test without label
  async function testNoLabel() {
    events.length = 0; // Clear events
    
    const mockOperation = async () => ({ data: 'no-label' });
    const result = await dbCall(mockOperation);
    
    const hasSuccessEvent = events.some(e => e.type === 'DB_OK');
    
    results.push({
      name: 'Operation without label',
      passed: result.data === 'no-label' && hasSuccessEvent,
      info: `Result: ${JSON.stringify(result)}, Events: ${events.length}`
    });
  }

  return Promise.all([testSuccess(), testError(), testNoLabel()]).then(() => {
    bus.removeEventListener('DB_OK', unsubscribe);
    bus.removeEventListener('DB_ERROR', unsubscribeError);
    return results;
  });
}

export async function runAndLogDbCallTests() {
  console.log('\n🧪 Running DB Call Tests...');
  const results = await runDbCallTests();
  
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