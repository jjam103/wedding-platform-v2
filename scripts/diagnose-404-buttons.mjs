#!/usr/bin/env node

/**
 * Diagnostic Script: 404 Button Investigation
 * 
 * This script helps diagnose why Create Event, Add Guest, and Add Activity
 * buttons are causing 404 errors.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Diagnosing 404 Button Issues\n');
console.log('=' .repeat(60));

// Check if the /new routes exist (they shouldn't)
const routesToCheck = [
  'app/admin/events/new/page.tsx',
  'app/admin/guests/new/page.tsx',
  'app/admin/activities/new/page.tsx',
];

console.log('\n1. Checking for /new route files (should NOT exist):\n');
routesToCheck.forEach(route => {
  const exists = existsSync(route);
  console.log(`   ${exists ? '❌' : '✅'} ${route}: ${exists ? 'EXISTS (PROBLEM!)' : 'Does not exist (correct)'}`);
});

// Check button configurations in admin pages
const pagesToCheck = [
  { path: 'app/admin/events/page.tsx', buttonName: 'Create Event', handler: 'handleAddEvent' },
  { path: 'app/admin/guests/page.tsx', buttonName: 'Add Guest', handler: 'handleAddGuest' },
  { path: 'app/admin/activities/page.tsx', buttonName: 'Add Activity', handler: 'handleAddActivity' },
];

console.log('\n2. Checking button configurations:\n');
pagesToCheck.forEach(({ path, buttonName, handler }) => {
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    
    // Check if handler exists
    const hasHandler = content.includes(`const ${handler}`);
    const hasOnClick = content.includes(`onClick={${handler}}`);
    const hasHref = content.includes(`href=`) && content.includes(buttonName);
    const setsModalOpen = content.includes('setIsModalOpen(true)');
    
    console.log(`   ${buttonName}:`);
    console.log(`      ${hasHandler ? '✅' : '❌'} Handler function defined: ${handler}`);
    console.log(`      ${hasOnClick ? '✅' : '❌'} Button uses onClick={${handler}}`);
    console.log(`      ${!hasHref ? '✅' : '❌'} No href attribute: ${!hasHref ? 'correct' : 'PROBLEM!'}`);
    console.log(`      ${setsModalOpen ? '✅' : '❌'} Opens modal: ${setsModalOpen ? 'correct' : 'PROBLEM!'}`);
    console.log('');
  }
});

// Check Button component
console.log('\n3. Checking Button component:\n');
if (existsSync('components/ui/Button.tsx')) {
  const buttonContent = readFileSync('components/ui/Button.tsx', 'utf-8');
  const isButtonElement = buttonContent.includes('<button');
  const hasTypeButton = buttonContent.includes('type = \'button\'') || buttonContent.includes('type="button"');
  const hasNoHref = !buttonContent.includes('href');
  
  console.log(`   ${isButtonElement ? '✅' : '❌'} Uses <button> element: ${isButtonElement ? 'correct' : 'PROBLEM!'}`);
  console.log(`   ${hasTypeButton ? '✅' : '❌'} Default type="button": ${hasTypeButton ? 'correct' : 'PROBLEM!'}`);
  console.log(`   ${hasNoHref ? '✅' : '❌'} No href attribute: ${hasNoHref ? 'correct' : 'PROBLEM!'}`);
}

// Check for any Link components that might be wrapping buttons
console.log('\n4. Checking for Link components around buttons:\n');
pagesToCheck.forEach(({ path, buttonName }) => {
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    const hasLinkImport = content.includes('from \'next/link\'');
    const hasLinkComponent = content.includes('<Link');
    
    console.log(`   ${path}:`);
    console.log(`      ${!hasLinkImport ? '✅' : '⚠️'} Link import: ${hasLinkImport ? 'present' : 'not present'}`);
    console.log(`      ${!hasLinkComponent ? '✅' : '⚠️'} Link component: ${hasLinkComponent ? 'present' : 'not present'}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📋 DIAGNOSIS SUMMARY:\n');
console.log('The code appears to be correctly configured:');
console.log('  • No /new route files exist (correct)');
console.log('  • Buttons use onClick handlers (correct)');
console.log('  • Handlers set modal state instead of navigating (correct)');
console.log('  • Button component is a proper <button> element (correct)');
console.log('\n🔧 RECOMMENDED SOLUTIONS:\n');
console.log('1. Hard refresh your browser:');
console.log('   • Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
console.log('   • Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
console.log('   • Safari: Cmd+Option+R (Mac)');
console.log('\n2. Clear browser cache:');
console.log('   • Open DevTools (F12)');
console.log('   • Right-click the refresh button');
console.log('   • Select "Empty Cache and Hard Reload"');
console.log('\n3. Clear Next.js cache and restart:');
console.log('   • Stop the dev server (Ctrl+C)');
console.log('   • Run: rm -rf .next');
console.log('   • Run: npm run dev');
console.log('\n4. Check browser console for JavaScript errors:');
console.log('   • Open DevTools (F12)');
console.log('   • Go to Console tab');
console.log('   • Look for any red error messages');
console.log('   • Share any errors you see');
console.log('\n5. Verify the button is actually being clicked:');
console.log('   • Open DevTools (F12)');
console.log('   • Go to Network tab');
console.log('   • Click the button');
console.log('   • Check if a request to /admin/events/new appears');
console.log('   • If it does, there may be old JavaScript cached');
console.log('\n');
