const fs = require('fs');

const filePath = 'components/admin/SectionEditor.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of looking for "Section 1" with looking for "#1"
content = content.replace(/expect\(screen\.getByText\('Section 1'\)\)\.toBeInTheDocument\(\);/g, 
  "expect(screen.getByText('#1', { selector: 'span' })).toBeInTheDocument();");

content = content.replace(/expect\(screen\.getByText\('Section 2'\)\)\.toBeInTheDocument\(\);/g,
  "expect(screen.getByText('#2', { selector: 'span' })).toBeInTheDocument();");

// Also fix the getAllByText patterns
content = content.replace(/screen\.getAllByText\(\/Section \\d\/\)/g,
  "screen.getAllByText(/#\\d+/, { selector: 'span' })");

fs.writeFileSync(filePath, content);
console.log('Fixed all Section references');
