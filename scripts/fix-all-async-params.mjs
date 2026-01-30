#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const apiFiles = getAllTsFiles('app/api');
let fixedCount = 0;

for (const file of apiFiles) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Skip if no Promise params
  if (!content.includes('params: Promise<{')) {
    continue;
  }

  // Skip if already has resolvedParams
  if (content.includes('resolvedParams = await params')) {
    continue;
  }

  // Find all usages of params.id, params.type, etc. or destructuring
  const hasParamsUsage = /params\.(id|type|pageType|pageId)/.test(content) || 
                         /const\s+\{[^}]*\}\s*=\s*params;/.test(content);

  if (!hasParamsUsage) {
    continue;
  }

  // Strategy: Find where params is first used and add await before it
  const lines = content.split('\n');
  const newLines = [];
  let addedResolve = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line uses params (destructuring or direct access)
    const usesParams = /const\s+\{[^}]*\}\s*=\s*params;/.test(line) || 
                       /params\.(id|type|pageType|pageId)/.test(line);
    
    if (usesParams && !addedResolve) {
      // Add resolvedParams before this line
      const indent = line.match(/^(\s*)/)[1];
      
      if (/const\s+\{([^}]*)\}\s*=\s*params;/.test(line)) {
        // Destructuring case
        const match = line.match(/const\s+\{([^}]*)\}\s*=\s*params;/);
        newLines.push(`${indent}const resolvedParams = await params;`);
        newLines.push(`${indent}const {${match[1]}} = resolvedParams;`);
        addedResolve = true;
        modified = true;
        continue;
      } else if (/params\.(id|type|pageType|pageId)/.test(line)) {
        // Direct access case - add resolvedParams declaration before
        newLines.push(`${indent}const resolvedParams = await params;`);
        newLines.push('');
        // Replace params. with resolvedParams.
        newLines.push(line.replace(/params\./g, 'resolvedParams.'));
        addedResolve = true;
        modified = true;
        continue;
      }
    }
    
    // Replace any remaining params. with resolvedParams. after we've added the declaration
    if (addedResolve && /params\.(id|type|pageType|pageId)/.test(line)) {
      newLines.push(line.replace(/params\./g, 'resolvedParams.'));
      modified = true;
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    writeFileSync(file, newLines.join('\n'), 'utf-8');
    fixedCount++;
    console.log(`✓ Fixed: ${file}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} API route files`);
