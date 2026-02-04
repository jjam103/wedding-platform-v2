#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const logFile = 'e2e-test-results.log';
const previousLog = 'e2e-test-results-post-migration.log';
const originalLog = 'e2e-full-suite-results.log';

function analyzeLog(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Count test results
  const passed = lines.filter(l => l.includes('✓')).length;
  const failed = lines.filter(l => l.includes('✘')).length;
  const skipped = lines.filter(l => l.includes('-  ')).length;

  // Find specific errors
  const errors = {
    pageSlug: lines.filter(l => l.includes('page_slug does not exist')).length,
    api500: lines.filter(l => l.includes('500') && l.includes('API')).length,
    auth: lines.filter(l => l.includes('Auth') && l.includes('✘')).length,
    timeout: lines.filter(l => l.includes('Timeout')).length,
    notFound: lines.filter(l => l.includes('404')).length,
  };

  return { passed, failed, skipped, errors, total: passed + failed + skipped };
}

console.log('\n=== E2E Test Results Analysis ===\n');

// Analyze current run
console.log('📊 Current Run:');
const current = analyzeLog(logFile);
if (current) {
  console.log(`  ✓ Passed: ${current.passed}`);
  console.log(`  ✘ Failed: ${current.failed}`);
  console.log(`  - Skipped: ${current.skipped}`);
  console.log(`  Total: ${current.total}`);
  console.log(`\n  Error Breakdown:`);
  console.log(`    - page_slug errors: ${current.errors.pageSlug}`);
  console.log(`    - API 500 errors: ${current.errors.api500}`);
  console.log(`    - Auth failures: ${current.errors.auth}`);
  console.log(`    - Timeouts: ${current.errors.timeout}`);
  console.log(`    - 404 errors: ${current.errors.notFound}`);
} else {
  console.log('  ⏳ Tests still running or log not found');
}

// Compare with post-migration
console.log('\n📊 Post-Migration Run (for comparison):');
const postMigration = analyzeLog(previousLog);
if (postMigration) {
  console.log(`  ✓ Passed: ${postMigration.passed}`);
  console.log(`  ✘ Failed: ${postMigration.failed}`);
  console.log(`  Total: ${postMigration.total}`);
}

// Compare with original
console.log('\n📊 Original Run (before migration):');
const original = analyzeLog(originalLog);
if (original) {
  console.log(`  ✓ Passed: ${original.passed}`);
  console.log(`  ✘ Failed: ${original.failed}`);
  console.log(`  Total: ${original.total}`);
}

// Calculate improvements
if (current && postMigration && original) {
  console.log('\n📈 Progress:');
  console.log(`  Original → Post-Migration: ${postMigration.passed - original.passed} more tests passing`);
  console.log(`  Post-Migration → Current: ${current.passed - postMigration.passed} more tests passing`);
  console.log(`  Overall improvement: ${current.passed - original.passed} more tests passing`);
  
  const passRate = ((current.passed / current.total) * 100).toFixed(1);
  console.log(`\n  Current pass rate: ${passRate}%`);
}

console.log('\n=== Analysis Complete ===\n');
