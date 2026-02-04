#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('Checking table names...\n');

// Check for groups vs guest_groups
const { data: groups, error: groupsError } = await client.from('groups').select('*').limit(1);
console.log('groups table:', groupsError ? `❌ ${groupsError.message}` : '✅ exists');

const { data: guestGroups, error: guestGroupsError } = await client.from('guest_groups').select('*').limit(1);
console.log('guest_groups table:', guestGroupsError ? `❌ ${guestGroupsError.message}` : '✅ exists');

// Check content_pages structure
console.log('\nChecking content_pages columns...');
const { data: pages, error: pagesError } = await client.from('content_pages').select('id, title, slug').limit(1);
console.log('content_pages (id, title, slug):', pagesError ? `❌ ${pagesError.message}` : '✅ accessible');

// Check sections with anon key
console.log('\nChecking sections RLS...');
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: sections, error: sectionsError } = await anonClient.from('sections').select('*').limit(1);
console.log('sections (anon):', sectionsError ? `❌ ${sectionsError.message}` : '✅ accessible');
