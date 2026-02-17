#!/usr/bin/env node

/**
 * Verify E2E Database Schema
 * 
 * This script verifies that the E2E database has all required tables
 * by attempting to query each table.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load E2E environment
config({ path: resolve(process.cwd(), '.env.e2e') });

const e2eUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const e2eKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!e2eUrl || !e2eKey) {
  console.error('❌ Missing E2E environment variables');
  process.exit(1);
}

const client = createClient(e2eUrl, e2eKey);

console.log('🔍 Verifying E2E database schema...\n');
console.log('E2E DB:', e2eUrl);
console.log('');

// Expected tables from production database
const expectedTables = [
  'accommodations',
  'activities',
  'audit_logs',
  'columns',
  'content_pages',
  'content_versions',
  'cron_job_logs',
  'email_logs',
  'email_templates',
  'events',
  'gallery_settings',
  'group_members',
  'groups',
  'guests',
  'locations',
  'photos',
  'room_assignments',
  'room_types',
  'rsvp_reminders_sent',
  'rsvps',
  'scheduled_emails',
  'sections',
  'sms_logs',
  'system_settings',
  'transportation_manifests',
  'users',
  'vendor_bookings',
  'vendors',
  'webhook_delivery_logs',
  'webhooks',
];

async function verifyTable(tableName) {
  try {
    const { error } = await client
      .from(tableName)
      .select('*')
      .limit(0);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log(`Checking ${expectedTables.length} expected tables...\n`);
  
  const results = [];
  let missingCount = 0;
  
  for (const table of expectedTables) {
    const result = await verifyTable(table);
    results.push({ table, ...result });
    
    if (result.exists) {
      console.log(`✅ ${table}`);
    } else {
      console.log(`❌ ${table} - ${result.error}`);
      missingCount++;
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total tables checked: ${expectedTables.length}`);
  console.log(`Tables found: ${expectedTables.length - missingCount}`);
  console.log(`Tables missing: ${missingCount}`);
  console.log(`Schema complete: ${missingCount === 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (missingCount > 0) {
    console.log('❌ E2E database schema is incomplete');
    console.log('   Run migrations to add missing tables\n');
    process.exit(1);
  } else {
    console.log('✅ E2E database schema is complete\n');
    process.exit(0);
  }
}

main();
