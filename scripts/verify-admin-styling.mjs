#!/usr/bin/env node

/**
 * Admin Pages Styling Verification Helper
 * 
 * This script helps verify that all admin pages are properly styled
 * by providing a checklist and opening pages in the browser.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const ADMIN_PAGES = [
  { path: '/admin', name: 'Dashboard' },
  { path: '/admin/guests', name: 'Guests' },
  { path: '/admin/events', name: 'Events' },
  { path: '/admin/activities', name: 'Activities' },
  { path: '/admin/vendors', name: 'Vendors' },
  { path: '/admin/photos', name: 'Photos' },
  { path: '/admin/emails', name: 'Emails' },
  { path: '/admin/budget', name: 'Budget' },
  { path: '/admin/settings', name: 'Settings' },
];

const UI_COMPONENTS = [
  'DataTable (headers, rows, pagination)',
  'FormModal (forms, inputs, buttons)',
  'Toast notifications',
  'ConfirmDialog',
  'Sidebar navigation',
  'Loading skeletons',
  'Buttons (primary, secondary, danger)',
  'Form inputs (text, select, checkbox)',
];

console.log('\n=== Admin Pages Styling Verification ===\n');
console.log('This script will help you verify that all admin pages are styled correctly.\n');

console.log('📋 Admin Pages to Verify:\n');
ADMIN_PAGES.forEach((page, index) => {
  console.log(`  ${index + 1}. ${page.name} (${page.path})`);
});

console.log('\n🎨 UI Components to Verify:\n');
UI_COMPONENTS.forEach((component, index) => {
  console.log(`  ${index + 1}. ${component}`);
});

console.log('\n📝 Verification Steps:\n');
console.log('  1. Ensure dev server is running (npm run dev)');
console.log('  2. Open each admin page in your browser');
console.log('  3. Check DevTools (F12) → Network tab for CSS file');
console.log('  4. Check DevTools → Elements tab for computed styles');
console.log('  5. Verify visual appearance matches expectations');
console.log('  6. Test responsive behavior at different viewport sizes');
console.log('  7. Document any issues in ADMIN_PAGES_STYLING_VERIFICATION.md');

console.log('\n🔍 What to Look For:\n');
console.log('  ✓ Background colors are applied (not transparent)');
console.log('  ✓ Text is readable with proper typography');
console.log('  ✓ Buttons have colors and hover effects');
console.log('  ✓ Forms have borders and proper spacing');
console.log('  ✓ Tables have headers and row styling');
console.log('  ✓ Modals/dialogs have backdrop and styling');
console.log('  ✓ Navigation sidebar is styled');
console.log('  ✓ Loading states show skeleton loaders');

console.log('\n🌐 Browser DevTools Checks:\n');
console.log('  Network Tab:');
console.log('    • CSS file request present with 200 status');
console.log('    • CSS file contains Tailwind classes');
console.log('  Elements Tab:');
console.log('    • HTML elements have Tailwind classes');
console.log('    • Computed styles show CSS properties');
console.log('  Console Tab:');
console.log('    • No CSS-related errors');

console.log('\n🚀 Quick Start:\n');
console.log('  1. Run: npm run dev');
console.log('  2. Open: http://localhost:3000/admin');
console.log('  3. Use the checklist in ADMIN_PAGES_STYLING_VERIFICATION.md');

console.log('\n📊 Automated Testing:\n');
console.log('  Run E2E tests: npx playwright test __tests__/e2e/admin-pages-styling.spec.ts');
console.log('  (Note: Requires Playwright browsers: npx playwright install)');

console.log('\n✅ When Complete:\n');
console.log('  • Mark task 7 as complete in .kiro/specs/css-styling-fix/tasks.md');
console.log('  • Update ADMIN_PAGES_STYLING_VERIFICATION.md with results');
console.log('  • Proceed to task 8 (Run automated tests)');

console.log('\n');

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Dev server is running at http://localhost:3000\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Dev server is not running. Start it with: npm run dev\n');
    return false;
  }
}

// Run the check
checkDevServer().catch(() => {
  console.log('❌ Could not check dev server status\n');
});
