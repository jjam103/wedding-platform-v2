#!/usr/bin/env node

/**
 * Script to replace createRouteHandlerClient with createServerClient in API routes
 * This fixes the cookie parsing issue in Next.js 15+
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔧 Fixing API route authentication...\n');

// Recursively find all .ts files in app/api
function findTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findTsFiles('app/api');

let fixedCount = 0;
let skippedCount = 0;

files.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf8');
    let modified = false;

    // Check if file uses createRouteHandlerClient
    if (!content.includes('createRouteHandlerClient')) {
      skippedCount++;
      return;
    }

    console.log(`📝 Processing: ${file}`);

    // Replace import
    if (content.includes("import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'")) {
      content = content.replace(
        "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'",
        "import { createServerClient } from '@supabase/ssr'"
      );
      modified = true;
    }

    // Replace usage pattern
    const oldPattern = /const supabase = createRouteHandlerClient\(\{ cookies: \(\) => cookieStore \}\);/g;
    if (oldPattern.test(content)) {
      content = content.replace(
        oldPattern,
        `const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );`
      );
      modified = true;
    }

    if (modified) {
      writeFileSync(file, content, 'utf8');
      console.log(`   ✅ Fixed`);
      fixedCount++;
    } else {
      console.log(`   ⚠️  No changes needed`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`   ❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n✅ Done! Restart your dev server for changes to take effect.`);
