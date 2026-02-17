#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

// Read the Playwright HTML report
const reportPath = join(process.cwd(), 'playwright-report', 'index.html');
const html = readFileSync(reportPath, 'utf-8');

// Extract the embedded JSON data
const dataMatch = html.match(/window\.playwrightReportBase64\s*=\s*'([^']+)'/);
if (!dataMatch) {
  console.error('Could not find test data in report');
  process.exit(1);
}

// Decode the base64 data
const jsonData = Buffer.from(dataMatch[1], 'base64').toString('utf-8');
const report = JSON.parse(jsonData);

// Analyze test results
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  flaky: 0,
  skipped: 0,
  failures: []
};

// Process each test file
for (const file of report.files || []) {
  for (const test of file.tests || []) {
    stats.total++;
    
    const status = test.outcome;
    if (status === 'expected') {
      stats.passed++;
    } else if (status === 'unexpected') {
      stats.failed++;
      stats.failures.push({
        file: file.fileId,
        title: test.title,
        path: test.path,
        error: test.results?.[0]?.error?.message || 'Unknown error'
      });
    } else if (status === 'flaky') {
      stats.flaky++;
    } else if (status === 'skipped') {
      stats.skipped++;
    }
  }
}

console.log('E2E Test Results Analysis');
console.log('='.repeat(50));
console.log(`Total Tests: ${stats.total}`);
console.log(`✅ Passed: ${stats.passed} (${(stats.passed/stats.total*100).toFixed(1)}%)`);
console.log(`❌ Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(1)}%)`);
console.log(`⚠️  Flaky: ${stats.flaky} (${(stats.flaky/stats.total*100).toFixed(1)}%)`);
console.log(`⏭️  Skipped: ${stats.skipped} (${(stats.skipped/stats.total*100).toFixed(1)}%)`);
console.log('='.repeat(50));

// Group failures by error pattern
const errorPatterns = {};
for (const failure of stats.failures) {
  // Extract key error patterns
  const error = failure.error;
  let pattern = 'Unknown';
  
  if (error.includes('Timeout') || error.includes('timeout')) {
    pattern = 'Timeout';
  } else if (error.includes('locator') || error.includes('not found')) {
    pattern = 'Element Not Found';
  } else if (error.includes('expect') && error.includes('toBeVisible')) {
    pattern = 'Visibility Assertion';
  } else if (error.includes('expect') && error.includes('toHaveText')) {
    pattern = 'Text Assertion';
  } else if (error.includes('Navigation')) {
    pattern = 'Navigation';
  } else if (error.includes('API') || error.includes('fetch')) {
    pattern = 'API/Network';
  }
  
  if (!errorPatterns[pattern]) {
    errorPatterns[pattern] = [];
  }
  errorPatterns[pattern].push(failure);
}

console.log('\nFailure Patterns:');
console.log('-'.repeat(50));
for (const [pattern, failures] of Object.entries(errorPatterns).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${pattern}: ${failures.length} tests`);
}

// Write detailed failure report
const failureReport = {
  summary: stats,
  patterns: errorPatterns,
  allFailures: stats.failures
};

import { writeFileSync } from 'fs';
writeFileSync('E2E_FAILURE_ANALYSIS.json', JSON.stringify(failureReport, null, 2));
console.log('\nDetailed analysis written to E2E_FAILURE_ANALYSIS.json');
