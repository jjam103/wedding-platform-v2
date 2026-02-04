#!/usr/bin/env node

/**
 * Create E2E Admin User
 * 
 * Creates an admin user in the test database for E2E testing.
 * This script should be run once before running E2E tests.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'test-password';

async function createAdminUser() {
  console.log('🚀 Creating E2E Admin User...\n');
  
  // Verify environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }
  
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASSWORD.replace(/./g, '*')}`);
  console.log(`🌐 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
  
  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // List all users to see what exists
    console.log(`🔍 Listing all auth users...`);
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    console.log(`   Found ${allUsers?.users?.length || 0} auth users`);
    
    // Check if our admin user exists
    const existingAuthUser = allUsers?.users?.find(u => u.email === ADMIN_EMAIL);
    
    let userId;
    
    if (existingAuthUser) {
      console.log(`✅ Auth user already exists: ${ADMIN_EMAIL}`);
      console.log(`   User ID: ${existingAuthUser.id}`);
      userId = existingAuthUser.id;
      
      // Update password to ensure it matches
      console.log(`🔄 Updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: ADMIN_PASSWORD }
      );
      
      if (updateError) {
        console.warn(`⚠️  Warning: Could not update password: ${updateError.message}`);
      } else {
        console.log(`✅ Password updated`);
      }
    } else {
      // Create auth user
      console.log(`📝 Creating new auth user...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      
      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }
      
      if (!authData.user) {
        throw new Error('User creation succeeded but no user returned');
      }
      
      userId = authData.user.id;
      console.log(`✅ Auth user created: ${userId}`);
    }
    
    // Check if admin_users record exists
    const { data: existingAdminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (existingAdminUser) {
      console.log(`✅ Admin user record already exists`);
      console.log(`   ID: ${existingAdminUser.id}`);
      console.log(`   Email: ${existingAdminUser.email}`);
      console.log(`   Role: ${existingAdminUser.role}`);
    } else {
      // Create admin_users record
      console.log(`📝 Creating admin_users record...`);
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: ADMIN_EMAIL,
          role: 'owner',
          is_active: true,
        });
      
      if (adminError) {
        throw new Error(`Failed to create admin_users record: ${adminError.message}`);
      }
      
      console.log(`✅ Admin user record created`);
    }
    
    console.log(`\n✨ E2E Admin User Ready!`);
    console.log(`\nYou can now run E2E tests with:`);
    console.log(`  npm run test:e2e`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

createAdminUser();
