#!/usr/bin/env node

/**
 * E2E Test Failure Pattern Analyzer
 * 
 * Analyzes E2E test failures and groups them by common patterns
 * to enable batch fixing instead of one-by-one debugging.
 * 
 * Usage:
 *   npm run test:e2e -- --reporter=json > e2e-results.json
 *   node scripts/analyze-e2e-patterns.mjs e2e-results.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const resultsFile = process.argv[2] || 'e2e-results.json';

try {
  const content = readFileSync(resultsFile, 'utf-8');
  const results = JSON.parse(content);

  const patterns = {
    TIMEOUT_WAITING_FOR_ELEMENT: {
      tests: [],
      description: 'Tests timing out waiting for elements (forms, modals, lazy components)',
      keywords: ['timeout', 'waiting for', 'locator', 'visible']
    },
    ELEMENT_NOT_FOUND: {
      tests: [],
      description: 'Elements not found (selector issues, conditional rendering)',
      keywords: ['not found', 'no element', 'unable to find', 'does not exist']
    },
    NAVIGATION_FAILED: {
      tests: [],
      description: 'Navigation failures (404s, redirects, routing issues)',
      keywords: ['404', 'navigation', 'redirect', 'route', 'page not found']
    },
    STATE_NOT_PERSISTING: {
      tests: [],
      description: 'State not persisting (URL params, filters, search)',
      keywords: ['url', 'state', 'parameter', 'query string', 'persist']
    },
    API_ERROR: {
      tests: [],
      description: 'API errors (500s, auth failures, database issues)',
      keywords: ['api', '500', '401', '403', 'unauthorized', 'database', 'connection']
    },
    ASSERTION_FAILED: {
      tests: [],
      description: 'Assertion failures (expected vs actual mismatches)',
      keywords: ['expected', 'received', 'assertion', 'toBe', 'toHaveText']
    },
    FORM_VALIDATION: {
      tests: [],
      description: 'Form validation issues (required fields, error messages)',
      keywords: ['validation', 'required', 'invalid', 'error message']
    },
    ACCESSIBILITY: {
      tests: [],
      description: 'Accessibility issues (ARIA, keyboard nav, screen readers)',
      keywords: ['aria', 'keyboard', 'screen reader', 'accessibility', 'a11y']
    },
    RESPONSIVE_DESIGN: {
      tests: [],
      description: 'Responsive design issues (mobile, tablet, viewport)',
      keywords: ['mobile', 'tablet', 'viewport', 'responsive', 'breakpoint']
    },
    OTHER: {
      tests: [],
      description: 'Other uncategorized failures',
      keywords: []
    }
  };

  // Analyze test results
  const allTests = results.suites?.flatMap(suite => 
    suite.specs?.flatMap(spec => spec.tests || []) || []
  ) || [];

  for (const test of allTests) {
    if (test.status !== 'passed' && test.status !== 'skipped') {
      const error = test.results?.[0]?.error?.message || '';
      const errorLower = error.toLowerCase();
      
      let categorized = false;
      
      for (const [pattern, config] of Object.entries(patterns)) {
        if (pattern === 'OTHER') continue;
        
        if (config.keywords.some(keyword => errorLower.includes(keyword.toLowerCase()))) {
          patterns[pattern].tests.push({
            title: test.title,
            file: test.location?.file || 'unknown',
            line: test.location?.line || 0,
            error: error.split('\n')[0], // First line only
            fullError: error
          });
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        patterns.OTHER.tests.push({
          title: test.title,
          file: test.location?.file || 'unknown',
          line: test.location?.line || 0,
          error: error.split('\n')[0],
          fullError: error
        });
      }
    }
  }

  // Print analysis
  console.log('\n' + '='.repeat(70));
  console.log('E2E TEST FAILURE PATTERN ANALYSIS');
  console.log('='.repeat(70) + '\n');

  const totalFailed = Object.values(patterns).reduce((sum, p) => sum + p.tests.length, 0);
  console.log(`Total Failed Tests: ${totalFailed}\n`);

  // Sort patterns by test count
  const sortedPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b.tests.length - a.tests.length)
    .filter(([, config]) => config.tests.length > 0);

  for (const [pattern, config] of sortedPatterns) {
    const count = config.tests.length;
    const percentage = ((count / totalFailed) * 100).toFixed(1);
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`${pattern}: ${count} tests (${percentage}%)`);
    console.log(`Description: ${config.description}`);
    console.log(`${'─'.repeat(70)}`);
    
    // Show top 5 examples
    const examples = config.tests.slice(0, 5);
    console.log('\nExamples:');
    examples.forEach((test, i) => {
      console.log(`\n  ${i + 1}. ${test.title}`);
      console.log(`     File: ${test.file}:${test.line}`);
      console.log(`     Error: ${test.error}`);
    });
    
    if (config.tests.length > 5) {
      console.log(`\n  ... and ${config.tests.length - 5} more`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDED FIX ORDER (by impact)');
  console.log('='.repeat(70) + '\n');

  sortedPatterns.forEach(([pattern, config], i) => {
    console.log(`${i + 1}. ${pattern} (${config.tests.length} tests)`);
    console.log(`   ${config.description}\n`);
  });

  // Export detailed results
  const outputFile = 'e2e-patterns.json';
  writeFileSync(outputFile, JSON.stringify(patterns, null, 2));
  console.log(`\nDetailed results exported to: ${outputFile}`);

  // Generate fix suggestions
  console.log('\n' + '='.repeat(70));
  console.log('FIX SUGGESTIONS');
  console.log('='.repeat(70) + '\n');

  const suggestions = {
    TIMEOUT_WAITING_FOR_ELEMENT: `
Create a helper function for lazy-loaded components:

// __tests__/helpers/e2eHelpers.ts
export async function waitForLazyComponent(page, selector, timeout = 5000) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.waitForTimeout(300); // CSS transitions
}

Then update tests to use it instead of fixed timeouts.
`,
    ELEMENT_NOT_FOUND: `
Add data-testid attributes to components:

// Component
<button data-testid="add-content-page-btn">Add Page</button>

// Test
await page.click('[data-testid="add-content-page-btn"]');

Create a testIds constants file for consistency.
`,
    STATE_NOT_PERSISTING: `
Fix DataTable component to sync with URL:

useEffect(() => {
  // Restore state from URL on mount
  const params = new URLSearchParams(window.location.search);
  // ... restore state
}, []);

useEffect(() => {
  // Update URL when state changes
  const params = new URLSearchParams();
  // ... update params
  window.history.replaceState({}, '', \`?\${params}\`);
}, [search, filters, sort]);
`,
    API_ERROR: `
Check API routes for:
1. Authentication middleware
2. Error handling
3. Database connection
4. Request validation

Add better error logging to identify root cause.
`,
    NAVIGATION_FAILED: `
Verify routes exist and are accessible:
1. Check app/[route]/page.tsx files exist
2. Verify middleware allows access
3. Check for redirect loops
4. Validate slug generation
`,
  };

  for (const [pattern, config] of sortedPatterns.slice(0, 3)) {
    if (suggestions[pattern]) {
      console.log(`\n${pattern}:`);
      console.log(suggestions[pattern]);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('NEXT STEPS');
  console.log('='.repeat(70) + '\n');
  console.log('1. Review the top 3 patterns above');
  console.log('2. Implement the suggested fixes');
  console.log('3. Run tests again: npm run test:e2e');
  console.log('4. Re-run this analysis to see improvement');
  console.log('5. Repeat until reaching 85% pass rate\n');

} catch (error) {
  console.error('Error analyzing E2E results:', error.message);
  console.error('\nUsage:');
  console.error('  npm run test:e2e -- --reporter=json > e2e-results.json');
  console.error('  node scripts/analyze-e2e-patterns.mjs e2e-results.json');
  process.exit(1);
}
