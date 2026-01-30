#!/usr/bin/env node

/**
 * Script to check user role in the users table
 * 
 * Usage:
 *   node scripts/check-user-role.mjs user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const email = process.argv[2] || 'jrnabelsohn@gmail.com';

async function checkUserRole() {
  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`🔍 Looking up user: ${email}\n`);
  
  try {
    // Find the user in auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const authUser = users.users.find(u => u.email === email);
    
    if (!authUser) {
      console.error(`❌ User not found in auth: ${email}`);
      process.exit(1);
    }

    console.log('✅ User found in auth.users!');
    console.log(`   User ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}\n`);

    // Check if users table exists and has this user
    console.log('🔍 Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('❌ Error querying users table:', userError.message);
      console.error('   Code:', userError.code);
      console.error('   Details:', userError.details);
      console.error('   Hint:', userError.hint);
      
      if (userError.code === '42P01') {
        console.log('\n💡 The "users" table does not exist!');
        console.log('   The middleware expects a users table with role column.');
        console.log('   You need to create this table or update the middleware.');
      } else if (userError.code === 'PGRST116') {
        console.log('\n💡 User not found in users table!');
        console.log('   The user exists in auth but not in the users table.');
        console.log('   You need to insert a record for this user.');
      }
      
      process.exit(1);
    }

    if (!userData) {
      console.error('❌ User not found in users table!');
      console.log('\n💡 The user exists in auth.users but not in the users table.');
      console.log('   You need to insert a record:');
      console.log(`   INSERT INTO users (id, email, role) VALUES ('${authUser.id}', '${email}', 'super_admin');`);
      process.exit(1);
    }

    console.log('✅ User found in users table!');
    console.log('   User data:', JSON.stringify(userData, null, 2));
    
    if (userData.role) {
      const allowedRoles = ['super_admin', 'host'];
      if (allowedRoles.includes(userData.role)) {
        console.log(`\n✅ User has admin access! Role: ${userData.role}`);
      } else {
        console.log(`\n⚠️  User role "${userData.role}" is not allowed for admin access`);
        console.log('   Allowed roles: super_admin, host');
        console.log('\n💡 To fix, update the role:');
        console.log(`   UPDATE users SET role = 'super_admin' WHERE id = '${authUser.id}';`);
      }
    } else {
      console.log('\n⚠️  User has no role assigned!');
      console.log('💡 To fix, update the role:');
      console.log(`   UPDATE users SET role = 'super_admin' WHERE id = '${authUser.id}';`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

checkUserRole();
