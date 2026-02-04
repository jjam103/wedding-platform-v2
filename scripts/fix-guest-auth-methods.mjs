#!/usr/bin/env node

/**
 * Fix guest auth_method values
 * 
 * Sets all guests with NULL or invalid auth_method to 'email_matching'
 * 
 * Usage: node scripts/fix-guest-auth-methods.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGuestAuthMethods() {
  console.log('🔧 Fixing guest auth_method values...\n');
  
  try {
    // First, check how many guests need fixing
    const { data: needsFixing, error: checkError } = await supabase
      .from('guests')
      .select('id, first_name, last_name, auth_method')
      .or('auth_method.is.null,auth_method.not.in.(email_matching,magic_link)');
    
    if (checkError) {
      console.error('❌ Error checking guests:', checkError.message);
      process.exit(1);
    }
    
    if (!needsFixing || needsFixing.length === 0) {
      console.log('✅ All guests already have valid auth_method values');
      console.log('   No fixes needed!');
      return;
    }
    
    console.log(`📊 Found ${needsFixing.length} guests needing fixes:`);
    needsFixing.forEach(guest => {
      console.log(`   - ${guest.first_name} ${guest.last_name} (${guest.auth_method || 'NULL'})`);
    });
    console.log('');
    
    // Update all guests with NULL or invalid auth_method
    const { data, error } = await supabase
      .from('guests')
      .update({ auth_method: 'email_matching' })
      .or('auth_method.is.null,auth_method.not.in.(email_matching,magic_link)')
      .select('id, first_name, last_name');
    
    if (error) {
      console.error('❌ Error fixing auth methods:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully fixed ${data.length} guest records`);
    console.log('   All guests now have auth_method = "email_matching"');
    console.log('\n✨ Done!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixGuestAuthMethods();
