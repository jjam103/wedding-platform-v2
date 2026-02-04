#!/usr/bin/env node

/**
 * Diagnose Photo Display Issues
 * 
 * This script checks:
 * 1. What URLs are in the database
 * 2. If those URLs are accessible
 * 3. What HTTP status codes they return
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        status: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
          'cf-cache-status': res.headers['cf-cache-status'],
          'x-amz-request-id': res.headers['x-amz-request-id'],
        }
      });
      res.resume(); // Consume response data to free up memory
    });

    req.on('error', (error) => {
      resolve({
        status: 'ERROR',
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        error: 'Request timed out after 5 seconds'
      });
    });
  });
}

async function diagnosePhotos() {
  console.log('🔍 Diagnosing Photo Display Issues\n');

  // Get all photos
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, photo_url, storage_type, moderation_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching photos:', error.message);
    process.exit(1);
  }

  if (!photos || photos.length === 0) {
    console.log('No photos found in database');
    return;
  }

  console.log(`Found ${photos.length} most recent photo(s)\n`);
  console.log('═'.repeat(80));

  for (const photo of photos) {
    console.log(`\nPhoto ID: ${photo.id}`);
    console.log(`Storage: ${photo.storage_type}`);
    console.log(`Status: ${photo.moderation_status}`);
    console.log(`Created: ${new Date(photo.created_at).toLocaleString()}`);
    console.log(`URL: ${photo.photo_url}`);

    // Check URL format
    if (photo.photo_url.includes('/file/')) {
      console.log('⚠️  WARNING: URL contains /file/ path');
    }
    if (photo.photo_url.includes('wedding-photos-2026-jamara') && !photo.photo_url.includes('.s3.')) {
      console.log('⚠️  WARNING: URL contains bucket name in path');
    }

    // Test URL accessibility
    console.log('\nTesting URL accessibility...');
    const result = await testUrl(photo.photo_url);

    if (result.status === 200) {
      console.log('✅ HTTP 200 OK');
      console.log(`   Content-Type: ${result.headers['content-type']}`);
      if (result.headers['cf-cache-status']) {
        console.log(`   CF-Cache-Status: ${result.headers['cf-cache-status']}`);
      }
      if (result.headers['x-amz-request-id']) {
        console.log(`   B2 Request ID: ${result.headers['x-amz-request-id']}`);
      }
    } else if (result.status === 'ERROR') {
      console.log(`❌ ERROR: ${result.error}`);
    } else if (result.status === 'TIMEOUT') {
      console.log(`❌ TIMEOUT: ${result.error}`);
    } else {
      console.log(`❌ HTTP ${result.status}`);
    }

    console.log('─'.repeat(80));
  }

  console.log('\n📊 Summary:');
  const b2Photos = photos.filter(p => p.storage_type === 'b2');
  const supabasePhotos = photos.filter(p => p.storage_type === 'supabase');
  console.log(`  B2 Photos: ${b2Photos.length}`);
  console.log(`  Supabase Photos: ${supabasePhotos.length}`);

  // Test CDN directly
  console.log('\n🧪 Testing CDN directly...');
  const testUrl1 = 'https://cdn.jamara.us/photos/1770094543867-IMG_0629.jpeg';
  console.log(`Testing: ${testUrl1}`);
  const cdnResult = await testUrl(testUrl1);
  if (cdnResult.status === 200) {
    console.log('✅ CDN is working correctly');
  } else {
    console.log(`❌ CDN test failed: HTTP ${cdnResult.status}`);
  }
}

diagnosePhotos().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
