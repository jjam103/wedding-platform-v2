const fs = require('fs');

const filePath = 'components/admin/SectionEditor.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace "Preview as Guest" with "Guest Preview" in test descriptions and queries
content = content.replace(/should display "Preview as Guest" button/g, 
  'should display "Guest Preview" button');

content = content.replace(/should open preview modal when "Preview as Guest" is clicked/g,
  'should open preview modal when "Guest Preview" is clicked');

// Replace the button queries - the button text is "Guest Preview" not "Preview as Guest"
content = content.replace(/screen\.getByRole\('button', \{ name: \/preview as guest\/i \}\)/g,
  "screen.getByRole('button', { name: /guest preview/i })");

// Also need to check for "Save All" and "Close" buttons which might not exist
// Looking at the component, there's no "Save All" or "Close Section Editor" buttons in the header
// The component has: "+ Add Section" button and "Guest Preview" collapsible section

fs.writeFileSync(filePath, content);
console.log('Fixed preview button references');
