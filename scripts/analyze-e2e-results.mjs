#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const results = JSON.parse(readFileSync('test-results/e2e-results.json', 'utf-8'));

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  flaky: 0,
  skipped: 0,
  failures: [],
  flakyTests: []
};

function processSpecs(specs, suitePath = '') {
  for (const spec of specs) {
    for (const test of spec.tests || []) {
      stats.total++;
      
      if (test.status === 'expected') {
        stats.passed++;
      } else if (test.status === 'unexpected') {
        stats.failed++;
        const result = test.results?.[test.results.length - 1];
        stats.failures.push({
          file: spec.file,
          title: spec.title,
          path: suitePath,
          error: result?.errors?.[0]?.message || result?.error?.message || 'Unknown error',
          duration: result?.duration || 0
        });
      } else if (test.status === 'flaky') {
        stats.flaky++;
        stats.flakyTests.push({
          file: spec.file,
          title: spec.title,
          path: suitePath
        });
      } else if (test.status === 'skipped') {
        stats.skipped++;
      }
    }
  }
}

function processSuites(suites, path = '') {
  for (const suite of suites) {
    const suitePath = path ? `${path} > ${suite.title}` : suite.title;
    
    if (suite.specs) {
      processSpecs(suite.specs, suitePath);
    }
    
    if (suite.suites) {
      processSuites(suite.suites, suitePath);
    }
  }
}

processSuites(results.suites);

console.log('\n' + '='.repeat(70));
console.log('E2E TEST RESULTS ANALYSIS');
console.log('='.repeat(70));
console.log(`Total Tests: ${stats.total}`);
console.log(`✅ Passed: ${stats.passed} (${(stats.passed/stats.total*100).toFixed(1)}%)`);
console.log(`❌ Failed: ${stats.failed} (${(stats.failed/stats.total*100).toFixed(1)}%)`);
console.log(`⚠️  Flaky: ${stats.flaky} (${(stats.flaky/stats.total*100).toFixed(1)}%)`);
console.log(`⏭️  Skipped: ${stats.skipped} (${(stats.skipped/stats.total*100).toFixed(1)}%)`);
console.log('='.repeat(70));

// Group failures by pattern
const patterns = {};

for (const failure of stats.failures) {
  let pattern = 'Unknown';
  const error = failure.error.toLowerCase();
  
  if (error.includes('timeout') || error.includes('exceeded')) {
    pattern = 'Timeout';
  } else if (error.includes('locator') || error.includes('not found') || error.includes('not visible')) {
    pattern = 'Element Not Found/Visible';
  } else if (error.includes('expect') && error.includes('tobevisible')) {
    pattern = 'Visibility Assertion';
  } else if (error.includes('expect') && error.includes('tohavetext')) {
    pattern = 'Text Assertion';
  } else if (error.includes('navigation') || error.includes('goto')) {
    pattern = 'Navigation/Routing';
  } else if (error.includes('api') || error.includes('fetch') || error.includes('network')) {
    pattern = 'API/Network';
  } else if (error.includes('click') || error.includes('fill')) {
    pattern = 'Interaction';
  }
  
  if (!patterns[pattern]) {
    patterns[pattern] = [];
  }
  patterns[pattern].push(failure);
}

console.log('\n' + '='.repeat(70));
console.log('FAILURE PATTERNS');
console.log('='.repeat(70));

const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1].length - a[1].length);

for (const [pattern, failures] of sortedPatterns) {
  console.log(`\n${pattern}: ${failures.length} tests`);
  console.log('-'.repeat(70));
  
  // Show first 3 examples
  for (const failure of failures.slice(0, 3)) {
    console.log(`  • ${failure.file}`);
    console.log(`    ${failure.title}`);
    console.log(`    Error: ${failure.error.substring(0, 100)}...`);
  }
  
  if (failures.length > 3) {
    console.log(`  ... and ${failures.length - 3} more`);
  }
}

// Write detailed report
const report = {
  summary: {
    total: stats.total,
    passed: stats.passed,
    failed: stats.failed,
    flaky: stats.flaky,
    skipped: stats.skipped,
    passRate: (stats.passed/stats.total*100).toFixed(1) + '%'
  },
  patterns: Object.fromEntries(
    sortedPatterns.map(([pattern, failures]) => [
      pattern,
      {
        count: failures.length,
        tests: failures
      }
    ])
  ),
  flakyTests: stats.flakyTests
};

writeFileSync('E2E_FAILURE_ANALYSIS_DETAILED.json', JSON.stringify(report, null, 2));
console.log('\n' + '='.repeat(70));
console.log('Detailed analysis written to: E2E_FAILURE_ANALYSIS_DETAILED.json');
console.log('='.repeat(70) + '\n');
