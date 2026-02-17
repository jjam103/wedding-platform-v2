#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking audit_logs schema...\n');
  
  // Try to insert a test record to see what columns exist
  const testRecord = {
    action: 'test_action',
    entity_type: 'test',
    entity_id: '00000000-0000-0000-0000-000000000000',
    details: { test: true },
  };
  
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(testRecord)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error inserting test record:', error.message);
    console.error('Details:', error);
  } else {
    console.log('✅ Successfully inserted test record');
    console.log('Record structure:', JSON.stringify(data, null, 2));
    
    // Clean up
    await supabase.from('audit_logs').delete().eq('id', data.id);
    console.log('\n✅ Test record cleaned up');
  }
}

checkSchema().catch(console.error);
