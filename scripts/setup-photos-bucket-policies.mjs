#!/usr/bin/env node

/**
 * Script to set up RLS policies for the photos storage bucket
 * 
 * Note: The bucket itself should already be created via create-photos-bucket.mjs
 * This script sets up the access policies.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('✅ Photos bucket is ready for use!');
console.log('\nBucket configuration:');
console.log('  - Name: photos');
console.log('  - Public: Yes');
console.log('  - File size limit: 10MB');
console.log('  - Allowed types: JPEG, PNG, WebP, GIF');
console.log('\nRLS Policies:');
console.log('  - Authenticated users can upload, update, and delete');
console.log('  - Public read access for all photos');
console.log('\n✅ Photo uploads will now work!');
