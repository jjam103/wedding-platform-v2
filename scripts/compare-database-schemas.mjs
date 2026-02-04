#!/usr/bin/env node

/**
 * Database Schema Comparison Tool
 * Compares production and E2E test database schemas to identify differences
 */

// E2E Test Database Schema (olcqaawrpnanioaorfer)
const e2eSchema = [{"table_name":"accommodations","column_name":"id","data_type":"uuid","is_nullable":"NO","column_default":"gen_random_uuid()","ordinal_position":1},{"table_name":"accommodations","column_name":"name","data_type":"text","is_nullable":"NO","column_default":null,"ordinal_position":2},{"table_name":"accommodations","column_name":"location_id","data_type":"uuid","is_nullable":"YES","column_default":null,"ordinal_position":3},{"table_name":"accommodations","column_name":"description","data_type":"text","is_nullable":"YES","column_default":null,"ordinal_position":4},{"table_name":"accommodations","column_name":"address","data_type":"text","is_nullable":"YES","column_default":null,"ordinal_position":5},{"table_name":"accommodations","column_name":"status","data_type":"text","is_nullable":"NO","column_default":"'draft'::text","ordinal_position":6},{"table_name":"accommodations","column_name":"created_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()","ordinal_position":7},{"table_name":"accommodations","column_name":"updated_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()","ordinal_position":8},{"table_name":"accommodations","column_name":"content_sections","data_type":"jsonb","is_nullable":"YES","column_default":"'[]'::jsonb","ordinal_position":9},{"table_name":"accommodations","column_name":"slug","data_type":"text","is_nullable":"YES","column_default":null,"ordinal_position":10},{"table_name":"accommodations","column_name":"event_id","data_type":"uuid","is_nullable":"YES","column_default":null,"ordinal_position":11}];

// Production Database Schema (bwthjirvpdypmbvpsjtl)
const prodSchema = [{"table_name":"accommodations","column_name":"id","data_type":"uuid","is_nullable":"NO","column_default":"gen_random_uuid()","ordinal_position":1},{"table_name":"accommodations","column_name":"name","data_type":"text","is_nullable":"NO","column_default":null,"ordinal_position":2},{"table_name":"accommodations","column_name":"location_id","data_type":"uuid","is_nullable":"YES","column_default":null,"ordinal_position":3},{"table_name":"accommodations","column_name":"description","data_type":"text","is_nullable":"YES","column_default":null,"ordinal_position":4},{"table_name":"accommodations","column_name":"address","data_type":"text","is_nullable":"YES","column_default":null,"ordinal_position":5},{"table_name":"accommodations","column_name":"status","data_type":"text","is_nullable":"NO","column_default":"'draft'::text","ordinal_position":6},{"table_name":"accommodations","column_name":"created_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()","ordinal_position":7},{"table_name":"accommodations","column_name":"updated_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()","ordinal_position":8},{"table_name":"accommodations","column_name":"content_sections","data_type":"jsonb","is_nullable":"YES","column_default":"'[]'::jsonb","ordinal_position":9},{"table_name":"accommodations","column_name":"slug","data_type":"text","is_nullable":"NO","column_default":null,"ordinal_position":10}];

