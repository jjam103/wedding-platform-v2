#!/usr/bin/env node

/**
 * Script to fix API routes using old authentication pattern
 * Updates from createRouteHandlerClient to createAuthenticatedClient
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const filesToFix = [
  'app/api/admin/admin-users/[id]/deactivate/route.ts',
  'app/api/admin/admin-users/[id]/invite/route.ts',
  'app/api/admin/admin-users/[id]/route.ts',
  'app/api/admin/activities/bulk-delete/route.ts',
  'app/api/admin/gallery-settings/route.ts',
  'app/api/admin/references/search/route.ts',
  'app/api/admin/emails/send/route.ts',
  'app/api/admin/emails/preview/route.ts',
  'app/api/admin/deleted-items/[id]/restore/route.ts',
  'app/api/admin/deleted-items/[id]/permanent/route.ts',
  'app/api/admin/deleted-items/route.ts',
  'app/api/admin/emails/templates/[id]/route.ts',
  'app/api/admin/emails/history/route.ts',
  'app/api/admin/references/validate/route.ts',
];

let fixedCount = 0;
let errorCount = 0;

for (const file of filesToFix) {
  try {
    console.log(`Fixing ${file}...`);
    let content = readFileSync(file, 'utf-8');
    
    // Pattern 1: createRouteHandlerClient with cookies
    if (content.includes('createRouteHandlerClient')) {
      // Replace import
      content = content.replace(
        /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs';/g,
        ''
      );
      
      // Remove cookies import if it's only used for auth
      const cookiesUsedElsewhere = content.match(/cookies\(\)/g)?.length > 1;
      if (!cookiesUsedElsewhere) {
        content = content.replace(
          /import { cookies } from 'next\/headers';/g,
          ''
        );
      }
      
      // Add new import if not present
      if (!content.includes('createAuthenticatedClient')) {
        const importSection = content.match(/import.*from.*;\n/g);
        if (importSection) {
          const lastImport = importSection[importSection.length - 1];
          content = content.replace(
            lastImport,
            lastImport + "import { createAuthenticatedClient } from '@/lib/supabaseServer';\n"
          );
        }
      }
      
      // Replace auth pattern
      content = content.replace(
        /const supabase = createRouteHandlerClient\(\{ cookies \}\);/g,
        'const supabase = await createAuthenticatedClient();'
      );
      
      // Replace pattern with cookieStore
      content = content.replace(
        /const cookieStore = (?:await )?cookies\(\);\s*const supabase = createRouteHandlerClient\(\{ cookies: \(\) => cookieStore \}\);/g,
        'const supabase = await createAuthenticatedClient();'
      );
      
      writeFileSync(file, content, 'utf-8');
      fixedCount++;
      console.log(`✓ Fixed ${file}`);
    } else {
      console.log(`  Skipped ${file} (already fixed or different pattern)`);
    }
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
    errorCount++;
  }
}

console.log(`\n✓ Fixed ${fixedCount} files`);
if (errorCount > 0) {
  console.log(`✗ ${errorCount} errors`);
  process.exit(1);
}
