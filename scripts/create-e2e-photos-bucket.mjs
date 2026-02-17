#!/usr/bin/env node

/**
 * Create Photos Storage Bucket in E2E Test Database
 * 
 * This script creates the "photos" storage bucket in the E2E test database
 * to support photo upload fallback testing.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPhotosBucket() {
  console.log('📦 Creating photos storage bucket...');
  console.log('   Database:', supabaseUrl);
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return false;
    }
    
    const photosBucket = buckets.find(b => b.name === 'photos');
    
    if (photosBucket) {
      console.log('✅ Photos bucket already exists');
      console.log('   ID:', photosBucket.id);
      console.log('   Public:', photosBucket.public);
      console.log('   Created:', photosBucket.created_at);
      return true;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('photos', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    });
    
    if (error) {
      console.error('❌ Failed to create bucket:', error.message);
      return false;
    }
    
    console.log('✅ Photos bucket created successfully');
    console.log('   Name:', data.name);
    console.log('   Public: true');
    console.log('   Size limit: 10MB');
    console.log('   Allowed types: JPEG, PNG, WebP, GIF');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 E2E Photos Bucket Setup');
  console.log('');
  
  const success = await createPhotosBucket();
  
  console.log('');
  if (success) {
    console.log('✨ Setup complete!');
    process.exit(0);
  } else {
    console.log('❌ Setup failed');
    process.exit(1);
  }
}

main();
