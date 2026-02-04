#!/usr/bin/env node

/**
 * Test Performance Analyzer
 * 
 * Analyzes Jest test execution to identify:
 * - Slow test suites
 * - Tests that could benefit from optimization
 * - Worker distribution issues
 * - Potential parallelization improvements
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔍 Analyzing test performance...\n');

// Run tests with verbose output to capture timing
console.log('Running tests with timing information...');
let output;
try {
  output = execSync('npm run test:quick -- --verbose 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
  });
} catch (error) {
  // Jest exits with non-zero on test failures, but we still want the output
  output = error.stdout || error.stderr || '';
}

// Parse test results
const lines = output.split('\n');
const testSuites = [];
let currentSuite = null;
let totalTime = 0;

for (const line of lines) {
  // Match test suite start: PASS/FAIL path/to/test.ts (time)
  const suiteMatch = line.match(/^\s*(PASS|FAIL)\s+(.+?)\s+\((\d+(?:\.\d+)?)\s*m?s\)/);
  if (suiteMatch) {
    const [, status, path, timeStr] = suiteMatch;
    const time = parseFloat(timeStr);
    
    testSuites.push({
      status,
      path,
      time,
    });
    
    totalTime += time;
  }
  
  // Match total time: Time: 118.122 s
  const totalMatch = line.match(/^Time:\s+(\d+(?:\.\d+)?)\s*s/);
  if (totalMatch) {
    totalTime = parseFloat(totalMatch[1]) * 1000; // Convert to ms
  }
}

// Sort by execution time
testSuites.sort((a, b) => b.time - a.time);

// Calculate statistics
const passedSuites = testSuites.filter(s => s.status === 'PASS');
const failedSuites = testSuites.filter(s => s.status === 'FAIL');
const avgTime = testSuites.length > 0 ? totalTime / testSuites.length : 0;
const slowThreshold = avgTime * 2; // 2x average is considered slow

const slowSuites = testSuites.filter(s => s.time > slowThreshold);

// Generate report
const report = {
  summary: {
    totalSuites: testSuites.length,
    passedSuites: passedSuites.length,
    failedSuites: failedSuites.length,
    totalTime: `${(totalTime / 1000).toFixed(2)}s`,
    avgTimePerSuite: `${avgTime.toFixed(2)}ms`,
    slowThreshold: `${slowThreshold.toFixed(2)}ms`,
  },
  slowestSuites: testSuites.slice(0, 20).map(s => ({
    path: s.path,
    time: `${s.time.toFixed(2)}ms`,
    status: s.status,
  })),
  slowSuites: slowSuites.map(s => ({
    path: s.path,
    time: `${s.time.toFixed(2)}ms`,
    timesSlowerThanAvg: (s.time / avgTime).toFixed(1),
  })),
  recommendations: [],
};

// Generate recommendations
if (slowSuites.length > 0) {
  report.recommendations.push({
    type: 'optimization',
    message: `${slowSuites.length} test suites are significantly slower than average`,
    action: 'Consider optimizing these tests or splitting them into smaller suites',
  });
}

if (failedSuites.length > 0) {
  report.recommendations.push({
    type: 'failures',
    message: `${failedSuites.length} test suites failed`,
    action: 'Fix failing tests to improve overall execution time',
  });
}

const integrationTests = testSuites.filter(s => s.path.includes('integration'));
if (integrationTests.length > 0) {
  const avgIntegrationTime = integrationTests.reduce((sum, s) => sum + s.time, 0) / integrationTests.length;
  report.recommendations.push({
    type: 'integration',
    message: `Integration tests average ${avgIntegrationTime.toFixed(2)}ms`,
    action: 'Consider mocking external dependencies to speed up integration tests',
  });
}

// Print report
console.log('\n📊 Test Performance Report\n');
console.log('Summary:');
console.log(`  Total Suites: ${report.summary.totalSuites}`);
console.log(`  Passed: ${report.summary.passedSuites}`);
console.log(`  Failed: ${report.summary.failedSuites}`);
console.log(`  Total Time: ${report.summary.totalTime}`);
console.log(`  Avg Time/Suite: ${report.summary.avgTimePerSuite}`);
console.log(`  Slow Threshold: ${report.summary.slowThreshold}`);

console.log('\n🐌 Slowest Test Suites (Top 20):');
report.slowestSuites.forEach((suite, i) => {
  console.log(`  ${i + 1}. ${suite.path}`);
  console.log(`     Time: ${suite.time} (${suite.status})`);
});

if (report.slowSuites.length > 0) {
  console.log(`\n⚠️  Slow Test Suites (>${report.summary.slowThreshold}):`);
  report.slowSuites.forEach(suite => {
    console.log(`  - ${suite.path}`);
    console.log(`    Time: ${suite.time} (${suite.timesSlowerThanAvg}x slower than average)`);
  });
}

if (report.recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach(rec => {
    console.log(`  [${rec.type.toUpperCase()}] ${rec.message}`);
    console.log(`    → ${rec.action}`);
  });
}

// Save detailed report
const reportPath = 'test-performance-report.json';
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n✅ Detailed report saved to ${reportPath}`);

// Calculate potential improvement
const potentialSavings = slowSuites.reduce((sum, s) => sum + (s.time - avgTime), 0);
if (potentialSavings > 0) {
  console.log(`\n🚀 Potential time savings: ${(potentialSavings / 1000).toFixed(2)}s`);
  console.log(`   If slow tests were optimized to average speed`);
}

console.log('\n✨ Analysis complete!');