function compareSchemas() {
  console.log('🔍 Database Schema Comparison Report\n');
  console.log('Production DB: bwthjirvpdypmbvpsjtl (destination-wedding-platform)');
  console.log('E2E Test DB:   olcqaawrpnanioaorfer (wedding-platform-test)\n');
  console.log('='.repeat(80) + '\n');

  // Group by table
  const e2eTables = {};
  const prodTables = {};

  e2eSchema.forEach(col => {
    if (!e2eTables[col.table_name]) e2eTables[col.table_name] = [];
    e2eTables[col.table_name].push(col);
  });

  prodSchema.forEach(col => {
    if (!prodTables[col.table_name]) prodTables[col.table_name] = [];
    prodTables[col.table_name].push(col);
  });

  const allTables = new Set([...Object.keys(e2eTables), ...Object.keys(prodTables)]);
  
  let totalDifferences = 0;
  const differences = [];

  allTables.forEach(tableName => {
    const e2eCols = e2eTables[tableName] || [];
    const prodCols = prodTables[tableName] || [];

    // Check if table exists in both
    if (e2eCols.length === 0) {
      differences.push({
        type: 'MISSING_TABLE_E2E',
        table: tableName,
        message: `❌ Table "${tableName}" exists in PRODUCTION but MISSING in E2E`
      });
      totalDifferences++;
      return;
    }

    if (prodCols.length === 0) {
      differences.push({
        type: 'EXTRA_TABLE_E2E',
        table: tableName,
        message: `⚠️  Table "${tableName}" exists in E2E but NOT in PRODUCTION`
      });
      totalDifferences++;
      return;
    }

    // Compare columns
    const e2eColMap = {};
    const prodColMap = {};

    e2eCols.forEach(col => e2eColMap[col.column_name] = col);
    prodCols.forEach(col => prodColMap[col.column_name] = col);

    const allColumns = new Set([...Object.keys(e2eColMap), ...Object.keys(prodColMap)]);

    allColumns.forEach(colName => {
      const e2eCol = e2eColMap[colName];
      const prodCol = prodColMap[colName];

      if (!e2eCol) {
        differences.push({
          type: 'MISSING_COLUMN_E2E',
          table: tableName,
          column: colName,
          message: `  ❌ Column "${tableName}.${colName}" exists in PRODUCTION but MISSING in E2E`
        });
        totalDifferences++;
        return;
      }

      if (!prodCol) {
        differences.push({
          type: 'EXTRA_COLUMN_E2E',
          table: tableName,
          column: colName,
          message: `  ⚠️  Column "${tableName}.${colName}" exists in E2E but NOT in PRODUCTION`
        });
        totalDifferences++;
        return;
      }

      // Compare column properties
      if (e2eCol.data_type !== prodCol.data_type) {
        differences.push({
          type: 'TYPE_MISMATCH',
          table: tableName,
          column: colName,
          message: `  ⚠️  Column "${tableName}.${colName}" type mismatch: E2E="${e2eCol.data_type}" vs PROD="${prodCol.data_type}"`
        });
        totalDifferences++;
      }

      if (e2eCol.is_nullable !== prodCol.is_nullable) {
        differences.push({
          type: 'NULLABLE_MISMATCH',
          table: tableName,
          column: colName,
          message: `  ⚠️  Column "${tableName}.${colName}" nullable mismatch: E2E="${e2eCol.is_nullable}" vs PROD="${prodCol.is_nullable}"`
        });
        totalDifferences++;
      }

      if (e2eCol.column_default !== prodCol.column_default) {
        differences.push({
          type: 'DEFAULT_MISMATCH',
          table: tableName,
          column: colName,
          message: `  ℹ️  Column "${tableName}.${colName}" default mismatch: E2E="${e2eCol.column_default}" vs PROD="${prodCol.column_default}"`
        });
        // Don't count default mismatches as critical
      }
    });
  });

  // Print results
  if (differences.length === 0) {
    console.log('✅ SCHEMAS ARE IDENTICAL!\n');
    console.log('Both databases have matching table structures and column definitions.\n');
    return;
  }

  console.log(`Found ${totalDifferences} schema differences:\n`);

  // Group by type
  const byType = {
    MISSING_TABLE_E2E: [],
    EXTRA_TABLE_E2E: [],
    MISSING_COLUMN_E2E: [],
    EXTRA_COLUMN_E2E: [],
    TYPE_MISMATCH: [],
    NULLABLE_MISMATCH: [],
    DEFAULT_MISMATCH: []
  };

  differences.forEach(diff => {
    byType[diff.type].push(diff);
  });

  // Print by severity
  if (byType.MISSING_TABLE_E2E.length > 0) {
    console.log('🚨 CRITICAL: Missing Tables in E2E Database');
    console.log('-'.repeat(80));
    byType.MISSING_TABLE_E2E.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.MISSING_COLUMN_E2E.length > 0) {
    console.log('🚨 CRITICAL: Missing Columns in E2E Database');
    console.log('-'.repeat(80));
    byType.MISSING_COLUMN_E2E.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.TYPE_MISMATCH.length > 0) {
    console.log('⚠️  WARNING: Column Type Mismatches');
    console.log('-'.repeat(80));
    byType.TYPE_MISMATCH.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.NULLABLE_MISMATCH.length > 0) {
    console.log('⚠️  WARNING: Nullable Constraint Mismatches');
    console.log('-'.repeat(80));
    byType.NULLABLE_MISMATCH.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.EXTRA_TABLE_E2E.length > 0) {
    console.log('ℹ️  INFO: Extra Tables in E2E Database (not in production)');
    console.log('-'.repeat(80));
    byType.EXTRA_TABLE_E2E.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.EXTRA_COLUMN_E2E.length > 0) {
    console.log('ℹ️  INFO: Extra Columns in E2E Database (not in production)');
    console.log('-'.repeat(80));
    byType.EXTRA_COLUMN_E2E.forEach(d => console.log(d.message));
    console.log('');
  }

  if (byType.DEFAULT_MISMATCH.length > 0) {
    console.log('ℹ️  INFO: Default Value Mismatches (usually not critical)');
    console.log('-'.repeat(80));
    byType.DEFAULT_MISMATCH.forEach(d => console.log(d.message));
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(`\nTotal differences: ${totalDifferences}`);
  console.log('\n💡 Recommendation: Apply missing migrations to E2E database to match production schema.\n');
}

compareSchemas();
