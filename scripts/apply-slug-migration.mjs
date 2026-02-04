#!/usr/bin/env node

/**
 * Apply Slug Migration
 * 
 * Applies the slug columns migration to events and activities tables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying slug migration...\n');
  
  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '038_add_slug_columns_to_events_activities.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded');
  console.log('📝 Executing SQL...\n');
  
  // Execute migration
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTrying alternative approach...\n');
    
    // Try executing in parts
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
      if (stmtError) {
        console.error(`  ❌ Error: ${stmtError.message}`);
      } else {
        console.log('  ✅ Success');
      }
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }
  
  // Verify
  console.log('\n🔍 Verifying migration...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, slug')
    .limit(1);
  
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, slug')
    .limit(1);
  
  if (!eventsError && !activitiesError) {
    console.log('✅ Slug columns exist!');
    console.log('\n📊 Sample data:');
    if (events && events.length > 0) {
      console.log(`  Event: ${events[0].name} → slug: ${events[0].slug || '(null)'}`);
    }
    if (activities && activities.length > 0) {
      console.log(`  Activity: ${activities[0].name} → slug: ${activities[0].slug || '(null)'}`);
    }
  } else {
    console.error('❌ Verification failed');
    if (eventsError) console.error('  Events:', eventsError.message);
    if (activitiesError) console.error('  Activities:', activitiesError.message);
  }
}

applyMigration().catch(console.error);
