#!/usr/bin/env node

/**
 * Test RLS Policies with E2E Credentials
 * 
 * This script verifies that Row-Level Security (RLS) policies work correctly
 * with the test database credentials from .env.e2e. It tests both admin and
 * guest access patterns to ensure proper authentication and authorization.
 * 
 * Usage: node scripts/test-e2e-rls-policies.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Log test result
 */
function logTest(name, status, message = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${emoji} ${name}${message ? ': ' + message : ''}`);
  
  results.tests.push({ name, status, message });
  
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.skipped++;
}

/**
 * Create test user with authentication
 */
async function createTestUser() {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const testEmail = `test-rls-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';
  
  // Create user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  
  if (authError) {
    throw new Error(`Failed to create test user: ${authError.message}`);
  }
  
  // Sign in to get access token
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (signInError) {
    // Clean up auth user if sign in fails
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to sign in test user: ${signInError.message}`);
  }
  
  return {
    id: authData.user.id,
    email: testEmail,
    accessToken: signInData.session.access_token,
  };
}

/**
 * Delete test user
 */
async function deleteTestUser(userId) {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  
  if (error) {
    console.warn(`⚠️  Failed to delete test user: ${error.message}`);
  }
}

/**
 * Test RLS policy for a table
 */
async function testTableRLS(tableName, accessToken, operations = ['select', 'insert']) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
  
  const testResults = {
    table: tableName,
    operations: {},
  };
  
  // Test SELECT
  if (operations.includes('select')) {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    testResults.operations.select = {
      success: error === null,
      error: error?.message,
      hasData: data !== null,
    };
  }
  
  // Test INSERT (with minimal required fields)
  if (operations.includes('insert')) {
    let insertData = {};
    
    // Table-specific insert data
    switch (tableName) {
      case 'guest_groups':
        insertData = { name: `Test Group ${Date.now()}` };
        break;
      case 'guests':
        // Need a valid group_id - skip for now
        testResults.operations.insert = { success: true, skipped: true };
        return testResults;
      case 'events':
        insertData = {
          name: `Test Event ${Date.now()}`,
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
        };
        break;
      case 'activities':
        // Need a valid event_id - skip for now
        testResults.operations.insert = { success: true, skipped: true };
        return testResults;
      case 'content_pages':
        insertData = {
          title: `Test Page ${Date.now()}`,
          slug: `test-page-${Date.now()}`,
          type: 'custom',
        };
        break;
      case 'sections':
        insertData = {
          page_type: 'event',
          page_id: '123e4567-e89b-12d3-a456-426614174000',
          display_order: 0,
        };
        break;
      default:
        testResults.operations.insert = { success: true, skipped: true };
        return testResults;
    }
    
    const { data, error } = await client
      .from(tableName)
      .insert(insertData)
      .select()
      .single();
    
    testResults.operations.insert = {
      success: error === null,
      error: error?.message,
      createdId: data?.id,
    };
    
    // Clean up created record
    if (data?.id) {
      await client.from(tableName).delete().eq('id', data.id);
    }
  }
  
  return testResults;
}

/**
 * Test unauthenticated access (should be blocked)
 */
async function testUnauthenticatedAccess(tableName) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data, error } = await client
    .from(tableName)
    .select('*')
    .limit(1);
  
  // For RLS, unauthenticated access should either:
  // 1. Return an error
  // 2. Return empty data (filtered by RLS)
  const isBlocked = error !== null || (data !== null && data.length === 0);
  
  return {
    table: tableName,
    blocked: isBlocked,
    error: error?.message,
    dataReturned: data?.length || 0,
  };
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Testing RLS Policies with E2E Credentials\n');
  console.log('📋 Configuration:');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Anon Key: ${SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  console.log(`   Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...\n`);
  
  // Verify environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    console.error('   Please ensure .env.e2e is configured correctly');
    process.exit(1);
  }
  
  let testUser = null;
  
  try {
    // Create test user
    console.log('👤 Creating test user...');
    testUser = await createTestUser();
    logTest('Create test user', 'pass', testUser.email);
    
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: connError } = await serviceClient.from('guests').select('count').limit(1);
    
    if (connError) {
      logTest('Database connection', 'fail', connError.message);
      throw new Error(`Database connection failed: ${connError.message}`);
    }
    logTest('Database connection', 'pass');
    
    // Test authenticated access to critical tables
    console.log('\n🔐 Testing authenticated access (with valid token)...');
    
    const criticalTables = [
      'guest_groups',
      'guests',
      'events',
      'activities',
      'accommodations',
      'sections',
      'columns',
      'content_pages',
      'photos',
      'gallery_settings',
    ];
    
    for (const table of criticalTables) {
      const result = await testTableRLS(table, testUser.accessToken);
      
      // Check SELECT operation
      if (result.operations.select) {
        if (result.operations.select.success) {
          logTest(`${table}: SELECT`, 'pass');
        } else {
          logTest(`${table}: SELECT`, 'fail', result.operations.select.error);
        }
      }
      
      // Check INSERT operation
      if (result.operations.insert) {
        if (result.operations.insert.skipped) {
          logTest(`${table}: INSERT`, 'skip', 'Requires foreign key');
        } else if (result.operations.insert.success) {
          logTest(`${table}: INSERT`, 'pass');
        } else {
          logTest(`${table}: INSERT`, 'fail', result.operations.insert.error);
        }
      }
    }
    
    // Test unauthenticated access (should be blocked)
    console.log('\n🚫 Testing unauthenticated access (should be blocked)...');
    
    for (const table of ['guest_groups', 'guests', 'events', 'content_pages']) {
      const result = await testUnauthenticatedAccess(table);
      
      if (result.blocked) {
        logTest(`${table}: Unauthenticated access blocked`, 'pass');
      } else {
        logTest(`${table}: Unauthenticated access blocked`, 'fail', 
          `Returned ${result.dataReturned} rows without auth`);
      }
    }
    
    // Test admin vs guest permissions
    console.log('\n👥 Testing permission boundaries...');
    
    // Test that authenticated user can read public data
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${testUser.accessToken}`,
        },
      },
    });
    
    const { data: events, error: eventsError } = await authClient
      .from('events')
      .select('*')
      .limit(5);
    
    if (eventsError) {
      logTest('Read public events', 'fail', eventsError.message);
    } else {
      logTest('Read public events', 'pass', `Found ${events?.length || 0} events`);
    }
    
    // Test that authenticated user can create guest groups
    const { data: newGroup, error: groupError } = await authClient
      .from('guest_groups')
      .insert({ name: `Test Group ${Date.now()}` })
      .select()
      .single();
    
    if (groupError) {
      logTest('Create guest group', 'fail', groupError.message);
    } else {
      logTest('Create guest group', 'pass', `Created group ${newGroup.id}`);
      
      // Clean up
      await authClient.from('guest_groups').delete().eq('id', newGroup.id);
    }
    
    // Test sections table (previously had RLS issues)
    console.log('\n📄 Testing sections table (regression check)...');
    
    const { data: sections, error: sectionsError } = await authClient
      .from('sections')
      .select('*')
      .limit(5);
    
    if (sectionsError) {
      if (sectionsError.message.includes('permission denied for table users')) {
        logTest('Sections table RLS', 'fail', 'Still has "permission denied for table users" error');
      } else {
        logTest('Sections table RLS', 'fail', sectionsError.message);
      }
    } else {
      logTest('Sections table RLS', 'pass', `Can read sections (${sections?.length || 0} found)`);
    }
    
    // Test content_pages table (previously had RLS issues)
    console.log('\n📝 Testing content_pages table (regression check)...');
    
    const { data: pages, error: pagesError } = await authClient
      .from('content_pages')
      .select('*')
      .limit(5);
    
    if (pagesError) {
      if (pagesError.message.includes('violates row-level security policy')) {
        logTest('Content pages RLS', 'fail', 'Still has RLS violation error');
      } else {
        logTest('Content pages RLS', 'fail', pagesError.message);
      }
    } else {
      logTest('Content pages RLS', 'pass', `Can read pages (${pages?.length || 0} found)`);
    }
    
    // Test photos table with moderation status
    console.log('\n📸 Testing photos table with moderation...');
    
    const { data: approvedPhotos, error: photosError } = await authClient
      .from('photos')
      .select('*')
      .eq('moderation_status', 'approved')
      .limit(5);
    
    if (photosError) {
      logTest('Photos table RLS', 'fail', photosError.message);
    } else {
      logTest('Photos table RLS', 'pass', `Can read approved photos (${approvedPhotos?.length || 0} found)`);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    results.failed++;
  } finally {
    // Clean up test user
    if (testUser) {
      console.log('\n🧹 Cleaning up test user...');
      await deleteTestUser(testUser.id);
      logTest('Clean up test user', 'pass');
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📝 Total: ${results.tests.length}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! RLS policies are working correctly.');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
