#!/usr/bin/env node
import fs from 'fs';

const files = [
  'app/api/admin/guests/[id]/route.ts',
  'app/api/admin/photos/[id]/route.ts',
  'app/api/admin/photos/[id]/moderate/route.ts',
  'app/api/admin/vendors/[id]/route.ts',
  'app/api/guest/family/[id]/route.ts',
];

files.forEach(filePath => {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix the malformed syntax where closing paren and brace are after the await params line
  content = content.replace(
    /\{ status: 401 \}\n\n    \/\/ 2\. Await params\n    const \{ id \} = await params;\n      \);\n    \}/g,
    '{ status: 401 }\n      );\n    }\n\n    // 2. Await params\n    const { id } = await params;'
  );
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${filePath}`);
});

console.log('\nAll files fixed!');
