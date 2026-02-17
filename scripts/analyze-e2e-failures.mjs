#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const resultsPath = 'test-results/e2e-results.json';

console.log('📊 Analyzing E2E Test Failures...\n');

// Read the results file
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Extract all test specs
const allTests = [];
const failedTests = [];
const flakyTests = [];
const passedTests = [];

function extractTests(suites) {
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const test = {
          file: suite.file,
          suite: suite.title,
          title: spec.title,
          ok: spec.ok,
          tests: spec.tests
        };
        
        allTests.push(test);
        
        if (!spec.ok) {
          failedTests.push(test);
        } else if (spec.tests[0]?.results?.length > 1) {
          flakyTests.push(test);
        } else {
          passedTests.push(test);
        }
      }
    }
    
    if (suite.suites) {
      extractTests(suite.suites);
    }
  }
}

extractTests(results.suites);

console.log(`Total Tests: ${allTests.length}`);
console.log(`✅ Passed: ${passedTests.length} (${((passedTests.length / allTests.length) * 100).toFixed(1)}%)`);
console.log(`❌ Failed: ${failedTests.length} (${((failedTests.length / allTests.length) * 100).toFixed(1)}%)`);
console.log(`⚠️  Flaky: ${flakyTests.length} (${((flakyTests.length / allTests.length) * 100).toFixed(1)}%)`);
console.log('');

// Categorize failures by error type
const errorPatterns = {
  'Guest Auth/Navigation': [],
  'Admin Page Load': [],
  'Timeout': [],
  'Element Not Found': [],
  'API/Network': [],
  'Database/RLS': [],
  'Form Submission': [],
  'Other': []
};

for (const test of failedTests) {
  const firstResult = test.tests[0]?.results?.[0];
  const error = firstResult?.error?.message || '';
  const stack = firstResult?.error?.stack || '';
  
  const testInfo = {
    file: test.file,
    suite: test.suite,
    title: test.title,
    error: error.split('\n')[0],
    fullError: error
  };
  
  // Categorize by error pattern
  if (error.includes('/guest/') || error.includes('guest-login') || error.includes('authenticateAsGuest')) {
    errorPatterns['Guest Auth/Navigation'].push(testInfo);
  } else if (error.includes('/admin/') && (error.includes('ERR_ABORTED') || error.includes('Timeout'))) {
    errorPatterns['Admin Page Load'].push(testInfo);
  } else if (error.includes('Timeout') || error.includes('exceeded')) {
    errorPatterns['Timeout'].push(testInfo);
  } else if (error.includes('locator') || error.includes('not found') || error.includes('visible')) {
    errorPatterns['Element Not Found'].push(testInfo);
  } else if (error.includes('API') || error.includes('fetch') || error.includes('network') || error.includes('ERR_')) {
    errorPatterns['API/Network'].push(testInfo);
  } else if (error.includes('RLS') || error.includes('permission') || error.includes('policy')) {
    errorPatterns['Database/RLS'].push(testInfo);
  } else if (error.includes('form') || error.includes('submit') || error.includes('input')) {
    errorPatterns['Form Submission'].push(testInfo);
  } else {
    errorPatterns['Other'].push(testInfo);
  }
}

console.log('📋 Failure Categories:\n');

for (const [category, tests] of Object.entries(errorPatterns)) {
  if (tests.length > 0) {
    console.log(`\n${category}: ${tests.length} failures`);
    console.log('─'.repeat(60));
    
    for (const test of tests.slice(0, 5)) {
      console.log(`  • ${test.file}`);
      console.log(`    ${test.suite} > ${test.title}`);
      console.log(`    Error: ${test.error}`);
      console.log('');
    }
    
    if (tests.length > 5) {
      console.log(`  ... and ${tests.length - 5} more\n`);
    }
  }
}

