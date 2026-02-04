const fs = require('fs');

const filePath = 'components/admin/SectionEditor.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing button name references...\n');

// The button text is "+ Add Section" not "add new section"
content = content.replace(/\/add new section\/i/g, '/\\+ add section/i');

// Also fix "Create First Section" button
content = content.replace(/\/create first section\/i/g, '/create first section/i');

console.log('✓ Fixed button name references');

fs.writeFileSync(filePath, content);
console.log('Done!');
