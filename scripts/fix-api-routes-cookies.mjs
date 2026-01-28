#!/usr/bin/env node

/**
 * Fix API routes to await cookies() for Next.js 15+ compatibility
 * 
 * This script updates all API routes that use createRouteHandlerClient({ cookies })
 * to properly await the cookies() function as required by Next.js 15+
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Pattern to match: createRouteHandlerClient({ cookies })
const OLD_PATTERN = /const supabase = createRouteHandlerClient\(\{ cookies \}\);/g;

// Replacement: await cookies() and pass as function
const NEW_PATTERN = `const cookieStore = await cookies();\n    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });`;

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

async function fixApiRoutes() {
  console.log('🔍 Finding API routes with cookies issue...\n');
  
  // Find all API route files
  const files = getAllFiles('app/api');
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Check if file needs fixing
      if (!content.includes('createRouteHandlerClient({ cookies })')) {
        skippedCount++;
        continue;
      }
      
      // Apply fix
      const fixed = content.replace(OLD_PATTERN, NEW_PATTERN);
      
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
