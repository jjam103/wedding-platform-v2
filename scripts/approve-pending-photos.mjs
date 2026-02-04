#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function approvePendingPhotos() {
  console.log('Approving all pending photos...\n');
  
  // Get all pending photos
  const { data: pendingPhotos, error: fetchError } = await supabase
    .from('photos')
    .select('*')
    .eq('moderation_status', 'pending');
  
  if (fetchError) {
    console.error('Error fetching pending photos:', fetchError);
    return;
  }
  
  console.log(`Found ${pendingPhotos.length} pending photos\n`);
  
  if (pendingPhotos.length === 0) {
    console.log('No pending photos to approve');
    return;
  }
  
  // Update all to approved
  const { data: updated, error: updateError } = await supabase
    .from('photos')
    .update({
      moderation_status: 'approved',
      moderated_at: new Date().toISOString(),
    })
    .eq('moderation_status', 'pending')
    .select();
  
  if (updateError) {
    console.error('Error updating photos:', updateError);
    return;
  }
  
  console.log(`✓ Successfully approved ${updated.length} photos\n`);
  
  updated.forEach((photo, index) => {
    console.log(`${index + 1}. ${photo.caption || 'Untitled'} (${photo.id})`);
  });
}

approvePendingPhotos().catch(console.error);
