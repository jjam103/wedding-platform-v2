#!/usr/bin/env node

/**
 * Diagnostic script to check if form buttons are rendering
 * Run this while the dev server is running and a form is open
 */

console.log('Form Button Diagnostic');
console.log('======================\n');

console.log('This script helps diagnose missing form buttons.');
console.log('\nTo use:');
console.log('1. Open your browser to an admin page (e.g., /admin/guests)');
console.log('2. Click "+ Add Guest" to open the form');
console.log('3. Open browser DevTools (F12)');
console.log('4. Run these commands in the Console:\n');

console.log('// Check if form exists');
console.log('document.querySelector(\'form\')');
console.log('');

console.log('// Check if submit button exists');
console.log('document.querySelector(\'button[type="submit"]\')');
console.log('');

console.log('// Check all buttons in the form');
console.log('document.querySelectorAll(\'form button\')');
console.log('');

console.log('// Check the collapsible content height');
console.log('const content = document.querySelector(\'#collapsible-form-content\');');
console.log('console.log({');
console.log('  maxHeight: content?.style.maxHeight,');
console.log('  scrollHeight: content?.scrollHeight,');
console.log('  clientHeight: content?.clientHeight,');
console.log('  overflow: getComputedStyle(content).overflow');
console.log('});');
console.log('');

console.log('// Check if buttons are hidden by CSS');
console.log('const submitBtn = document.querySelector(\'button[type="submit"]\');');
console.log('if (submitBtn) {');
console.log('  const styles = getComputedStyle(submitBtn);');
console.log('  console.log({');
console.log('    display: styles.display,');
console.log('    visibility: styles.visibility,');
console.log('    opacity: styles.opacity,');
console.log('    position: styles.position,');
console.log('    top: styles.top,');
console.log('    bottom: styles.bottom');
console.log('  });');
console.log('}');
console.log('');

console.log('// Get the form HTML');
console.log('document.querySelector(\'form\')?.outerHTML');
console.log('');

console.log('\n======================');
console.log('Expected Results:');
console.log('- form: Should return a <form> element');
console.log('- submit button: Should return a <button type="submit">');
console.log('- maxHeight: Should be a large number (e.g., "1000px" or actual height)');
console.log('- display: Should be "flex" or "inline-flex" (not "none")');
console.log('- visibility: Should be "visible" (not "hidden")');
console.log('- opacity: Should be "1" (not "0")');
