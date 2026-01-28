import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const filesToUpdate = [
  'app/api/guest/events/list/route.ts',
  'app/api/guest/events/route.ts',
  'app/api/guest/rsvps/route.ts',
  'app/api/guest/rsvp/route.ts',
  'app/api/guest/photos/upload/route.ts',
  'app/api/guest/family/[id]/route.ts',
  'app/api/guest/transportation/route.ts',
];

console.log('Updating remaining API routes...\n');

filesToUpdate.forEach(filePath => {
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Skip if already updated
    if (content.includes('getAuthenticatedUser') || content.includes('getAuthorizedAdmin')) {
      console.log(`✓ ${filePath} - Already updated`);
      return;
    }
    
    // Replace imports
    content = content.replace(
      /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs';/g,
      "import { getAuthenticatedUser } from '@/lib/apiAuth';"
    );
    
    // Remove standalone cookies import
    content = content.replace(/\nimport { cookies } from 'next\/headers';\n/g, '\n');
    
    // Replace auth pattern
    content = content.replace(
      /const supabase = createRouteHandlerClient\(\{ cookies \}\);\s*\n\s*(?:\/\/ Check authentication\s*\n\s*)?const \{\s*data: \{ session \},\s*error: authError,?\s*\} = await supabase\.auth\.getSession\(\);/g,
      `const auth = await getAuthenticatedUser();`
    );
    
    // Replace auth check
    content = content.replace(
      /if \(authError \|\| !session\) \{/g,
      'if (!auth) {'
    );
    
    // Add destructuring after auth check
    content = content.replace(
      /(if \(!auth\) \{[\s\S]*?\}\s*\n)/,
      '$1\n    const { user, supabase } = auth;\n'
    );
    
    // Replace session.user.email with user.email
    content = content.replace(/session\.user\.email/g, 'user.email');
    content = content.replace(/session\.user\.id/g, 'user.id');
    
    writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${filePath} - Updated`);
  } catch (error) {
    console.error(`✗ ${filePath} - Error: ${error.message}`);
  }
});

console.log('\nDone! Please review the changes.');
