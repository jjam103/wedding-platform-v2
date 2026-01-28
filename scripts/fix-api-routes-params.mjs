#!/usr/bin/env node

/**
 * Fix API routes to await params for Next.js 15+ compatibility
 * 
 * In Next.js 15+, params in dynamic routes are now Promises that must be awaited
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function fixParamsInFunction(content) {
  // Pattern 1: Function with params destructuring
  // { params }: { params: { id: string } }
  // becomes
  // { params }: { params: Promise<{ id: string }> }
  
  let fixed = content;
  
  // Fix the type annotation
  fixed = fixed.replace(
    /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
    '{ params }: { params: Promise<{ $1 }> }'
  );
  
  // Add await for params usage - find first usage of params.something
  // and add const resolvedParams = await params; before it
  if (fixed.includes('params.')) {
    // Find the first occurrence of params. usage
    const paramsUsageMatch = fixed.match(/(\s+)(const|let|var)?\s*.*?params\./);
    if (paramsUsageMatch) {
      const indent = paramsUsageMatch[1];
      // Check if we already have resolvedParams
      if (!fixed.includes('const resolvedParams = await params;')) {
        // Insert before the first params usage
        const insertPoint = fixed.indexOf(paramsUsageMatch[0]);
        fixed = fixed.slice(0, insertPoint) + 
                `${indent}const resolvedParams = await params;\n` +
                fixed.slice(insertPoint);
        
        // Replace all params. with resolvedParams.
        fixed = fixed.replace(/params\./g, 'resolvedParams.');
      }
    }
  }
  
  return fixed;
}

async function fixApiRoutes() {
  console.log('🔍 Finding API routes with params issue...\n');
  
  // Find all API route files in dynamic route folders (contain [])
  const files = getAllFiles('app/api').filter(file => file.includes('['));
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Check if file has params that need fixing
      if (!content.includes('{ params }:') || content.includes('params: Promise<{')) {
        skippedCount++;
        continue;
      }
      
      // Apply fix
      const fixed = fixParamsInFunction(content);
      
      if (fixed !== content) {
        writeFileSync(file, fixed, 'utf-8');
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${skippedCount} files`);
  console.log(`   Total: ${files.length} files`);
}

fixApiRoutes().catch(console.error);
