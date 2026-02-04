#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking content pages in database...\n');

const { data: pages, error } = await supabase
  .from('content_pages')
  .select('id, title, slug, status')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ Error fetching content pages:', error.message);
  process.exit(1);
}

console.log(`📄 CONTENT PAGES:`);
console.log(`  Total: ${pages.length}`);

if (pages.length > 0) {
  console.log(`\n  ✅ Sample content pages:`);
  pages.forEach(page => {
    console.log(`    - ${page.title} (${page.status}) → /custom/${page.slug}`);
  });
} else {
  console.log(`\n  ⚠️  No content pages found in database`);
  console.log(`  💡 Create one at: http://localhost:3000/admin/content-pages`);
}

console.log('');
