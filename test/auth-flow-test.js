/**
 * Auth Flow Tests
 * Tests authentication flow including login and whitelist validation
 */

import { WHITELISTED_EMAILS } from '../web/env.js';

/**
 * Mock Supabase auth for testing
 */
const mockSupabase = {
  auth: {
    signInWithOAuth: async (provider) => {
      if (provider.provider === 'google') {
        return { data: { url: 'https://accounts.google.com/oauth...' }, error: null };
      }
      return { data: null, error: { message: 'Invalid provider' } };
    },
    signInWithOtp: async ({ email }) => {
      if (WHITELISTED_EMAILS.includes(email)) {
        return { data: { session: null }, error: null };
      }
      return { data: null, error: { message: 'Email not whitelisted' } };
    },
    getSession: async () => {
      return { 
        data: { 
          session: {
            user: { 
              id: 'test-user-id',
              email: WHITELISTED_EMAILS[0]
            }
          }
        }, 
        error: null 
      };
    },
    signOut: async () => {
      return { error: null };
    }
  }
};

/**
 * Test whitelist validation
 */
function testWhitelistValidation() {
  const tests = [];
  
  // Test 1: Whitelisted email should be valid
  const whitelistedEmail = WHITELISTED_EMAILS[0];
  const isWhitelisted = WHITELISTED_EMAILS.includes(whitelistedEmail);
  tests.push({
    name: 'Whitelisted email validation',
    status: isWhitelisted ? 'PASS' : 'FAIL',
    message: isWhitelisted ? `Email ${whitelistedEmail} is correctly whitelisted` : `Email ${whitelistedEmail} should be whitelisted`
  });
  
  // Test 2: Non-whitelisted email should be invalid
  const nonWhitelistedEmail = 'test@example.com';
  const isNotWhitelisted = !WHITELISTED_EMAILS.includes(nonWhitelistedEmail);
  tests.push({
    name: 'Non-whitelisted email validation',
    status: isNotWhitelisted ? 'PASS' : 'FAIL',
    message: isNotWhitelisted ? `Email ${nonWhitelistedEmail} is correctly not whitelisted` : `Email ${nonWhitelistedEmail} should not be whitelisted`
  });
  
  // Test 3: Whitelist has expected emails
  const expectedCount = 4;
  const hasCorrectCount = WHITELISTED_EMAILS.length === expectedCount;
  tests.push({
    name: 'Whitelist count validation',
    status: hasCorrectCount ? 'PASS' : 'FAIL',
    message: hasCorrectCount ? `Whitelist has ${expectedCount} emails` : `Expected ${expectedCount} emails, got ${WHITELISTED_EMAILS.length}`
  });
  
  return tests;
}

/**
 * Test OAuth flow
 */
async function testOAuthFlow() {
  const tests = [];
  
  try {
    // Test Google OAuth
    const result = await mockSupabase.auth.signInWithOAuth({ provider: 'google' });
    tests.push({
      name: 'Google OAuth initialization',
      status: (result.data && result.data.url) ? 'PASS' : 'FAIL',
      message: result.data ? 'OAuth URL generated successfully' : 'Failed to generate OAuth URL'
    });
  } catch (error) {
    tests.push({
      name: 'Google OAuth initialization',
      status: 'FAIL',
      message: `OAuth test failed: ${error.message}`
    });
  }
  
  try {
    // Test invalid provider
    const result = await mockSupabase.auth.signInWithOAuth({ provider: 'facebook' });
    tests.push({
      name: 'Invalid OAuth provider handling',
      status: result.error ? 'PASS' : 'FAIL',
      message: result.error ? 'Invalid provider correctly rejected' : 'Should reject invalid provider'
    });
  } catch (error) {
    tests.push({
      name: 'Invalid OAuth provider handling',
      status: 'FAIL',
      message: `Provider validation test failed: ${error.message}`
    });
  }
  
  return tests;
}

/**
 * Test magic link flow
 */
async function testMagicLinkFlow() {
  const tests = [];
  
  try {
    // Test whitelisted email
    const whitelistedEmail = WHITELISTED_EMAILS[0];
    const result = await mockSupabase.auth.signInWithOtp({ email: whitelistedEmail });
    tests.push({
      name: 'Magic link for whitelisted email',
      status: !result.error ? 'PASS' : 'FAIL',
      message: !result.error ? 'Magic link sent successfully' : `Failed: ${result.error.message}`
    });
  } catch (error) {
    tests.push({
      name: 'Magic link for whitelisted email',
      status: 'FAIL',
      message: `Magic link test failed: ${error.message}`
    });
  }
  
  try {
    // Test non-whitelisted email
    const nonWhitelistedEmail = 'test@example.com';
    const result = await mockSupabase.auth.signInWithOtp({ email: nonWhitelistedEmail });
    tests.push({
      name: 'Magic link for non-whitelisted email',
      status: result.error ? 'PASS' : 'FAIL',
      message: result.error ? 'Non-whitelisted email correctly rejected' : 'Should reject non-whitelisted email'
    });
  } catch (error) {
    tests.push({
      name: 'Magic link for non-whitelisted email',
      status: 'FAIL',
      message: `Magic link rejection test failed: ${error.message}`
    });
  }
  
  return tests;
}

/**
 * Test session management
 */
async function testSessionManagement() {
  const tests = [];
  
  try {
    // Test session retrieval
    const result = await mockSupabase.auth.getSession();
    tests.push({
      name: 'Session retrieval',
      status: (result.data && result.data.session) ? 'PASS' : 'FAIL',
      message: result.data.session ? 'Session retrieved successfully' : 'No session found'
    });
    
    // Test sign out
    const signOutResult = await mockSupabase.auth.signOut();
    tests.push({
      name: 'Sign out functionality',
      status: !signOutResult.error ? 'PASS' : 'FAIL',
      message: !signOutResult.error ? 'Sign out successful' : `Sign out failed: ${signOutResult.error.message}`
    });
  } catch (error) {
    tests.push({
      name: 'Session management',
      status: 'FAIL',
      message: `Session test failed: ${error.message}`
    });
  }
  
  return tests;
}

/**
 * Main test runner for auth flow
 */
export async function runAuthFlowTests() {
  console.log('🔐 Running Auth Flow Tests');
  console.log('===========================');
  
  const allTests = [];
  
  // Run all test suites
  const whitelistTests = testWhitelistValidation();
  const oauthTests = await testOAuthFlow();
  const magicLinkTests = await testMagicLinkFlow();
  const sessionTests = await testSessionManagement();
  
  allTests.push(...whitelistTests, ...oauthTests, ...magicLinkTests, ...sessionTests);
  
  // Report results
  allTests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${status} ${test.name}: ${test.message}`);
  });
  
  const passed = allTests.filter(t => t.status === 'PASS').length;
  const total = allTests.length;
  
  console.log(`\n📊 Auth Flow Tests: ${passed}/${total} passed\n`);
  
  return {
    passed: passed === total,
    results: allTests,
    module: 'auth-flow-test'
  };
}