/**
 * Script to verify color contrast ratios for WCAG 2.1 AA compliance
 * 
 * Run with: npx ts-node scripts/verify-color-contrast.ts
 */

import {
  getContrastRatio,
  meetsWCAG_AA,
  commonColorCombinations,
} from '../utils/colorContrast';

console.log('🎨 Verifying Color Contrast Ratios for WCAG 2.1 AA Compliance\n');
console.log('=' .repeat(80));
console.log('\n');

let allPass = true;
let totalCombinations = 0;
let passingCombinations = 0;

commonColorCombinations.forEach((combo) => {
  totalCombinations++;
  
  const ratio = getContrastRatio(combo.foreground, combo.background);
  
  // Determine if this is large text (buttons, headings) or normal text
  const isLargeText = combo.usage.toLowerCase().includes('button') || 
                      combo.usage.toLowerCase().includes('heading') ||
                      combo.usage.toLowerCase().includes('badge');
  
  const level = isLargeText ? 'large' : 'normal';
  const passes = meetsWCAG_AA(ratio, level);
  
  if (passes) {
    passingCombinations++;
  } else {
    allPass = false;
  }
  
  const status = passes ? '✅ PASS' : '❌ FAIL';
  const threshold = level === 'large' ? '3:1' : '4.5:1';
  
  console.log(`${status} ${combo.usage}`);
  console.log(`  Foreground: ${combo.foreground}`);
  console.log(`  Background: ${combo.background}`);
  console.log(`  Contrast Ratio: ${ratio.toFixed(2)}:1 (Required: ${threshold})`);
  console.log(`  Text Size: ${level === 'large' ? 'Large (18pt+)' : 'Normal'}`);
  console.log('');
});

console.log('=' .repeat(80));
console.log('\n');
console.log(`📊 Summary: ${passingCombinations}/${totalCombinations} combinations pass WCAG 2.1 AA`);

if (allPass) {
  console.log('✅ All color combinations meet WCAG 2.1 AA standards!');
  process.exit(0);
} else {
  console.log('❌ Some color combinations do not meet WCAG 2.1 AA standards.');
  console.log('   Please update the color palette or usage guidelines.');
  process.exit(1);
}
