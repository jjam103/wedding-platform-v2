#!/usr/bin/env node

/**
 * E2E Test Output Parser
 * 
 * Parses the e2e-full-results.txt file to extract failure information
 * 
 * Output: E2E_FAILURE_CATALOG.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const INPUT_FILE = path.join(rootDir, 'e2e-complete-results.txt');
const OUTPUT_FILE = path.join(rootDir, 'E2E_FAILURE_CATALOG.json');

console.log('🔍 Parsing E2E Test Output...\n');

/**
 * Parse test output file
 */
function parseTestOutput() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = content.split('\n');

  const failures = [];
  const passes = [];
  let currentTest = null;
  let inErrorBlock = false;
  let errorLines = [];

  lines.forEach((line, index) => {
    // Match test result lines
    // Format: ✓ or ✘ followed by test number, browser, file, and test name
    const testMatch = line.match(/^\s*(✓|✘)\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+)$/);
    
    if (testMatch) {
      const [, status, testNum, browser, testPath] = testMatch;
      const isPassing = status === '✓';
      const isFailing = status === '✘';

      // Extract duration if present
      const durationMatch = testPath.match(/\(([0-9.]+[smh]+)\)$/);
      const duration = durationMatch ? durationMatch[1] : null;
      const cleanPath = testPath.replace(/\s*\([0-9.]+[smh]+\)$/, '');

      const test = {
        testNumber: parseInt(testNum),
        browser,
        testPath: cleanPath,
        duration,
        status: isPassing ? 'PASS' : 'FAIL',
        errorMessage: null,
        errorType: null
      };

      if (isPassing) {
        passes.push(test);
      } else if (isFailing) {
        currentTest = test;
        inErrorBlock = true;
        errorLines = [];
      }
    }
    // Collect error lines after a failure
    else if (inErrorBlock && line.trim()) {
      errorLines.push(line);
      
      // Stop collecting after a certain number of lines or when we hit another test
      if (errorLines.length > 50 || line.match(/^\s*(✓|✘)/)) {
        if (currentTest) {
          currentTest.errorMessage = errorLines.join('\n');
          currentTest.errorType = categorizeError(currentTest.errorMessage);
          failures.push(currentTest);
        }
        inErrorBlock = false;
        currentTest = null;
        errorLines = [];
      }
    }
    // End of error block
    else if (inErrorBlock && !line.trim()) {
      if (currentTest && errorLines.length > 0) {
        currentTest.errorMessage = errorLines.join('\n');
        currentTest.errorType = categorizeError(currentTest.errorMessage);
        failures.push(currentTest);
      }
      inErrorBlock = false;
      currentTest = null;
      errorLines = [];
    }
  });

  // Catch any remaining error
  if (currentTest && errorLines.length > 0) {
    currentTest.errorMessage = errorLines.join('\n');
    currentTest.errorType = categorizeError(currentTest.errorMessage);
    failures.push(currentTest);
  }

  return { failures, passes };
}

/**
 * Categorize error by type
 */
function categorizeError(errorMessage) {
  if (!errorMessage) return 'UNKNOWN';

  const msg = errorMessage.toLowerCase();

  // Timeout errors
  if (msg.includes('timeout') || msg.includes('exceeded')) {
    return 'TIMEOUT';
  }

  // Locator/Element not found
  if (msg.includes('locator') || msg.includes('not visible') || msg.includes('not found')) {
    return 'ELEMENT_NOT_FOUND';
  }

  // Assertion failures
  if (msg.includes('expect') || msg.includes('assertion') || msg.includes('received:')) {
    return 'ASSERTION_FAILURE';
  }

  // Navigation errors
  if (msg.includes('navigation') || msg.includes('goto')) {
    return 'NAVIGATION_ERROR';
  }

  // API/Network errors
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('api') || msg.includes('500') || msg.includes('404')) {
    return 'API_ERROR';
  }

  return 'OTHER';
}

/**
 * Main execution
 */
function main() {
  const { failures, passes } = parseTestOutput();

  // Generate summary
  const summary = {
    totalTests: failures.length + passes.length,
    passing: passes.length,
    failing: failures.length,
    passRate: ((passes.length / (failures.length + passes.length)) * 100).toFixed(1) + '%',
    byErrorType: {},
    extractedAt: new Date().toISOString()
  };

  failures.forEach(failure => {
    const type = failure.errorType;
    summary.byErrorType[type] = (summary.byErrorType[type] || 0) + 1;
  });

  // Create output
  const output = {
    summary,
    failures,
    passes: passes.map(p => ({
      testNumber: p.testNumber,
      testPath: p.testPath,
      duration: p.duration
    }))
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Print summary
  console.log('✅ Parsing Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Tests: ${summary.totalTests}`);
  console.log(`   Passing: ${summary.passing} (${summary.passRate})`);
  console.log(`   Failing: ${summary.failing}`);
  console.log(`\n   Failures By Error Type:`);
  Object.entries(summary.byErrorType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
  console.log(`\n📄 Output: ${OUTPUT_FILE}`);
  console.log(`\n🔜 Next Step: Run pattern grouping script`);
  console.log(`   node scripts/group-failure-patterns.mjs\n`);
}

main();
