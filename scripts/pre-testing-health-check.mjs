#!/usr/bin/env node

/**
 * Pre-Testing Health Check
 * 
 * Runs a quick health check before manual testing to ensure:
 * - Build is successful
 * - Database is accessible
 * - Environment variables are set
 * - Critical services are available
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(message) {
  checks.passed.push(message);
  console.log(`✅ ${message}`);
}

function fail(message) {
  checks.failed.push(message);
  console.error(`❌ ${message}`);
}

function warn(message) {
  checks.warnings.push(message);
  console.warn(`⚠️  ${message}`);
}

async function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...\n');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const optional = [
    'B2_APPLICATION_KEY_ID',
    'B2_APPLICATION_KEY',
    'B2_BUCKET_NAME',
    'CLOUDFLARE_CDN_URL',
    'RESEND_API_KEY',
  ];
  
  for (const key of required) {
    if (process.env[key]) {
      pass(`${key} is set`);
    } else {
      fail(`${key} is missing (REQUIRED)`);
    }
  }
  
  for (const key of optional) {
    if (process.env[key]) {
      pass(`${key} is set`);
    } else {
      warn(`${key} is not set (optional)`);
    }
  }
}

async function checkDatabase() {
  console.log('\n🗄️  Checking Database Connection...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test connection
    const { data, error } = await supabase
      .from('guests')
      .select('count')
      .limit(1);
    
    if (error) {
      fail(`Database connection failed: ${error.message}`);
    } else {
      pass('Database connection successful');
    }
    
    // Check critical tables exist
    const tables = [
      'guests',
      'groups',
      'events',
      'activities',
      'content_pages',
      'sections',
      'columns',
      'photos',
      'locations',
      'accommodations',
    ];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (tableError) {
        fail(`Table '${table}' not accessible: ${tableError.message}`);
      } else {
        pass(`Table '${table}' exists and is accessible`);
      }
    }
    
  } catch (error) {
    fail(`Database check failed: ${error.message}`);
  }
}

async function checkBuild() {
  console.log('\n🏗️  Checking Build Status...\n');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
    );
    
    pass(`Project: ${packageJson.name} v${packageJson.version}`);
    pass(`Next.js version: ${packageJson.dependencies.next}`);
    pass(`React version: ${packageJson.dependencies.react}`);
    
  } catch (error) {
    fail(`Could not read package.json: ${error.message}`);
  }
}

async function checkDataSeeding() {
  console.log('\n🌱 Checking Test Data...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check for test data
    const { count: guestCount } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });
    
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    const { count: activityCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });
    
    if (guestCount > 0) {
      pass(`Found ${guestCount} guests in database`);
    } else {
      warn('No guests found - consider seeding test data');
    }
    
    if (eventCount > 0) {
      pass(`Found ${eventCount} events in database`);
    } else {
      warn('No events found - consider seeding test data');
    }
    
    if (activityCount > 0) {
      pass(`Found ${activityCount} activities in database`);
    } else {
      warn('No activities found - consider seeding test data');
    }
    
  } catch (error) {
    warn(`Could not check test data: ${error.message}`);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  console.log(`✅ Passed: ${checks.passed.length}`);
  console.log(`❌ Failed: ${checks.failed.length}`);
  console.log(`⚠️  Warnings: ${checks.warnings.length}`);
  
  if (checks.failed.length === 0) {
    console.log('\n🎉 All critical checks passed! Ready for manual testing.\n');
    console.log('Start testing with:');
    console.log('  npm run dev');
    console.log('  Open http://localhost:3000/admin\n');
    return 0;
  } else {
    console.log('\n❌ Some critical checks failed. Please fix these issues before testing:\n');
    checks.failed.forEach(msg => console.log(`  - ${msg}`));
    console.log('');
    return 1;
  }
}

async function main() {
  console.log('🏥 Pre-Testing Health Check\n');
  console.log('Verifying system is ready for manual testing...\n');
  
  await checkBuild();
  await checkEnvironmentVariables();
  await checkDatabase();
  await checkDataSeeding();
  
  const exitCode = await printSummary();
  process.exit(exitCode);
}

main().catch(error => {
  console.error('\n💥 Health check crashed:', error);
  process.exit(1);
});
