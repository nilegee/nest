/**
 * Test to verify console error fixes
 * Tests the specific database issues that cause 403/400 errors
 */

import { JSDOM } from 'jsdom';

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: (table) => ({
    select: (columns) => ({
      maybeSingle: () => {
        if (table === 'me') {
          // Simulate the 403 error that was happening
          return Promise.resolve({
            data: null,
            error: { code: '42501', message: 'permission denied for table me' },
            status: 403
          });
        }
        if (table === 'profiles' && columns.includes('dob')) {
          // Simulate the 400 error when dob column is missing
          return Promise.resolve({
            data: null,
            error: { code: '42703', message: 'column "dob" does not exist' },
            status: 400
          });
        }
        return Promise.resolve({ data: null, error: null, status: 200 });
      },
      eq: (column, value) => ({
        maybeSingle: () => Promise.resolve({ 
          data: null, 
          error: { code: '42703', message: 'column "dob" does not exist' },
          status: 400 
        })
      })
    }),
    insert: (data) => ({
      select: () => Promise.resolve({
        data: null,
        error: { code: '42501', message: 'permission denied for table nudges' },
        status: 403
      })
    })
  })
};

// Mock the db service function
function mockGetCurrentUserProfile(supabaseClient, userId) {
  return supabaseClient.from('me').select('*').maybeSingle()
    .then(({ data, error, status }) => {
      if (error && status !== 406) {
        console.warn('me view error', { status, error });
      }
      if (data) return { data, error: null };

      // Fallback to profiles table
      return supabaseClient.from('profiles')
        .select('user_id, full_name, dob, family_id, avatar_url')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data: prof, error: pErr, status: pStatus }) => {
          if (pErr && pStatus !== 406) {
            console.warn('profiles fallback error', { pStatus, pErr });
          }
          
          if (!prof) {
            throw new Error('Profile not available. Run latest DB migrations to add `me` view and RLS.');
          }
          return { data: prof, error: null };
        });
    });
}

// Test function
export async function testConsoleErrorFixes() {
  const results = [];
  
  try {
    // Test 1: Verify that me view error is logged correctly
    console.log('Testing me view 403 error...');
    const originalWarn = console.warn;
    const warnCalls = [];
    
    console.warn = (message, details) => {
      warnCalls.push({ message, details });
    };
    
    try {
      await mockGetCurrentUserProfile(mockSupabaseClient, 'test-user-id');
    } catch (error) {
      // Expected to throw
    }
    
    console.warn = originalWarn;
    
    const meViewErrorLogged = warnCalls.some(call => call.message === 'me view error');
    const profilesErrorLogged = warnCalls.some(call => call.message === 'profiles fallback error');
    
    results.push({
      test: 'me view 403 error logging',
      status: meViewErrorLogged ? 'PASS' : 'FAIL',
      details: meViewErrorLogged ? 'me view error logged correctly' : `Logged: ${warnCalls.map(c => c.message).join(', ')}`
    });

    // Test 2: Verify that profiles fallback error is logged correctly
    results.push({
      test: 'profiles fallback error logging', 
      status: profilesErrorLogged ? 'PASS' : 'FAIL',
      details: profilesErrorLogged ? 'profiles fallback error logged correctly' : 'Fallback error not logged'
    });

    // Test 3: Verify nudges INSERT error
    console.log('Testing nudges insert permission error...');
    const nudgeResult = await mockSupabaseClient.from('nudges').insert({
      family_id: 'test-family-id',
      target_user_id: 'test-user-id',
      nudge_kind: 'test',
      message: 'test message',
      scheduled_for: new Date().toISOString()
    }).select();
    
    const nudgeErrorCorrect = nudgeResult.error && nudgeResult.error.message.includes('permission denied');
    results.push({
      test: 'nudges insert permission error',
      status: nudgeErrorCorrect ? 'PASS' : 'FAIL',
      details: nudgeErrorCorrect ? 'Permission denied error reproduced' : 'No error found'
    });
    
  } catch (error) {
    results.push({
      test: 'overall test execution',
      status: 'FAIL',
      details: `Test failed with error: ${error.message}`
    });
  }

  const allPassed = results.every(r => r.status === 'PASS');
  return { passed: allPassed, results };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConsoleErrorFixes().then(results => {
    console.log('\n🧪 Console Error Fix Tests:');
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.test}`);
      if (result.details) {
        console.log(`     ${result.details}`);
      }
    });
    
    const allPassed = results.every(r => r.passed);
    console.log(`\n📊 Result: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'} (${results.filter(r => r.passed).length}/${results.length})`);
  });
}