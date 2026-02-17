#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Applying migration 056: Add owner role to RLS policies\n');
  
  const migration = readFileSync('supabase/migrations/056_add_owner_role_to_rls_policies.sql', 'utf8');
  
  // Extract policy updates
  const policyUpdates = [
    { table: 'content_pages', policy: 'hosts_manage_content_pages' },
    { table: 'events', policy: 'hosts_manage_events' },
    { table: 'activities', policy: 'hosts_manage_activities' },
    { table: 'sections', policy: 'hosts_manage_sections' },
    { table: 'columns', policy: 'hosts_manage_columns' },
    { table: 'guests', policy: 'hosts_access_all_guests' },
    { table: 'guest_groups', policy: 'hosts_manage_guest_groups' },
    { table: 'locations', policy: 'hosts_manage_locations' },
    { table: 'accommodations', policy: 'hosts_manage_accommodations' },
    { table: 'room_types', policy: 'hosts_manage_room_types' },
    { table: 'photos', policy: 'hosts_manage_photos' },
    { table: 'gallery_settings', policy: 'hosts_manage_gallery_settings' },
    { table: 'vendors', policy: 'hosts_manage_vendors' },
    { table: 'email_templates', policy: 'hosts_manage_email_templates' },
    { table: 'email_queue', policy: 'hosts_manage_email_queue' },
    { table: 'system_settings', policy: 'hosts_manage_system_settings' },
    { table: 'users', policy: 'hosts_view_all_users' },
  ];
  
  console.log('Updating RLS policies to accept owner role...\n');
  
  for (const { table, policy } of policyUpdates) {
    console.log(`  Updating ${table}.${policy}...`);
    
    // Drop old policy
    const dropSql = `DROP POLICY IF EXISTS "${policy}" ON ${table}`;
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql });
    
    // Create new policy
    let createSql;
    if (table === 'users' && policy === 'hosts_view_all_users') {
      // SELECT only policy
      createSql = `
        CREATE POLICY "${policy}"
        ON ${table} FOR SELECT
        USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'))
      `;
    } else {
      // FOR ALL policy
      createSql = `
        CREATE POLICY "${policy}"
        ON ${table} FOR ALL
        USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'))
      `;
    }
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createSql });
    
    if (dropError || createError) {
      console.log(`    ⚠️  May need manual application (exec_sql not available)`);
    } else {
      console.log(`    ✅ Updated`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('MIGRATION STATUS');
  console.log('='.repeat(70));
  console.log('If you see warnings above, apply migration manually:');
  console.log('');
  console.log('Option 1: Via psql');
  console.log('  psql $DATABASE_URL < supabase/migrations/056_add_owner_role_to_rls_policies.sql');
  console.log('');
  console.log('Option 2: Via Supabase Dashboard');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Go to SQL Editor');
  console.log('  4. Paste contents of supabase/migrations/056_add_owner_role_to_rls_policies.sql');
  console.log('  5. Run query');
  console.log('');
  console.log('After applying migration, run:');
  console.log('  node scripts/recreate-admin-user.mjs');
}

applyMigration().catch(console.error);
