#!/usr/bin/env node

/**
 * Script to fix async params in Next.js 15 API routes
 * Adds `const resolvedParams = await params;` after auth checks
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('app/api/**/*.ts');

let fixedCount = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Pattern 1: Direct params.id usage without await
  // Look for patterns like: const { id } = params; or params.id
  const needsFixPattern = /\{\s*params\s*\}:\s*\{\s*params:\s*Promise<\{[^}]+\}>\s*\}/;
  
  if (!needsFixPattern.test(content)) {
    continue; // Skip files that don't have Promise params
  }

  // Check if already has resolvedParams
  if (content.includes('resolvedParams = await params')) {
    continue; // Already fixed
  }

  // Pattern: const { id } = params; or const { type, id } = params;
  const directDestructurePattern = /(\s+)(const\s+\{\s*[^}]+\}\s*=\s*params;)/g;
  
  if (directDestructurePattern.test(content)) {
    content = content.replace(
      directDestructurePattern,
      '$1const resolvedParams = await params;\n$1const { $3 } = resolvedParams;'.replace('const { ', '').replace(' } = resolvedParams;', '')
    );
    
    // More precise replacement
    content = content.replace(
      /(\s+)(const\s+\{([^}]+)\}\s*=\s*params;)/g,
      '$1const resolvedParams = await params;\n$1const {$3} = resolvedParams;'
    );
    
    modified = true;
  }

  // Pattern: params.id direct usage
  const directAccessPattern = /([^a-zA-Z_])params\.(id|type)([^a-zA-Z_])/g;
  
  if (directAccessPattern.test(content) && !content.includes('resolvedParams')) {
    // Need to add resolvedParams declaration
    // Find the first usage of params.id or params.type
    const match = content.match(/(\s+)(\/\/ [12]\. [A-Z][^\n]+\n)/);
    
    if (match) {
      const insertPoint = match.index + match[0].length;
      content = content.slice(0, insertPoint) + 
                '    const resolvedParams = await params;\n\n' +
                content.slice(insertPoint);
      modified = true;
    }
    
    // Replace params.id with resolvedParams.id
    content = content.replace(/([^a-zA-Z_])params\.(id|type)([^a-zA-Z_])/g, '$1resolvedParams.$2$3');
    modified = true;
  }

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    fixedCount++;
    console.log(`✓ Fixed: ${file}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
