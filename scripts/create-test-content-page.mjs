#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createContentPage() {
  console.log('🚀 Creating test content page...\n');
  
  // Create a content page
  const { data: page, error } = await supabase
    .from('content_pages')
    .insert({
      title: 'Test Page for E2E',
      slug: `test-page-e2e-${Date.now()}`,
      status: 'published'
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating page:', error);
    process.exit(1);
  }
  
  console.log('✅ Created content page:', page.id);
  console.log('   Title:', page.title);
  console.log('   Slug:', page.slug);
  console.log('');
  
  // Create a section for the page
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .insert({
      page_type: 'custom',
      page_id: page.id,
      display_order: 0
    })
    .select()
    .single();
  
  if (sectionError) {
    console.error('❌ Error creating section:', sectionError);
    process.exit(1);
  }
  
  console.log('✅ Created section:', section.id);
  console.log('');
  
  // Create a column for the section
  const { data: column, error: columnError } = await supabase
    .from('columns')
    .insert({
      section_id: section.id,
      column_number: 1,
      content_type: 'rich_text',
      content_data: {}
    })
    .select()
    .single();
  
  if (columnError) {
    console.error('❌ Error creating column:', columnError);
    process.exit(1);
  }
  
  console.log('✅ Created column:', column.id);
  console.log('');
  console.log('✨ Setup complete!');
  console.log('');
  console.log('Now navigate to: http://localhost:3000/admin/content-pages');
  console.log('You should see the content page with an Edit button!');
  console.log('');
  console.log('Then run the E2E tests:');
  console.log('npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts');
}

createContentPage().catch(console.error);
