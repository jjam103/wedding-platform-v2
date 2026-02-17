#!/usr/bin/env node

import fs from 'fs';

const resultsFile = 'test-results/e2e-results.json';
const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

const failures = [];
const flaky = [];

function extractTests(suites) {
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          if (test.status === 'unexpected') {
            const lastResult = test.results[test.results.length - 1];
            failures.push({
              file: spec.file,
              title: spec.title,
              error: lastResult.errors[0]?.message || 'Unknown error',
              stack: lastResult.errors[0]?.stack || '',
              duration: lastResult.duration
            });
          } else if (test.status === 'flaky') {
            flaky.push({
              file: spec.file,
              title: spec.title
            });
          }
        }
      }
    }
    if (suite.suites) {
      extractTests(suite.suites);
    }
  }
}

extractTests(results.suites);

console.log(`\n=== E2E TEST FAILURE ANALYSIS ===\n`);
console.log(`Total Failures: ${failures.length}`);
console.log(`Total Flaky: ${flaky.length}\n`);

// Group by error pattern
const patterns = {};

failures.forEach(failure => {
  let pattern = 'Unknown';
  
  if (failure.error.includes('Timeout') || failure.error.includes('exceeded')) {
    pattern = 'Timeout';
  } else if (failure.error.includes('locator') || failure.error.includes('not found')) {
    pattern = 'Element Not Found';
  } else if (failure.error.includes('expect') || failure.error.includes('Expected')) {
    pattern = 'Assertion Failed';
  } else if (failure.error.includes('navigation') || failure.error.includes('goto')) {
    pattern = 'Navigation Failed';
  } else if (failure.error.includes('click') || failure.error.includes('fill')) {
    pattern = 'Interaction Failed';
  } else if (failure.error.includes('visible') || failure.error.includes('hidden')) {
    pattern = 'Visibility Issue';
  }
  
  if (!patterns[pattern]) {
    patterns[pattern] = [];
  }
  patterns[pattern].push(failure);
});

console.log(`=== FAILURE PATTERNS ===\n`);
Object.entries(patterns)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([pattern, tests]) => {
    console.log(`${pattern}: ${tests.length} tests`);
    tests.slice(0, 3).forEach(test => {
      console.log(`  - ${test.file}: ${test.title}`);
      console.log(`    ${test.error.split('\n')[0].substring(0, 100)}`);
    });
    if (tests.length > 3) {
      console.log(`  ... and ${tests.length - 3} more`);
    }
    console.log('');
  });

// Group by file
const byFile = {};
failures.forEach(failure => {
  if (!byFile[failure.file]) {
    byFile[failure.file] = [];
  }
  byFile[failure.file].push(failure);
});

console.log(`\n=== FAILURES BY FILE ===\n`);
Object.entries(byFile)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([file, tests]) => {
    console.log(`${file}: ${tests.length} failures`);
  });

// Write detailed report
const report = {
  summary: {
    totalFailures: failures.length,
    totalFlaky: flaky.length,
    patterns: Object.entries(patterns).map(([name, tests]) => ({
      name,
      count: tests.length
    })).sort((a, b) => b.count - a.count)
  },
  failures: failures.map(f => ({
    file: f.file,
    title: f.title,
    error: f.error,
    duration: f.duration
  })),
  flaky: flaky
};

fs.writeFileSync('E2E_90_FAILURES_ANALYSIS.json', JSON.stringify(report, null, 2));
console.log(`\nDetailed report written to E2E_90_FAILURES_ANALYSIS.json`);
