#!/usr/bin/env node

/**
 * Fix RLS Policies for Sections and Content Pages
 * 
 * Issue: RLS policies reference auth.users.role which doesn't exist
 * Solution: Update policies to reference users.role instead
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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
    persistSession: false
  }
});

async function fixSectionsRLS() {
  console.log('🔧 Fixing Sections RLS Policies...\n');

  try {
    // Drop old policies
    console.log('1️⃣  Dropping old policies...');
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "hosts_manage_sections" ON sections;
      DROP POLICY IF EXISTS "guests_view_published_sections" ON sections;
      DROP POLICY IF EXISTS "hosts_manage_columns" ON columns;
      DROP POLICY IF EXISTS "guests_view_published_columns" ON columns;
      DROP POLICY IF EXISTS "hosts_manage_gallery_settings" ON gallery_settings;
      DROP POLICY IF EXISTS "guests_view_published_gallery_settings" ON gallery_settings;
      DROP POLICY IF EXISTS "super_admins_view_versions" ON content_versions;
      DROP POLICY IF EXISTS "hosts_view_versions" ON content_versions;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('   ⚠️  Some policies may not exist (this is OK)');
    } else {
      console.log('   ✅ Old policies dropped');
    }

    // Create new policies with correct table reference
    console.log('\n2️⃣  Creating new policies...');
    
    const createPolicies = `
      -- Sections policies
      CREATE POLICY "hosts_manage_sections"
      ON sections FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );

      CREATE POLICY "guests_view_published_sections"
      ON sections FOR SELECT
      USING (
        (page_type = 'activity' AND EXISTS (
          SELECT 1 FROM activities 
          WHERE id::text = sections.page_id AND status = 'published'
        ))
        OR (page_type = 'event' AND EXISTS (
          SELECT 1 FROM events 
          WHERE id::text = sections.page_id AND status = 'published'
        ))
        OR (page_type = 'accommodation' AND EXISTS (
          SELECT 1 FROM accommodations 
          WHERE id::text = sections.page_id AND status = 'published'
        ))
        OR (page_type = 'room_type' AND EXISTS (
          SELECT 1 FROM room_types 
          WHERE id::text = sections.page_id AND status = 'published'
        ))
        OR page_type = 'custom'
      );

      -- Columns policies
      CREATE POLICY "hosts_manage_columns"
      ON columns FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );

      CREATE POLICY "guests_view_published_columns"
      ON columns FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM sections s
          WHERE s.id = columns.section_id
          AND (
            (s.page_type = 'activity' AND EXISTS (
              SELECT 1 FROM activities 
              WHERE id::text = s.page_id AND status = 'published'
            ))
            OR (s.page_type = 'event' AND EXISTS (
              SELECT 1 FROM events 
              WHERE id::text = s.page_id AND status = 'published'
            ))
            OR (s.page_type = 'accommodation' AND EXISTS (
              SELECT 1 FROM accommodations 
              WHERE id::text = s.page_id AND status = 'published'
            ))
            OR (s.page_type = 'room_type' AND EXISTS (
              SELECT 1 FROM room_types 
              WHERE id::text = s.page_id AND status = 'published'
            ))
            OR s.page_type = 'custom'
          )
        )
      );

      -- Gallery settings policies
      CREATE POLICY "hosts_manage_gallery_settings"
      ON gallery_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );

      CREATE POLICY "guests_view_published_gallery_settings"
      ON gallery_settings FOR SELECT
      USING (
        (page_type = 'activity' AND EXISTS (
          SELECT 1 FROM activities 
          WHERE id::text = gallery_settings.page_id AND status = 'published'
        ))
        OR (page_type = 'event' AND EXISTS (
          SELECT 1 FROM events 
          WHERE id::text = gallery_settings.page_id AND status = 'published'
        ))
        OR (page_type = 'accommodation' AND EXISTS (
          SELECT 1 FROM accommodations 
          WHERE id::text = gallery_settings.page_id AND status = 'published'
        ))
        OR (page_type = 'room_type' AND EXISTS (
          SELECT 1 FROM room_types 
          WHERE id::text = gallery_settings.page_id AND status = 'published'
        ))
        OR page_type IN ('custom', 'memory')
      );

      -- Content versions policies
      CREATE POLICY "hosts_view_versions"
      ON content_versions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );

      CREATE POLICY "system_insert_versions"
      ON content_versions FOR INSERT
      WITH CHECK (true);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.error('   ❌ Error creating policies:', createError.message);
      throw createError;
    }
    
    console.log('   ✅ New policies created');

    console.log('\n✅ Sections RLS policies fixed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error fixing sections RLS:', error.message);
    process.exit(1);
  }
}

async function fixContentPagesRLS() {
  console.log('🔧 Fixing Content Pages RLS Policies...\n');

  try {
    // Check if content_pages table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'content_pages');

    if (!tables || tables.length === 0) {
      console.log('   ℹ️  content_pages table does not exist yet');
      return;
    }

    // Drop old policies
    console.log('1️⃣  Dropping old content_pages policies...');
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
      DROP POLICY IF EXISTS "guests_view_published_content_pages" ON content_pages;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('   ⚠️  Some policies may not exist (this is OK)');
    } else {
      console.log('   ✅ Old policies dropped');
    }

    // Create new policies
    console.log('\n2️⃣  Creating new content_pages policies...');
    
    const createPolicies = `
      CREATE POLICY "hosts_manage_content_pages"
      ON content_pages FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('super_admin', 'host')
        )
      );

      CREATE POLICY "guests_view_published_content_pages"
      ON content_pages FOR SELECT
      USING (status = 'published');
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.error('   ❌ Error creating policies:', createError.message);
      throw createError;
    }
    
    console.log('   ✅ New policies created');

    console.log('\n✅ Content pages RLS policies fixed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error fixing content pages RLS:', error.message);
    process.exit(1);
  }
}

// Run fixes
console.log('═══════════════════════════════════════════════════════');
console.log('  Fix RLS Policies for Sections and Content Pages');
console.log('═══════════════════════════════════════════════════════\n');

await fixSectionsRLS();
await fixContentPagesRLS();

console.log('═══════════════════════════════════════════════════════');
console.log('  All RLS policies fixed!');
console.log('═══════════════════════════════════════════════════════\n');

process.exit(0);
