#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('📊 E2E Test Results Analysis\n');
console.log('=' .repeat(60));

// Read the last run data
const lastRunPath = 'test-results/.last-run.json';
const lastRun = JSON.parse(fs.readFileSync(lastRunPath, 'utf-8'));

// Count test result directories
const testResultsDir = 'test-results';
const allDirs = fs.readdirSync(testResultsDir).filter(f => f !== '.last-run.json');

// Count retries
const retryDirs = allDirs.filter(d => d.includes('-retry'));
const uniqueTests = allDirs.filter(d => !d.includes('-retry'));

const failedTests = lastRun.failedTests || [];
const passedTests = uniqueTests.length - failedTests.length;

console.log(`\n📈 Overall Results:`);
console.log(`   Total Test Executions: ${allDirs.length}`);
console.log(`   Unique Tests: ${uniqueTests.length}`);
console.log(`   ✅ Passed: ${passedTests} (${Math.round(passedTests/uniqueTests.length*100)}%)`);
console.log(`   ❌ Failed: ${failedTests.length} (${Math.round(failedTests.length/uniqueTests.length*100)}%)`);
console.log(`   🔄 Retries: ${retryDirs.length}`);

// Analyze by test file
console.log(`\n📁 Results by Test File:`);
const byFile = {};

allDirs.forEach(dir => {
  const parts = dir.split('-');
  const fileName = parts[0];
  
  if (!byFile[fileName]) {
    byFile[fileName] = { total: 0, retries: 0, failed: 0 };
  }
  
  byFile[fileName].total++;
  if (dir.includes('-retry')) {
    byFile[fileName].retries++;
  }
});

// Count failures by file
failedTests.forEach(testId => {
  const fileName = testId.split('-')[0];
  if (byFile[fileName]) {
    byFile[fileName].failed++;
  }
});

Object.entries(byFile)
  .sort((a, b) => b[1].failed - a[1].failed)
  .forEach(([file, stats]) => {
    const passed = stats.total - stats.retries - stats.failed;
    const passRate = Math.round(passed / (stats.total - stats.retries) * 100);
    const status = passRate >= 90 ? '✅' : passRate >= 70 ? '⚠️' : '❌';
    console.log(`   ${status} ${file}: ${passed}/${stats.total - stats.retries} passed (${passRate}%)`);
  });

// Identify failure patterns from directory names
console.log(`\n🔍 Failure Patterns:`);
const patterns = {
  'Data-T': 0,
  'Respon': 0,
  'Accessib': 0,
  'Form': 0,
  'Navigation': 0,
  'Auth': 0,
};

failedTests.forEach(testId => {
  allDirs.forEach(dir => {
    if (dir.includes(testId)) {
      Object.keys(patterns).forEach(pattern => {
        if (dir.includes(pattern)) {
          patterns[pattern]++;
        }
      });
    }
  });
});

Object.entries(patterns)
  .filter(([_, count]) => count > 0)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pattern, count]) => {
    console.log(`   ${pattern}: ${count} failures`);
  });

console.log(`\n${'='.repeat(60)}`);
console.log(`\n💡 Next Steps:`);
console.log(`   1. Review failed tests in HTML report: http://localhost:9323`);
console.log(`   2. Identify top 3 failure patterns`);
console.log(`   3. Apply pattern-based fixes`);
console.log(`   4. Re-run tests to verify fixes\n`);
