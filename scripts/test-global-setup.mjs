#!/usr/bin/env node

/**
 * Test Global Setup Script
 * 
 * Tests the E2E global setup independently to verify it works correctly.
 * This script simulates what Playwright does when running the global setup.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

console.log('\n🧪 Testing E2E Global Setup\n');

async function testGlobalSetup() {
  try {
    // 1. Test database connection
    console.log('📊 Testing database connection...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role to bypass RLS
    );
    
    const { data, error } = await supabase.from('guests').select('count').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    console.log('✅ Database connection successful\n');
    
    // 2. Test server accessibility
    console.log('🌐 Testing server accessibility...');
    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(baseURL);
      if (!response.ok) {
        console.warn(`⚠️  Server returned status ${response.status}`);
        console.warn('   Make sure Next.js dev server is running: npm run dev\n');
      } else {
        console.log('✅ Server is accessible\n');
      }
    } catch (error) {
      console.warn('⚠️  Server not accessible:', error.message);
      console.warn('   Make sure Next.js dev server is running: npm run dev\n');
    }
    
    // 3. Test admin user
    console.log('👤 Testing admin user...');
    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password';
    
    console.log(`   Admin email: ${adminEmail}`);
    console.log(`   Admin password: ${adminPassword.replace(/./g, '*')}\n`);
    
    // Check if admin user exists (using service role key)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: existingUser, error: userError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .eq('email', adminEmail)
      .maybeSingle();
    
    if (userError) {
      console.warn('⚠️  Could not check for admin user:', userError.message);
      console.warn('   Global setup will attempt to create it\n');
    } else if (existingUser) {
      console.log('✅ Admin user already exists\n');
    } else {
      console.log('⚠️  Admin user does not exist');
      console.log('   Global setup will create it automatically\n');
    }
    
    // 4. Check .auth directory
    console.log('📁 Checking .auth directory...');
    const fs = await import('fs');
    const authDir = join(__dirname, '..', '.auth');
    
    if (!fs.existsSync(authDir)) {
      console.log('   Creating .auth directory...');
      fs.mkdirSync(authDir, { recursive: true });
    }
    console.log('✅ .auth directory ready\n');
    
    console.log('✨ Global Setup Test Complete!\n');
    console.log('Next steps:');
    console.log('  1. Ensure Next.js dev server is running: npm run dev');
    console.log('  2. Run E2E tests: npm run test:e2e\n');
    
  } catch (error) {
    console.error('\n❌ Global Setup Test Failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

testGlobalSetup();
