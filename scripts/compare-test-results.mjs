#!/usr/bin/env node

import { readFileSync } from 'fs';

/**
 * Parse E2E test log file and extract test results
 * @param {string} logPath - Path to log file
 * @returns {Object} - Test results by test name
 */
function parseTestResults(logPath) {
  const content = readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  
  const results = {
    passed: new Set(),
    failed: new Set(),
    flaky: new Set(),
    skipped: new Set(),
    didNotRun: new Set()
  };
  
  // Parse test result lines
  for (const line of lines) {
    // Match test result lines: ✓ or ✗ or × followed by test info
    const passMatch = line.match(/✓\s+\d+\s+\[chromium\]\s+›\s+(.+?)(?:\s+\(\d+\.?\d*[sm]s?\))?$/);
    const failMatch = line.match(/[✗×]\s+\d+\s+\[chromium\]\s+›\s+(.+?)(?:\s+\(\d+\.?\d*[sm]s?\))?$/);
    
    if (passMatch) {
      const testName = passMatch[1].trim();
      // Check if it's a retry (flaky test that eventually passed)
      if (testName.includes('(retry #')) {
        results.flaky.add(testName.replace(/\s+\(retry #\d+\)/, ''));
      } else {
        results.passed.add(testName);
      }
    } else if (failMatch) {
      const testName = failMatch[1].trim();
      results.failed.add(testName);
    }
  }
  
  // Parse summary line for skipped and did not run
  const summaryMatch = content.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+flaky.*?(\d+)\s+skipped.*?(\d+)\s+did not run/);
  if (summaryMatch) {
    const [, passed, failed, flaky, skipped, didNotRun] = summaryMatch;
    console.log(`Summary: ${passed} passed, ${failed} failed, ${flaky} flaky, ${skipped} skipped, ${didNotRun} did not run`);
  }
  
  return results;
}

/**
 * Compare two test result sets
 */
function compareResults(feb12Results, feb15Results) {
  const regressions = [];
  const improvements = [];
  const stableFailures = [];
  const stablePasses = [];
  
  // Find regressions: passed on Feb 12, failed on Feb 15
  for (const test of feb12Results.passed) {
    if (feb15Results.failed.has(test)) {
      regressions.push(test);
    } else if (feb15Results.passed.has(test)) {
      stablePasses.push(test);
    }
  }
  
  // Find improvements: failed on Feb 12, passed on Feb 15
  for (const test of feb12Results.failed) {
    if (feb15Results.passed.has(test)) {
      improvements.push(test);
    } else if (feb15Results.failed.has(test)) {
      stableFailures.push(test);
    }
  }
  
  // Find new flaky tests
  const newFlaky = [];
  for (const test of feb15Results.flaky) {
    if (!feb12Results.flaky.has(test)) {
      newFlaky.push(test);
    }
  }
  
  // Find resolved flaky tests
  const resolvedFlaky = [];
  for (const test of feb12Results.flaky) {
    if (!feb15Results.flaky.has(test) && feb15Results.passed.has(test)) {
      resolvedFlaky.push(test);
    }
  }
  
  return {
    regressions,
    improvements,
    stableFailures,
    stablePasses,
    newFlaky,
    resolvedFlaky,
    feb12Stats: {
      passed: feb12Results.passed.size,
      failed: feb12Results.failed.size,
      flaky: feb12Results.flaky.size
    },
    feb15Stats: {
      passed: feb15Results.passed.size,
      failed: feb15Results.failed.size,
      flaky: feb15Results.flaky.size
    }
  };
}

// Main execution
const feb12Results = parseTestResults('e2e-test-results-phase1-verification-feb12.log');
const feb15Results = parseTestResults('e2e-production-test-output.log');

const comparison = compareResults(feb12Results, feb15Results);

console.log('\n=== TEST-BY-TEST REGRESSION ANALYSIS ===\n');

console.log(`Feb 12 Results: ${comparison.feb12Stats.passed} passed, ${comparison.feb12Stats.failed} failed, ${comparison.feb12Stats.flaky} flaky`);
console.log(`Feb 15 Results: ${comparison.feb15Stats.passed} passed, ${comparison.feb15Stats.failed} failed, ${comparison.feb15Stats.flaky} flaky\n`);

console.log(`\n🔴 REGRESSIONS (${comparison.regressions.length} tests):`);
console.log('Tests that PASSED on Feb 12 but FAILED on Feb 15:\n');
if (comparison.regressions.length === 0) {
  console.log('✅ NO REGRESSIONS FOUND!\n');
} else {
  comparison.regressions.forEach((test, i) => {
    console.log(`${i + 1}. ${test}`);
  });
}

console.log(`\n\n🟢 IMPROVEMENTS (${comparison.improvements.length} tests):`);
console.log('Tests that FAILED on Feb 12 but PASSED on Feb 15:\n');
if (comparison.improvements.length > 0) {
  comparison.improvements.slice(0, 20).forEach((test, i) => {
    console.log(`${i + 1}. ${test}`);
  });
  if (comparison.improvements.length > 20) {
    console.log(`... and ${comparison.improvements.length - 20} more`);
  }
}

console.log(`\n\n🟡 NEW FLAKY TESTS (${comparison.newFlaky.length} tests):`);
console.log('Tests that became flaky on Feb 15:\n');
if (comparison.newFlaky.length === 0) {
  console.log('✅ NO NEW FLAKY TESTS!\n');
} else {
  comparison.newFlaky.forEach((test, i) => {
    console.log(`${i + 1}. ${test}`);
  });
}

console.log(`\n\n🟢 RESOLVED FLAKY TESTS (${comparison.resolvedFlaky.length} tests):`);
console.log('Tests that were flaky on Feb 12 but stable on Feb 15:\n');
if (comparison.resolvedFlaky.length > 0) {
  comparison.resolvedFlaky.forEach((test, i) => {
    console.log(`${i + 1}. ${test}`);
  });
}

console.log(`\n\n📊 STABLE TESTS:`);
console.log(`- Stable Passes: ${comparison.stablePasses.length} tests`);
console.log(`- Stable Failures: ${comparison.stableFailures.length} tests`);

console.log('\n\n=== SUMMARY ===\n');
if (comparison.regressions.length === 0) {
  console.log('✅ NO REGRESSIONS - Production build is stable or better!');
} else {
  console.log(`⚠️  ${comparison.regressions.length} REGRESSIONS FOUND - Need investigation`);
}

if (comparison.improvements.length > 0) {
  console.log(`✅ ${comparison.improvements.length} IMPROVEMENTS - Tests fixed!`);
}

const netChange = comparison.feb15Stats.passed - comparison.feb12Stats.passed;
console.log(`\nNet Change: ${netChange > 0 ? '+' : ''}${netChange} tests (${comparison.feb12Stats.passed} → ${comparison.feb15Stats.passed})`);
