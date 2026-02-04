#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment
dotenv.config({ path: join(__dirname, '..', '.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseIssues() {
  console.log('\n=== E2E Test Failure Diagnosis ===\n');

  // 1. Check system_settings table
  console.log('1. Checking system_settings table...');
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ system_settings table error:', error.message);
      console.log('   This explains home page API 500 errors');
    } else {
      console.log('✅ system_settings table exists');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 2. Check events table schema
  console.log('\n2. Checking events table schema...');
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, slug, start_date, location_id, deleted_at')
      .limit(1);
    
    if (error) {
      console.error('❌ events table error:', error.message);
      console.log('   Missing columns:', error.details);
    } else {
      console.log('✅ events table has required columns');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 3. Check activities table schema
  console.log('\n3. Checking activities table schema...');
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('id, name, slug, start_time, location_id, deleted_at')
      .limit(1);
    
    if (error) {
      console.error('❌ activities table error:', error.message);
      console.log('   Missing columns:', error.details);
    } else {
      console.log('✅ activities table has required columns');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 4. Check rsvps table with joins
  console.log('\n4. Checking rsvps table with joins...');
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select(`
        *,
        guest:guests(id, first_name, last_name, email),
        event:events(id, name),
        activity:activities(id, name)
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ rsvps join error:', error.message);
      console.log('   This explains RSVP API 500 errors');
    } else {
      console.log('✅ rsvps table joins work correctly');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 5. Check locations table for hierarchy
  console.log('\n5. Checking locations table hierarchy...');
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, parent_location_id')
      .limit(1);
    
    if (error) {
      console.error('❌ locations table error:', error.message);
    } else {
      console.log('✅ locations table has parent_location_id column');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 6. Check photos table
  console.log('\n6. Checking photos table...');
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ photos table error:', error.message);
    } else {
      console.log('✅ photos table exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 7. Check guests table for CSV import/export
  console.log('\n7. Checking guests table schema...');
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ guests table error:', error.message);
    } else {
      console.log('✅ guests table exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 8. Check magic_link_tokens table
  console.log('\n8. Checking magic_link_tokens table...');
  try {
    const { data, error } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ magic_link_tokens table error:', error.message);
      console.log('   This explains authentication test failures');
    } else {
      console.log('✅ magic_link_tokens table exists');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 9. Check admin_users table
  console.log('\n9. Checking admin_users table...');
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ admin_users table error:', error.message);
      console.log('   This explains admin user management test failures');
    } else {
      console.log('✅ admin_users table exists');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n=== Diagnosis Complete ===\n');
}

diagnoseIssues().catch(console.error);
