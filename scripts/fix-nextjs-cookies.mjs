#!/usr/bin/env node

/**
 * Script to fix Next.js 15+ cookies() compatibility issues
 * 
 * This script updates all API routes to use the new async cookies() pattern
 * by replacing createRouteHandlerClient with createAuthenticatedClient.
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const OLD_IMPORT = `import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';`;

const NEW_IMPORT = `import { createAuthenticatedClient } from '@/lib/supabaseServer';`;

const OLD_CLIENT_PATTERN = /const supabase = createRouteHandlerClient\(\{ cookies \}\);/g;
const NEW_CLIENT_PATTERN = 'const supabase = await createAuthenticatedClient();';

async function fixFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if file needs fixing
    if (content.includes('createRouteHandlerClient')) {
      console.log(`Fixing: ${filePath}`);

      // Replace imports
      if (content.includes(OLD_IMPORT)) {
        content = content.replace(OLD_IMPORT, NEW_IMPORT);
        modified = true;
      }

      // Replace client creation
      if (OLD_CLIENT_PATTERN.test(content)) {
        content = content.replace(OLD_CLIENT_PATTERN, NEW_CLIENT_PATTERN);
        modified = true;
      }

      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Fixed: ${filePath}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing Next.js 15+ cookies() compatibility issues...\n');

  // Find all API route files
  const files = await glob('app/api/**/*.ts', { ignore: 'node_modules/**' });

  console.log(`Found ${files.length} API route files\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const wasFixed = await fixFile(file);
    if (wasFixed) {
      fixedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Fixed: ${fixedCount} files`);
  console.log(`   Skipped: ${skippedCount} files (already correct or no changes needed)`);
}

main().catch(console.error);
