#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const files = [
  'app/api/admin/events/[id]/route.ts',
  'app/api/admin/guests/[id]/route.ts',
  'app/api/admin/photos/[id]/route.ts',
  'app/api/admin/photos/[id]/moderate/route.ts',
  'app/api/admin/vendors/[id]/route.ts',
  'app/api/guest/family/[id]/route.ts',
];

files.forEach(filePath => {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace params type
  content = content.replace(
    /\{ params \}: \{ params: \{ id: string \} \}/g,
    '{ params }: { params: Promise<{ id: string }> }'
  );
  
  // Find all function declarations and add await params after auth check
  const functionPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]+\) \{[\s\S]*?(?=export async function|$)/g;
  
  content = content.replace(functionPattern, (match) => {
    // Check if this function already has await params
    if (match.includes('await params')) {
      return match;
    }
    
    // Find the auth check section and add await params after it
    const authCheckPattern = /(const \{ (?:user, )?supabase \} = auth;)/;
    if (authCheckPattern.test(match)) {
      return match.replace(authCheckPattern, '$1\n\n    // 2. Await params\n    const { id } = await params;');
    }
    
    // For routes without auth variable destructuring, look for session check
    const sessionPattern = /(if \(authError \|\| !session\) \{[\s\S]*?\}\n)/;
    if (sessionPattern.test(match)) {
      return match.replace(sessionPattern, '$1\n    // 2. Await params\n    const { id } = await params;\n');
    }
    
    return match;
  });
  
  // Replace all params.id with id
  content = content.replace(/params\.id/g, 'id');
  
  // Renumber comments if needed
  content = content.replace(/\/\/ 2\. Parse and validate/g, '// 3. Parse and validate');
  content = content.replace(/\/\/ 2\. Call service/g, '// 3. Call service');
  content = content.replace(/\/\/ 3\. Call service/g, '// 4. Call service');
  content = content.replace(/\/\/ 3\. Parse and validate/g, '// 4. Parse and validate');
  content = content.replace(/\/\/ 4\. Call service/g, '// 5. Call service');
  content = content.replace(/\/\/ 4\. Return response/g, '// 5. Return response');
  content = content.replace(/\/\/ 3\. Return response/g, '// 4. Return response');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${filePath}`);
});

console.log('\nAll files fixed!');
