#!/usr/bin/env node

/**
 * Seed Home Page Settings for E2E Database
 * 
 * This script adds the missing home page settings to the system_settings table
 * that are required by the /api/admin/home-page endpoint.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const homePageSettings = [
  {
    key: 'home_page_title',
    value: 'Welcome to Our Wedding',
    description: 'Home page title',
    category: 'home_page',
    is_public: true,
  },
  {
    key: 'home_page_subtitle',
    value: 'Join us in Costa Rica',
    description: 'Home page subtitle',
    category: 'home_page',
    is_public: true,
  },
  {
    key: 'home_page_welcome_message',
    value: '<p>We are excited to celebrate our special day with you in beautiful Costa Rica!</p>',
    description: 'Home page welcome message (rich text)',
    category: 'home_page',
    is_public: true,
  },
  {
    key: 'home_page_hero_image_url',
    value: null,
    description: 'Home page hero image URL',
    category: 'home_page',
    is_public: true,
  },
];

async function seedHomePageSettings() {
  console.log('🌱 Seeding home page settings...\n');

  try {
    // Check if system_settings table exists
    const { data: tables, error: tableError } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);

    if (tableError) {
      console.error('❌ system_settings table does not exist or is not accessible');
      console.error('   Error:', tableError.message);
      console.error('\n💡 Run migration 050_create_system_settings_table.sql first');
      process.exit(1);
    }

    console.log('✓ system_settings table exists\n');

    // Upsert each setting
    for (const setting of homePageSettings) {
      console.log(`📝 Upserting: ${setting.key}`);
      
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(
          {
            ...setting,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      } else {
        console.log(`   ✓ Success: ${data.key} = ${JSON.stringify(data.value)}`);
      }
    }

    console.log('\n✅ Home page settings seeded successfully!\n');

    // Verify settings
    console.log('🔍 Verifying settings...\n');
    const { data: allSettings, error: verifyError } = await supabase
      .from('system_settings')
      .select('key, value, category')
      .eq('category', 'home_page')
      .order('key');

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('Home page settings in database:');
      allSettings.forEach((setting) => {
        console.log(`  • ${setting.key}: ${JSON.stringify(setting.value)}`);
      });
    }

    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

seedHomePageSettings();
