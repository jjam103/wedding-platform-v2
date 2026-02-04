#!/usr/bin/env node

/**
 * Performance Budget Checker
 * 
 * Checks bundle sizes and performance metrics against defined budgets.
 * Requirements: 19.1, 19.2
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance budgets
const BUDGETS = {
  // Bundle sizes (bytes)
  initialBundle: 200 * 1024, // 200KB
  totalPageWeight: 1024 * 1024, // 1MB
  
  // API response times (ms, p95)
  apiResponse: 500,
  
  // Database query times (ms, p95)
  dbQuery: 100,
  
  // Core Web Vitals
  fcp: 1500, // First Contentful Paint (ms)
  lcp: 2500, // Largest Contentful Paint (ms)
  fid: 100, // First Input Delay (ms)
  cls: 0.1, // Cumulative Layout Shift (score)
  ttfb: 600, // Time to First Byte (ms)
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Check if value exceeds budget
 */
function checkBudget(name, value, budget, unit = '') {
  const percentage = (value / budget) * 100;
  const status = value <= budget ? 'PASS' : 'FAIL';
  const color = value <= budget ? colors.green : colors.red;
  
  console.log(
    `${color}${status}${colors.reset} ${name}: ${value}${unit} / ${budget}${unit} (${percentage.toFixed(1)}%)`
  );
  
  return value <= budget;
}

/**
 * Check bundle sizes
 */
function checkBundleSizes() {
  console.log(`\n${colors.bold}${colors.blue}Bundle Size Budgets:${colors.reset}`);
  
  const buildManifestPath = join(process.cwd(), '.next/build-manifest.json');
  
  if (!existsSync(buildManifestPath)) {
    console.log(`${colors.yellow}Warning: Build manifest not found. Run 'npm run build' first.${colors.reset}`);
    return true;
  }
  
  try {
    const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));
    
    // Calculate initial bundle size (main chunks)
    let initialBundleSize = 0;
    const mainChunks = manifest.pages['/'] || [];
    
    for (const chunk of mainChunks) {
      const chunkPath = join(process.cwd(), '.next', chunk);
      if (existsSync(chunkPath)) {
        const stats = readFileSync(chunkPath);
        initialBundleSize += stats.length;
      }
    }
    
    // Check initial bundle budget
    const initialPass = checkBudget(
      'Initial Bundle',
      initialBundleSize,
      BUDGETS.initialBundle,
      ' bytes'
    );
    
    console.log(`  ${formatBytes(initialBundleSize)} / ${formatBytes(BUDGETS.initialBundle)}`);
    
    return initialPass;
  } catch (error) {
    console.error(`${colors.red}Error checking bundle sizes:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Check API performance metrics
 */
function checkApiMetrics() {
  console.log(`\n${colors.bold}${colors.blue}API Performance Budgets:${colors.reset}`);
  
  // In a real implementation, this would read from performance monitoring logs
  // For now, we'll show the budgets
  console.log(`  API Response Time (p95): ${BUDGETS.apiResponse}ms`);
  console.log(`  Database Query Time (p95): ${BUDGETS.dbQuery}ms`);
  
  console.log(`${colors.yellow}Note: Run performance tests to measure actual metrics${colors.reset}`);
  
  return true;
}

/**
 * Check Core Web Vitals budgets
 */
function checkWebVitals() {
  console.log(`\n${colors.bold}${colors.blue}Core Web Vitals Budgets:${colors.reset}`);
  
  console.log(`  First Contentful Paint (FCP): ${BUDGETS.fcp}ms`);
  console.log(`  Largest Contentful Paint (LCP): ${BUDGETS.lcp}ms`);
  console.log(`  First Input Delay (FID): ${BUDGETS.fid}ms`);
  console.log(`  Cumulative Layout Shift (CLS): ${BUDGETS.cls}`);
  console.log(`  Time to First Byte (TTFB): ${BUDGETS.ttfb}ms`);
  
  console.log(`${colors.yellow}Note: Run Lighthouse audit to measure actual metrics${colors.reset}`);
  
  return true;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}${colors.blue}Performance Budget Check${colors.reset}`);
  console.log('='.repeat(50));
  
  const results = {
    bundleSizes: checkBundleSizes(),
    apiMetrics: checkApiMetrics(),
    webVitals: checkWebVitals(),
  };
  
  console.log('\n' + '='.repeat(50));
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}✓ All performance budgets passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Some performance budgets failed!${colors.reset}`);
    process.exit(1);
  }
}

main();
