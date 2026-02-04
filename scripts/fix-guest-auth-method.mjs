#!/usr/bin/env node

/**
 * Fix Guest Auth Method Script
 * 
 * Sets auth_method to 'email_matching' for guests that don't have it set.
 * This is needed for email matching authentication to work.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGuestAuthMethod(email) {
  console.log(`\n🔍 Checking guest: ${email}`);
  
  // 1. Check if guest exists
  const { data: guest, error: fetchError } = await supabase
    .from('guests')
    .select('id, email, auth_method, first_name, last_name')
    .eq('email', email)
    .single();
  
  if (fetchError) {
    console.error(`❌ Error fetching guest:`, fetchError.message);
    return false;
  }
  
  if (!guest) {
    console.error(`❌ Guest not found with email: ${email}`);
    return false;
  }
  
  console.log(`✓ Guest found: ${guest.first_name} ${guest.last_name} (ID: ${guest.id})`);
  console.log(`  Current auth_method: ${guest.auth_method || 'NULL'}`);
  
  // 2. Update auth_method if needed
  if (guest.auth_method === 'email_matching') {
    console.log(`✓ Auth method already set to 'email_matching'`);
    return true;
  }
  
  console.log(`📝 Updating auth_method to 'email_matching'...`);
  
  const { error: updateError } = await supabase
    .from('guests')
    .update({ auth_method: 'email_matching' })
    .eq('id', guest.id);
  
  if (updateError) {
    console.error(`❌ Error updating guest:`, updateError.message);
    return false;
  }
  
  console.log(`✅ Successfully updated auth_method to 'email_matching'`);
  return true;
}

async function fixAllGuests() {
  console.log(`\n🔍 Checking all guests with NULL auth_method...`);
  
  // Get all guests with NULL auth_method
  const { data: guests, error: fetchError } = await supabase
    .from('guests')
    .select('id, email, first_name, last_name, auth_method')
    .is('auth_method', null);
  
  if (fetchError) {
    console.error(`❌ Error fetching guests:`, fetchError.message);
    return false;
  }
  
  if (!guests || guests.length === 0) {
    console.log(`✓ No guests found with NULL auth_method`);
    return true;
  }
  
  console.log(`📝 Found ${guests.length} guest(s) with NULL auth_method`);
  
  // Update all guests
  const { error: updateError } = await supabase
    .from('guests')
    .update({ auth_method: 'email_matching' })
    .is('auth_method', null);
  
  if (updateError) {
    console.error(`❌ Error updating guests:`, updateError.message);
    return false;
  }
  
  console.log(`✅ Successfully updated ${guests.length} guest(s) to 'email_matching'`);
  
  // Show updated guests
  guests.forEach(guest => {
    console.log(`   - ${guest.first_name} ${guest.last_name} (${guest.email})`);
  });
  
  return true;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('🚀 Guest Auth Method Fix Script');
  console.log('================================\n');
  console.log('Usage:');
  console.log('  node scripts/fix-guest-auth-method.mjs <email>  # Fix specific guest');
  console.log('  node scripts/fix-guest-auth-method.mjs --all    # Fix all guests with NULL auth_method');
  console.log('\nExample:');
  console.log('  node scripts/fix-guest-auth-method.mjs jaronabaws@gmail.com');
  process.exit(0);
}

if (args[0] === '--all') {
  fixAllGuests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
} else {
  const email = args[0].toLowerCase();
  fixGuestAuthMethod(email)
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}
