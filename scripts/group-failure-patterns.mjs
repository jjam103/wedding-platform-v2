#!/usr/bin/env node

/**
 * E2E Failure Pattern Grouping Script
 * 
 * Groups similar failures into patterns for efficient fixing.
 * Uses error message similarity and test file patterns.
 * 
 * Input: E2E_FAILURE_CATALOG.json
 * Output: E2E_FAILURE_PATTERNS.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const INPUT_FILE = path.join(rootDir, 'E2E_FAILURE_CATALOG.json');
const OUTPUT_FILE = path.join(rootDir, 'E2E_FAILURE_PATTERNS.json');

console.log('🔍 E2E Failure Pattern Grouping Starting...\n');

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check for common keywords
  const keywords1 = new Set(s1.split(/\s+/));
  const keywords2 = new Set(s2.split(/\s+/));
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
}

/**
 * Extract key phrases from error message
 */
function extractKeyPhrases(errorMessage) {
  if (!errorMessage) return [];
  
  const phrases = [];
  
  // Common error patterns
  const patterns = [
    /locator\('([^']+)'\)/g,
    /selector "([^"]+)"/g,
    /element "([^"]+)"/g,
    /button "([^"]+)"/g,
    /text=([^\s]+)/g,
    /role=([^\s]+)/g,
    /Expected: (.+?)(?:\n|$)/g,
    /Received: (.+?)(?:\n|$)/g,
    /Error: (.+?)(?:\n|$)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(errorMessage)) !== null) {
      phrases.push(match[1]);
    }
  });
  
  return phrases;
}

/**
 * Group failures by similarity
 */
function groupFailures(failures) {
  const patterns = [];
  const processed = new Set();
  
  failures.forEach((failure, index) => {
    if (processed.has(index)) return;
    
    const pattern = {
      id: `PATTERN_${patterns.length + 1}`,
      description: '',
      errorType: failure.errorType,
      testCount: 1,
      tests: [failure],
      exampleError: failure.errorMessage,
      keyPhrases: extractKeyPhrases(failure.errorMessage),
      priority: 'MEDIUM'
    };
    
    // Find similar failures
    failures.forEach((other, otherIndex) => {
      if (otherIndex <= index || processed.has(otherIndex)) return;
      
      const similarity = calculateSimilarity(
        failure.errorMessage,
        other.errorMessage
      );
      
      // Group if similarity > 0.6 or same error type with similar key phrases
      if (similarity > 0.6 || 
          (failure.errorType === other.errorType && similarity > 0.4)) {
        pattern.tests.push(other);
        pattern.testCount++;
        processed.add(otherIndex);
      }
    });
    
    processed.add(index);
    patterns.push(pattern);
  });
  
  return patterns;
}

/**
 * Generate pattern descriptions
 */
function generateDescriptions(patterns) {
  patterns.forEach(pattern => {
    const errorType = pattern.errorType;
    const testCount = pattern.testCount;
    const keyPhrases = pattern.keyPhrases.slice(0, 3).join(', ');
    
    // Generate description based on error type and key phrases
    if (errorType === 'API_ERROR') {
      pattern.description = `API/Network errors (${testCount} tests)`;
    } else if (errorType === 'TIMEOUT') {
      pattern.description = `Timeout errors (${testCount} tests)`;
    } else if (errorType === 'ELEMENT_NOT_FOUND') {
      pattern.description = `Element not found: ${keyPhrases} (${testCount} tests)`;
    } else if (errorType === 'ASSERTION_FAILURE') {
      pattern.description = `Assertion failures (${testCount} tests)`;
    } else if (errorType === 'SELECTOR_ERROR') {
      pattern.description = `Selector errors: ${keyPhrases} (${testCount} tests)`;
    } else {
      pattern.description = `${errorType} (${testCount} tests)`;
    }
  });
}

/**
 * Prioritize patterns by impact
 */
function prioritizePatterns(patterns) {
  patterns.forEach(pattern => {
    const testCount = pattern.testCount;
    
    // High priority: 10+ tests
    if (testCount >= 10) {
      pattern.priority = 'HIGH';
    }
    // Medium priority: 5-9 tests
    else if (testCount >= 5) {
      pattern.priority = 'MEDIUM';
    }
    // Low priority: 1-4 tests
    else {
      pattern.priority = 'LOW';
    }
    
    // Boost priority for API errors (usually easy to fix)
    if (pattern.errorType === 'API_ERROR' && pattern.priority === 'MEDIUM') {
      pattern.priority = 'HIGH';
    }
  });
  
  // Sort by priority and test count
  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  patterns.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.testCount - a.testCount;
  });
}

/**
 * Main execution
 */
function main() {
  // Read input file
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error(`   Run extraction script first: node scripts/extract-e2e-failures.mjs`);
    process.exit(1);
  }
  
  const catalog = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  const failures = catalog.failures;
  
  console.log(`📊 Processing ${failures.length} failures...\n`);
  
  // Group failures into patterns
  const patterns = groupFailures(failures);
  
  // Generate descriptions
  generateDescriptions(patterns);
  
  // Prioritize patterns
  prioritizePatterns(patterns);
  
  // Generate summary
  const summary = {
    totalPatterns: patterns.length,
    totalTests: failures.length,
    byPriority: {
      HIGH: patterns.filter(p => p.priority === 'HIGH').length,
      MEDIUM: patterns.filter(p => p.priority === 'MEDIUM').length,
      LOW: patterns.filter(p => p.priority === 'LOW').length
    },
    analyzedAt: new Date().toISOString()
  };
  
  // Create output object
  const output = {
    summary,
    patterns: patterns.map(p => ({
      id: p.id,
      description: p.description,
      errorType: p.errorType,
      testCount: p.testCount,
      priority: p.priority,
      exampleError: p.exampleError,
      keyPhrases: p.keyPhrases,
      tests: p.tests.map(t => ({
        testName: t.testName,
        testPath: t.testPath,
        errorMessage: t.errorMessage,
        screenshot: t.screenshot,
        trace: t.trace
      }))
    }))
  };
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  // Print summary
  console.log('✅ Pattern Grouping Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total Patterns: ${summary.totalPatterns}`);
  console.log(`   Total Tests: ${summary.totalTests}`);
  console.log(`\n   By Priority:`);
  console.log(`   - HIGH: ${summary.byPriority.HIGH} patterns`);
  console.log(`   - MEDIUM: ${summary.byPriority.MEDIUM} patterns`);
  console.log(`   - LOW: ${summary.byPriority.LOW} patterns`);
  
  console.log(`\n📋 Top 5 Patterns:`);
  patterns.slice(0, 5).forEach((pattern, index) => {
    console.log(`   ${index + 1}. [${pattern.priority}] ${pattern.description}`);
  });
  
  console.log(`\n📄 Output: ${OUTPUT_FILE}`);
  console.log(`\n🔜 Next Step: Review patterns and start fixing`);
  console.log(`   See E2E_PATTERN_FIX_MASTER_PLAN.md for workflow\n`);
}

main();
