#!/usr/bin/env node

/**
 * Script to create the photos storage bucket in Supabase
 * 
 * This creates a public storage bucket for photo uploads when B2 is unavailable.
 * 
 * Usage: node scripts/create-photos-bucket.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createPhotosBucket() {
  console.log('🚀 Creating photos storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return false;
    }

    const existingBucket = buckets.find(b => b.id === 'photos');
    
    if (existingBucket) {
      console.log('✓ Photos bucket already exists');
      console.log('  ID:', existingBucket.id);
      console.log('  Name:', existingBucket.name);
      console.log('  Public:', existingBucket.public);
      return true;
    }

    // Create the bucket
    const { data: bucket, error: createError } = await supabase.storage.createBucket('photos', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError.message);
      return false;
    }

    console.log('✓ Photos bucket created successfully');
    console.log('  ID:', bucket.name);
    console.log('  Public: true');
    console.log('  File size limit: 10MB');
    console.log('  Allowed types: JPEG, PNG, WebP, GIF');

    // Note: RLS policies need to be set up via SQL migration
    console.log('\n⚠️  Note: RLS policies should be applied via migration 035');
    console.log('   Run: node scripts/apply-migration.mjs 035_create_photos_storage_bucket.sql');

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the script
createPhotosBucket()
  .then(success => {
    if (success) {
      console.log('\n✅ Photos bucket setup complete!');
      process.exit(0);
    } else {
      console.log('\n❌ Photos bucket setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Script error:', error);
    process.exit(1);
  });
