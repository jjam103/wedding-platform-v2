import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTestData() {
  console.log('🔍 Checking E2E test data...\n');
  
  // Check events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, slug')
    .limit(5);
  
  console.log(`📅 Events: ${events?.length || 0} found`);
  if (events && events.length > 0) {
    events.forEach(e => console.log(`   - ${e.name} (${e.slug})`));
  }
  if (eventsError) console.error('   Error:', eventsError.message);
  
  // Check activities
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, slug')
    .limit(5);
  
  console.log(`\n🎯 Activities: ${activities?.length || 0} found`);
  if (activities && activities.length > 0) {
    activities.forEach(a => console.log(`   - ${a.name} (${a.slug})`));
  }
  if (activitiesError) console.error('   Error:', activitiesError.message);
  
  // Check content pages
  const { data: contentPages, error: contentPagesError } = await supabase
    .from('content_pages')
    .select('id, title, slug')
    .limit(5);
  
  console.log(`\n📄 Content Pages: ${contentPages?.length || 0} found`);
  if (contentPages && contentPages.length > 0) {
    contentPages.forEach(p => console.log(`   - ${p.title} (${p.slug})`));
  }
  if (contentPagesError) console.error('   Error:', contentPagesError.message);
  
  // Check sections
  const { data: sections, error: sectionsError } = await supabase
    .from('sections')
    .select('id, entity_type, entity_id')
    .limit(5);
  
  console.log(`\n📝 Sections: ${sections?.length || 0} found`);
  if (sections && sections.length > 0) {
    sections.forEach(s => console.log(`   - ${s.entity_type} (${s.entity_id})`));
  }
  if (sectionsError) console.error('   Error:', sectionsError.message);
  
  console.log('\n✅ Test data check complete');
}

checkTestData().catch(console.error);
