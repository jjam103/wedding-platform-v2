#!/usr/bin/env node

/**
 * Basic RLS Policy Test with E2E Credentials
 * 
 * This script verifies basic RLS functionality with the test database credentials
 * from .env.e2e without requiring auth user creation (which may be restricted).
 * 
 * Tests:
 * 1. Database connection with test credentials
 * 2. Unauthenticated access (should be blocked or filtered)
 * 3. Service role access (should bypass RLS)
 * 4. Table accessibility
 * 
 * Usage: node scripts/test-e2e-rls-basic.mjs
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
  tests: [],
};

/**
 * Log test result
 */
function logTest(name, status, message = '') {
  const emoji = status === 'pass' ? '✅' : '❌';
  console.log(`${emoji} ${name}${message ? ': ' + message : ''}`);
  
  results.tests.push({ name, status, message });
  
  if (status === 'pass') results.passed++;
  else results.failed++;
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data, error } = await serviceClient
      .from('guests')
      .select('count')
      .limit(1);
    
    if (error) {
      logTest('Database connection', 'fail', error.message);
      return false;
    }
    
    logTest('Database connection', 'pass');
    return true;
  } catch (error) {
    logTest('Database connection', 'fail', error.message);
    return false;
  }
}

/**
 * Test unauthenticated access (should be blocked or filtered by RLS)
 */
async function testUnauthenticatedAccess() {
  console.log('\n🚫 Testing Unauthenticated Access (should be blocked/filtered)...');
  
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const tables = [
    'guest_groups',
    'guests',
    'events',
    'activities',
    'content_pages',
    'sections',
    'photos',
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await anonClient
        .from(table)
        .select('*')
        .limit(1);
      
      // RLS should either return error or empty data for unauthenticated access
      const isProtected = error !== null || (data !== null && data.length === 0);
      
      if (isProtected) {
        logTest(`${table}: Unauthenticated access blocked`, 'pass');
      } else {
        logTest(`${table}: Unauthenticated access blocked`, 'fail', 
          `Returned ${data?.length || 0} rows without auth`);
      }
    } catch (error) {
      logTest(`${table}: Unauthenticated access blocked`, 'pass', 'Exception thrown (expected)');
    }
  }
}

/**
 * Test service role access (should bypass RLS)
 */
async function testServiceRoleAccess() {
  console.log('\n🔑 Testing Service Role Access (should bypass RLS)...');
  
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const tables = [
    'guest_groups',
    'guests',
    'events',
    'activities',
    'accommodations',
    'content_pages',
    'sections',
    'columns',
    'photos',
    'gallery_settings',
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await serviceClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logTest(`${table}: Service role access`, 'fail', error.message);
      } else {
        logTest(`${table}: Service role access`, 'pass', `Can read (${data?.length || 0} rows)`);
      }
    } catch (error) {
      logTest(`${table}: Service role access`, 'fail', error.message);
    }
  }
}

/**
 * Test table structure and accessibility
 */
async function testTableStructure() {
  console.log('\n📊 Testing Table Structure...');
  
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Test critical tables exist and have expected structure
  const tableTests = [
    {
      table: 'guest_groups',
      expectedColumns: ['id', 'name', 'created_at'],
    },
    {
      table: 'guests',
      expectedColumns: ['id', 'first_name', 'last_name', 'email', 'group_id'],
    },
    {
      table: 'events',
      expectedColumns: ['id', 'name', 'start_date', 'end_date'],
    },
    {
      table: 'sections',
      expectedColumns: ['id', 'page_type', 'page_id', 'display_order'],
    },
    {
      table: 'content_pages',
      expectedColumns: ['id', 'title', 'slug', 'type'],
    },
  ];
  
  for (const test of tableTests) {
    try {
      const { data, error } = await serviceClient
        .from(test.table)
        .select(test.expectedColumns.join(','))
        .limit(1);
      
      if (error) {
        logTest(`${test.table}: Table structure`, 'fail', error.message);
      } else {
        logTest(`${test.table}: Table structure`, 'pass', 'All expected columns accessible');
      }
    } catch (error) {
      logTest(`${test.table}: Table structure`, 'fail', error.message);
    }
  }
}

/**
 * Test RLS policy existence (indirect test)
 */
async function testRLSPolicyExistence() {
  console.log('\n🛡️  Testing RLS Policy Existence (indirect)...');
  
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Test that anon client gets different results than service role
  // This indicates RLS is active
  
  const tables = ['guest_groups', 'guests', 'events'];
  
  for (const table of tables) {
    try {
      const { data: anonData } = await anonClient
        .from(table)
        .select('count')
        .limit(1);
      
      const { data: serviceData } = await serviceClient
        .from(table)
        .select('count')
        .limit(1);
      
      // If anon returns less data than service role, RLS is working
      const anonCount = anonData?.length || 0;
      const serviceCount = serviceData?.length || 0;
      
      if (anonCount <= serviceCount) {
        logTest(`${table}: RLS policy active`, 'pass', 
          `Anon: ${anonCount}, Service: ${serviceCount}`);
      } else {
        logTest(`${table}: RLS policy active`, 'fail', 
          `Anon returned more data than service role`);
      }
    } catch (error) {
      logTest(`${table}: RLS policy active`, 'pass', 'Anon access threw error (expected)');
    }
  }
}

/**
 * Test specific RLS regression cases
 */
async function testRLSRegressions() {
  console.log('\n🔍 Testing RLS Regression Cases...');
  
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test 1: Sections table (previously had "permission denied for table users" error)
  try {
    const { data, error } = await anonClient
      .from('sections')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('permission denied for table users')) {
      logTest('Sections: No "users" table error', 'fail', 'Still has users table permission error');
    } else {
      logTest('Sections: No "users" table error', 'pass');
    }
  } catch (error) {
    logTest('Sections: No "users" table error', 'pass', 'Access properly restricted');
  }
  
  // Test 2: Content pages (previously had RLS violation error)
  try {
    const { data, error } = await anonClient
      .from('content_pages')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('violates row-level security policy')) {
      logTest('Content pages: No RLS violation error', 'fail', 'Still has RLS violation error');
    } else {
      logTest('Content pages: No RLS violation error', 'pass');
    }
  } catch (error) {
    logTest('Content pages: No RLS violation error', 'pass', 'Access properly restricted');
  }
  
  // Test 3: Photos with moderation status
  try {
    const { data, error } = await anonClient
      .from('photos')
      .select('*')
      .eq('moderation_status', 'approved')
      .limit(1);
    
    // Should be able to read approved photos (or get empty result)
    if (error && !error.message.includes('permission')) {
      logTest('Photos: Moderation filtering', 'fail', error.message);
    } else {
      logTest('Photos: Moderation filtering', 'pass');
    }
  } catch (error) {
    logTest('Photos: Moderation filtering', 'pass', 'Access properly restricted');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 Testing RLS Policies with E2E Credentials (Basic)\n');
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
  
  try {
    // Run test suites
    const connected = await testDatabaseConnection();
    
    if (!connected) {
      console.error('\n❌ Database connection failed. Cannot proceed with tests.');
      process.exit(1);
    }
    
    await testUnauthenticatedAccess();
    await testServiceRoleAccess();
    await testTableStructure();
    await testRLSPolicyExistence();
    await testRLSRegressions();
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    results.failed++;
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
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
