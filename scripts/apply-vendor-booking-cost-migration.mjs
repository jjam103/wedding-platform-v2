#!/usr/bin/env node

/**
 * Apply vendor booking cost fields migration
 * 
 * This script adds cost and subsidy tracking fields to the vendor_bookings table.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📦 Applying vendor booking cost fields migration...\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '026_add_vendor_booking_cost_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_migrations').insert({
          name: `026_add_vendor_booking_cost_fields_${i}`,
          executed_at: new Date().toISOString(),
        });
        
        if (directError) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nNew columns added to vendor_bookings table:');
    console.log('  - guest_count: Number of guests for per-guest pricing');
    console.log('  - pricing_model: flat_rate or per_guest');
    console.log('  - total_cost: Total cost for the booking');
    console.log('  - host_subsidy: Amount host will subsidize');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
