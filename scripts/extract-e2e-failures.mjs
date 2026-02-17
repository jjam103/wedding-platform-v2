#!/usr/bin/env node

/**
 * E2E Failure Extraction Script
 * 
 * Extracts all failure information from test-results/ directory
 * and generates a structured catalog for pattern analysis.
 * 
 * Output: E2E_FAILURE_CATALOG.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const TEST_RESULTS_DIR = path.join(rootDir, 'test-results');
const OUTPUT_FILE = path.join(rootDir, 'E2E_FAILURE_CATALOG.json');

console.log('🔍 E2E Failure Extraction Starting...\n');

/**
 * Extract failure information from a test result directory
 */
function extractFailureInfo(testDir) {
  const testName = path.basename(testDir);
  const failureInfo = {
    testName,
    testPath: null,
    errorMessage: null,
    errorType: null,
    stackTrace: null,
    screenshot: null,
    trace: null,
    timestamp: null
  };

  try {
    // Check for test-results.json
    const resultsJsonPath = path.join(testDir, 'test-results.json');
    if (fs.existsSync(resultsJsonPath)) {
      const resultsData = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf8'));
      
      if (resultsData.errors && resultsData.errors.length > 0) {
        const error = resultsData.errors[0];
        failureInfo.errorMessage = error.message || error.value;
        failureInfo.stackTrace = error.stack;
      }
      
      if (resultsData.attachments) {
        resultsData.attachments.forEach(att => {
          if (att.name === 'screenshot') failureInfo.screenshot = att.path;
          if (att.name === 'trace') failureInfo.trace = att.path;
        });
      }
    }

    // Check for attachment files
    const files = fs.readdirSync(testDir);
    files.forEach(file => {
      if (file.endsWith('.png')) failureInfo.screenshot = path.join(testDir, file);
      if (file.endsWith('.zip')) failureInfo.trace = path.join(testDir, file);
    });

    // Extract test path from directory name
    // Format: test-name-retry-N or test-name
    const match = testName.match(/^(.+?)(?:-retry-\d+)?$/);
    if (match) {
      failureInfo.testPath = match[1].replace(/-/g, ' › ');
    }

    // Get directory timestamp
    const stats = fs.statSync(testDir);
    failureInfo.timestamp = stats.mtime.toISOString();

  } catch (error) {
    console.error(`Error processing ${testDir}:`, error.message);
  }

  return failureInfo;
}

/**
 * Scan test-results directory for failures
 */
function scanTestResults() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.error(`❌ Test results directory not found: ${TEST_RESULTS_DIR}`);
    process.exit(1);
  }

  const failures = [];
  const entries = fs.readdirSync(TEST_RESULTS_DIR);

  console.log(`📂 Scanning ${entries.length} test result directories...\n`);

  entries.forEach(entry => {
    const entryPath = path.join(TEST_RESULTS_DIR, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      const failureInfo = extractFailureInfo(entryPath);
      
      // Only include if we found error information
      if (failureInfo.errorMessage || failureInfo.screenshot) {
        failures.push(failureInfo);
      }
    }
  });

  return failures;
}

/**
 * Parse error message to extract error type
 */
function categorizeError(errorMessage) {
  if (!errorMessage) return 'UNKNOWN';

  const msg = errorMessage.toLowerCase();

  // API/Network errors
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('api')) {
    return 'API_ERROR';
  }

  // Timeout errors
  if (msg.includes('timeout') || msg.includes('exceeded')) {
    return 'TIMEOUT';
  }

  // Element not found
  if (msg.includes('not found') || msg.includes('not visible')) {
    return 'ELEMENT_NOT_FOUND';
  }

  // Assertion failures
  if (msg.includes('expect') || msg.includes('assertion')) {
    return 'ASSERTION_FAILURE';
  }

  // Navigation errors
  if (msg.includes('navigation') || msg.includes('goto')) {
    return 'NAVIGATION_ERROR';
  }

  // Selector errors
  if (msg.includes('selector') || msg.includes('locator')) {
    return 'SELECTOR_ERROR';
  }

  return 'OTHER';
}

/**
 * Main execution
 */
function main() {
  const failures = scanTestResults();

  // Categorize errors
  failures.forEach(failure => {
    failure.errorType = categorizeError(failure.errorMessage);
  });

  // Sort by timestamp (most recent first)
  failures.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Generate summary statistics
  const summary = {
    totalFailures: failures.length,
    byErrorType: {},
    extractedAt: new Date().toISOString()
  };

  failures.forEach(failure => {
    const type = failure.errorType;
    summary.byErrorType[type] = (summary.byErrorType[type] || 0) + 1;
  });

  // Create output object
  const output = {
    summary,
    failures
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Print summary
  console.log('✅ Extraction Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Failures: ${summary.totalFailures}`);
  console.log(`\n   By Error Type:`);
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
