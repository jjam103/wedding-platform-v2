#!/usr/bin/env node

/**
 * Audit Script: Find Hardcoded Values
 * 
 * Searches for potential hardcoded values that should be configurable
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Auditing Codebase for Hardcoded Values\n');
console.log('=' .repeat(60));

const issues = [];

// Patterns to search for
const patterns = [
  {
    name: 'Hardcoded /new routes',
    regex: /['"`]\/admin\/[a-z]+\/new['"`]/g,
    severity: 'HIGH',
    description: 'Routes ending in /new that may not exist'
  },
  {
    name: 'Hardcoded /edit routes',
    regex: /['"`]\/admin\/[a-z]+\/edit['"`]/g,
    severity: 'MEDIUM',
    description: 'Routes ending in /edit that may not exist'
  },
  {
    name: 'Hardcoded API URLs',
    regex: /https?:\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/gi,
    severity: 'MEDIUM',
    description: 'External URLs that should be environment variables',
    exclude: ['example.com', 'supabase.co', 'w3.org', 'github.com', 'nextjs.org'] // Known external services and docs
  },
  {
    name: 'Hardcoded ports',
    regex: /:\d{4,5}(?!px|rem|em|%)/g,
    severity: 'LOW',
    description: 'Port numbers that might need configuration'
  },
  {
    name: 'Missing ToastProvider usage',
    regex: /useToast\(\)/g,
    severity: 'HIGH',
    description: 'Components using useToast() - verify ToastProvider wraps them',
    checkFile: true,
    skipIfInLayout: true // Skip if file is in a directory with layout.tsx
  }
];

// Files to exclude
const excludePatterns = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '__tests__',
  'test',
  '.test.',
  '.spec.',
  'playwright-report',
  'test-results',
  '.md',
  'scripts/audit-hardcoded-values.mjs' // Don't audit ourselves
];

function shouldExclude(path) {
  return excludePatterns.some(pattern => path.includes(pattern));
}

function scanDirectory(dir) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = join(dir, file);
    
    if (shouldExclude(fullPath)) {
      return;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(fullPath);
    }
  });
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  patterns.forEach(pattern => {
    if (pattern.checkFile) {
      // Special handling for patterns that need file-level checks
      if (pattern.name === 'Missing ToastProvider usage') {
        const matches = content.match(pattern.regex);
        if (matches && matches.length > 0) {
          // Check if file has ToastProvider import or is wrapped
          const hasProvider = content.includes('ToastProvider') || 
                            content.includes('useToast') && filePath.includes('ToastContext');
          
          // Check if file is in app/admin directory or components/admin (which are wrapped by admin layout)
          const isInAdminDir = (filePath.includes('app/admin/') || filePath.includes('components/admin/')) && 
                              !filePath.includes('app/admin/layout.tsx');
          
          if (!hasProvider && !isInAdminDir && !filePath.includes('layout.tsx')) {
            issues.push({
              file: filePath,
              severity: pattern.severity,
              type: pattern.name,
              description: `File uses useToast() but may not be wrapped in ToastProvider`,
              line: 'N/A'
            });
          }
        }
      }
    } else {
      lines.forEach((line, index) => {
        const matches = line.match(pattern.regex);
        if (matches) {
          // Filter out excluded values
          if (pattern.exclude) {
            const filtered = matches.filter(match => 
              !pattern.exclude.some(excluded => match.includes(excluded))
            );
            if (filtered.length === 0) return;
          }
          
          issues.push({
            file: filePath,
            line: index + 1,
            severity: pattern.severity,
            type: pattern.name,
            description: pattern.description,
            code: line.trim()
          });
        }
      });
    }
  });
}

// Start scanning
scanDirectory('.');

// Report results
console.log('\n📊 AUDIT RESULTS\n');

if (issues.length === 0) {
  console.log('✅ No issues found!\n');
} else {
  // Group by severity
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');
  
  if (high.length > 0) {
    console.log(`\n🔴 HIGH SEVERITY (${high.length} issues):\n`);
    high.forEach(issue => {
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Description: ${issue.description}`);
      if (issue.code) console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }
  
  if (medium.length > 0) {
    console.log(`\n🟡 MEDIUM SEVERITY (${medium.length} issues):\n`);
    medium.forEach(issue => {
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Type: ${issue.type}`);
      console.log(`   Description: ${issue.description}`);
      if (issue.code) console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }
  
  if (low.length > 0) {
    console.log(`\n🟢 LOW SEVERITY (${low.length} issues):\n`);
    low.forEach(issue => {
      console.log(`   File: ${issue.file}:${issue.line}`);
      console.log(`   Type: ${issue.type}`);
      if (issue.code) console.log(`   Code: ${issue.code}`);
      console.log('');
    });
  }
}

console.log('=' .repeat(60));
console.log(`\n📈 SUMMARY:`);
console.log(`   Total Issues: ${issues.length}`);
console.log(`   High: ${issues.filter(i => i.severity === 'HIGH').length}`);
console.log(`   Medium: ${issues.filter(i => i.severity === 'MEDIUM').length}`);
console.log(`   Low: ${issues.filter(i => i.severity === 'LOW').length}`);
console.log('');

process.exit(issues.filter(i => i.severity === 'HIGH').length > 0 ? 1 : 0);
