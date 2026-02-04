#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPhotoVisibility() {
  console.log('Testing photo visibility in PhotoPicker...\n');
  
  // Simulate PhotoPicker query - filter for approved photos
  const { data: approvedPhotos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('❌ Error fetching approved photos:', error);
    return;
  }
  
  console.log(`✓ Found ${approvedPhotos.length} approved photos (visible in PhotoPicker)\n`);
  
  if (approvedPhotos.length === 0) {
    console.log('⚠️  No approved photos found. PhotoPicker will show empty.');
    return;
  }
  
  // Show details
  approvedPhotos.forEach((photo, index) => {
    console.log(`${index + 1}. ${photo.caption || 'Untitled'}`);
    console.log(`   ID: ${photo.id}`);
    console.log(`   Status: ${photo.moderation_status} ✓`);
    console.log(`   Page: ${photo.page_type} (${photo.page_id || 'general'})`);
    console.log(`   Storage: ${photo.storage_type}`);
    console.log('');
  });
  
  // Test by page type
  console.log('Photos by page type:');
  const byType = approvedPhotos.reduce((acc, photo) => {
    acc[photo.page_type] = (acc[photo.page_type] || 0) + 1;
    return acc;
  }, {});
  console.log(byType);
  console.log('');
  
  console.log('✅ All photos are approved and will be visible in PhotoPicker');
}

testPhotoVisibility().catch(console.error);
