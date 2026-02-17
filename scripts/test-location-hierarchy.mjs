import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLocationHierarchy() {
  console.log('Testing location hierarchy...\n');
  
  // Create a country
  const countryName = `Test Country ${Date.now()}`;
  console.log('1. Creating country:', countryName);
  const { data: country, error: countryError } = await supabase
    .from('locations')
    .insert({ name: countryName, parent_location_id: null })
    .select()
    .single();
  
  if (countryError) {
    console.error('Error creating country:', countryError);
    return;
  }
  console.log('Country created:', country.id);
  
  // Create a region with country as parent
  const regionName = `Test Region ${Date.now()}`;
  console.log('\n2. Creating region:', regionName, 'with parent:', country.id);
  const { data: region, error: regionError } = await supabase
    .from('locations')
    .insert({ name: regionName, parent_location_id: country.id })
    .select()
    .single();
  
  if (regionError) {
    console.error('Error creating region:', regionError);
    return;
  }
  console.log('Region created:', region.id);
  
  // Get all locations
  console.log('\n3. Getting all locations...');
  const { data: allLocations, error: allError } = await supabase
    .from('locations')
    .select('*')
    .order('name');
  
  if (allError) {
    console.error('Error getting locations:', allError);
    return;
  }
  
  console.log('Total locations:', allLocations.length);
  const ourCountry = allLocations.find(l => l.id === country.id);
  const ourRegion = allLocations.find(l => l.id === region.id);
  
  console.log('\nCountry in list:', !!ourCountry);
  console.log('Region in list:', !!ourRegion);
  console.log('Region parent matches country:', ourRegion?.parent_location_id === country.id);
  
  // Build hierarchy manually (same logic as service)
  console.log('\n4. Building hierarchy...');
  const locationMap = new Map();
  const rootLocations = [];
  
  allLocations.forEach(loc => {
    locationMap.set(loc.id, { ...loc, children: [] });
  });
  
  allLocations.forEach(loc => {
    const locWithChildren = locationMap.get(loc.id);
    if (loc.parent_location_id) {
      const parent = locationMap.get(loc.parent_location_id);
      if (parent) {
        parent.children.push(locWithChildren);
      } else {
        rootLocations.push(locWithChildren);
      }
    } else {
      rootLocations.push(locWithChildren);
    }
  });
  
  console.log('Root locations:', rootLocations.length);
  const ourCountryInHierarchy = rootLocations.find(l => l.id === country.id);
  console.log('\nOur country in hierarchy:', !!ourCountryInHierarchy);
  console.log('Our country has children:', ourCountryInHierarchy?.children?.length || 0);
  if (ourCountryInHierarchy?.children?.length > 0) {
    console.log('Children:', ourCountryInHierarchy.children.map(c => c.name));
    console.log('✅ Hierarchy is correct!');
  } else {
    console.log('❌ Hierarchy is broken - country has no children');
  }
}

testLocationHierarchy().catch(console.error);