// Analyze flaky tests
if (flakyTests.length > 0) {
  console.log('\n⚠️  Flaky Tests (passed on retry):\n');
  console.log('─'.repeat(60));
  
  for (const test of flakyTests.slice(0, 10)) {
    console.log(`  • ${test.file}`);
    console.log(`    ${test.suite} > ${test.title}`);
    console.log('');
  }
  
  if (flakyTests.length > 10) {
    console.log(`  ... and ${flakyTests.length - 10} more\n`);
  }
}

// Group by file
const fileGroups = {};
for (const test of failedTests) {
  if (!fileGroups[test.file]) {
    fileGroups[test.file] = [];
  }
  fileGroups[test.file].push(test);
}

console.log('\n📁 Failures by File:\n');
console.log('─'.repeat(60));

const sortedFiles = Object.entries(fileGroups).sort((a, b) => b[1].length - a[1].length);

for (const [file, tests] of sortedFiles.slice(0, 10)) {
  console.log(`  ${file}: ${tests.length} failures`);
}

if (sortedFiles.length > 10) {
  console.log(`  ... and ${sortedFiles.length - 10} more files\n`);
}

// Priority recommendations
console.log('\n\n🎯 Priority Fix Recommendations:\n');
console.log('─'.repeat(60));

const priorities = [
  {
    name: 'Priority 1: Guest Authentication',
    count: errorPatterns['Guest Auth/Navigation'].length,
    impact: 'HIGH - Blocks all guest portal tests',
    files: [...new Set(errorPatterns['Guest Auth/Navigation'].map(t => t.file))]
  },
  {
    name: 'Priority 2: Admin Page Load Issues',
    count: errorPatterns['Admin Page Load'].length,
    impact: 'HIGH - Blocks admin dashboard tests',
    files: [...new Set(errorPatterns['Admin Page Load'].map(t => t.file))]
  },
  {
    name: 'Priority 3: Timeout Issues',
    count: errorPatterns['Timeout'].length,
    impact: 'MEDIUM - May indicate performance or timing issues',
    files: [...new Set(errorPatterns['Timeout'].map(t => t.file))]
  },
  {
    name: 'Priority 4: Element Not Found',
    count: errorPatterns['Element Not Found'].length,
    impact: 'MEDIUM - UI changes or selector issues',
    files: [...new Set(errorPatterns['Element Not Found'].map(t => t.file))]
  }
];

for (const priority of priorities) {
  if (priority.count > 0) {
    console.log(`\n${priority.name}`);
    console.log(`  Count: ${priority.count} failures`);
    console.log(`  Impact: ${priority.impact}`);
    console.log(`  Affected files: ${priority.files.slice(0, 3).join(', ')}${priority.files.length > 3 ? '...' : ''}`);
  }
}

console.log('\n\n✅ Next Steps:\n');
console.log('─'.repeat(60));
console.log('1. Fix guest authentication issues (highest priority)');
console.log('2. Investigate admin page load failures');
console.log('3. Review timeout issues for performance problems');
console.log('4. Update selectors for element not found errors');
console.log('5. Re-run tests to verify fixes');
console.log('');

// Write detailed report
const report = {
  summary: {
    total: allTests.length,
    passed: passedTests.length,
    failed: failedTests.length,
    flaky: flakyTests.length,
    passRate: ((passedTests.length / allTests.length) * 100).toFixed(1) + '%'
  },
  categories: Object.fromEntries(
    Object.entries(errorPatterns).map(([k, v]) => [k, v.length])
  ),
  failuresByFile: Object.fromEntries(
    Object.entries(fileGroups).map(([k, v]) => [k, v.length])
  ),
  detailedFailures: errorPatterns,
  flakyTests: flakyTests.map(t => ({
    file: t.file,
    suite: t.suite,
    title: t.title
  }))
};

fs.writeFileSync('E2E_FAILURE_ANALYSIS.json', JSON.stringify(report, null, 2));
console.log('📄 Detailed report written to E2E_FAILURE_ANALYSIS.json\n');
