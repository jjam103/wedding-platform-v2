#!/usr/bin/env node

/**
 * Compare E2E and Production Database Schemas
 * 
 * This script compares the table structures between the E2E test database
 * and the production database to identify missing tables and schema differences.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load production environment
config({ path: resolve(process.cwd(), '.env.local') });
const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Load E2E environment
config({ path: resolve(process.cwd(), '.env.e2e'), override: true });
const e2eUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const e2eKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !prodKey || !e2eUrl || !e2eKey) {
  console.error('❌ Missing required environment variables');
  console.error('Production URL:', prodUrl ? '✓' : '✗');
  console.error('Production Key:', prodKey ? '✓' : '✗');
  console.error('E2E URL:', e2eUrl ? '✓' : '✗');
  console.error('E2E Key:', e2eKey ? '✓' : '✗');
  process.exit(1);
}

const prodClient = createClient(prodUrl, prodKey);
const e2eClient = createClient(e2eUrl, e2eKey);

console.log('🔍 Comparing database schemas...\n');
console.log('Production DB:', prodUrl);
console.log('E2E DB:', e2eUrl);
console.log('');

async function getTables(client, dbName) {
  const { data, error } = await client.rpc('get_tables_info');
  
  if (error) {
    // Fallback to direct query if RPC doesn't exist
    const { data: tables, error: queryError } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (queryError) {
      console.error(`❌ Error fetching tables from ${dbName}:`, queryError);
      return [];
    }
    
    return tables.map(t => t.table_name);
  }
  
  return data.map(t => t.table_name);
}

async function getTableColumns(client, tableName) {
  const { data, error } = await client
    .rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `
    });
  
  if (error) {
    // Fallback to direct query
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    
    const { data: columns, error: queryError } = await client.rpc('exec_sql', { query });
    
    if (queryError) {
      return [];
    }
    
    return columns;
  }
  
  return data;
}

async function main() {
  try {
    // Get tables from both databases
    console.log('📊 Fetching table lists...\n');
    
    const prodTables = await getTables(prodClient, 'Production');
    const e2eTables = await getTables(e2eClient, 'E2E');
    
    console.log(`Production tables: ${prodTables.length}`);
    console.log(`E2E tables: ${e2eTables.length}\n`);
    
    // Find missing tables in E2E
    const missingInE2E = prodTables.filter(t => !e2eTables.includes(t));
    const extraInE2E = e2eTables.filter(t => !prodTables.includes(t));
    
    if (missingInE2E.length > 0) {
      console.log('❌ Tables missing in E2E database:');
      missingInE2E.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    } else {
      console.log('✅ All production tables exist in E2E database\n');
    }
    
    if (extraInE2E.length > 0) {
      console.log('⚠️  Extra tables in E2E database (not in production):');
      extraInE2E.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }
    
    // Compare common tables
    const commonTables = prodTables.filter(t => e2eTables.includes(t));
    console.log(`📋 Comparing ${commonTables.length} common tables...\n`);
    
    let schemaMatches = true;
    
    for (const table of commonTables) {
      const prodColumns = await getTableColumns(prodClient, table);
      const e2eColumns = await getTableColumns(e2eClient, table);
      
      if (prodColumns.length !== e2eColumns.length) {
        schemaMatches = false;
        console.log(`⚠️  Table '${table}' has different column counts:`);
        console.log(`   Production: ${prodColumns.length} columns`);
        console.log(`   E2E: ${e2eColumns.length} columns\n`);
      }
    }
    
    if (schemaMatches && missingInE2E.length === 0) {
      console.log('✅ Schemas match!\n');
    } else {
      console.log('❌ Schema differences detected\n');
      
      if (missingInE2E.length > 0) {
        console.log('📝 Action required:');
        console.log('   Run migrations on E2E database to add missing tables\n');
      }
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Production tables: ${prodTables.length}`);
    console.log(`E2E tables: ${e2eTables.length}`);
    console.log(`Missing in E2E: ${missingInE2E.length}`);
    console.log(`Extra in E2E: ${extraInE2E.length}`);
    console.log(`Schema matches: ${schemaMatches && missingInE2E.length === 0 ? 'YES' : 'NO'}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    process.exit(missingInE2E.length > 0 || !schemaMatches ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
