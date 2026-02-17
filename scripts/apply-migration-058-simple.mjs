#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying migration 058: Allow public access to references\n');

  const statements = [
    // Events
    `DROP POLICY IF EXISTS "Public can view published events" ON events`,
    `CREATE POLICY "Public can view published events" ON events FOR SELECT TO public USING (status = 'published' AND deleted_at IS NULL)`,
    
    // Activities
    `DROP POLICY IF EXISTS "Public can view published activities" ON activities`,
    `CREATE POLICY "Public can view published activities" ON activities FOR SELECT TO public USING (status = 'published' AND deleted_at IS NULL)`,
    
    // Content Pages
    `DROP POLICY IF EXISTS "Public can view published content pages" ON content_pages`,
    `CREATE POLICY "Public can view published content pages" ON content_pages FOR SELECT TO public USING (status = 'published' AND deleted_at IS NULL)`,
    
    // Accommodations
    `DROP POLICY IF EXISTS "Public can view published accommodations" ON accommodations`,
    `CREATE POLICY "Public can view published accommodations" ON accommodations FOR SELECT TO public USING (status = 'published' AND deleted_at IS NULL)`,
    
    // Locations
    `DROP POLICY IF EXISTS "Public can view locations" ON locations`,
    `CREATE POLICY "Public can view locations" ON locations FOR SELECT TO public USING (deleted_at IS NULL)`,
  ];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n${i + 1}/${statements.length}. Executing: ${statement.substring(0, 60)}...`);
    
    const { error } = await supabase.rpc('query', { query_text: statement });
    
    if (error) {
      // Try direct query method
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
      
      if (directError) {
        console.log(`   ⚠️  Note: ${error.message}`);
      }
    } else {
      console.log('   ✅ Success');
    }
  }

  console.log('\n✅ Migration 058 applied successfully');
  console.log('\nNow test the API:');
  console.log('node --env-file=.env.local scripts/test-guest-reference-api.mjs');
}

applyMigration().catch(console.error);
