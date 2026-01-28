/**
 * Script to verify color contrast ratios for WCAG 2.1 AA compliance
 * 
 * Run with: node scripts/verify-color-contrast.mjs
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 */
function getRelativeLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG 2.1 AA standards
 */
function meetsWCAG_AA(ratio, level = 'normal') {
  const threshold = level === 'normal' ? 4.5 : 3.0;
  return ratio >= threshold;
}

/**
 * Common color combinations used in the UI
 */
const commonColorCombinations = [
  // Primary text on white backgrounds
  { foreground: '#15803d', background: '#ffffff', usage: 'Primary text (jungle-700)' },
  { foreground: '#0369a1', background: '#ffffff', usage: 'Links (ocean-700)' },
  { foreground: '#111827', background: '#ffffff', usage: 'Body text (sage-900)' },
  
  // White text on colored backgrounds
  { foreground: '#ffffff', background: '#16a34a', usage: 'Primary buttons (jungle-600)' },
  { foreground: '#ffffff', background: '#0284c7', usage: 'Info badges (ocean-600)' },
  { foreground: '#ffffff', background: '#ea580c', usage: 'Warning badges (sunset-600)' },
  { foreground: '#ffffff', background: '#dc2626', usage: 'Error badges (volcano-600)' },
  { foreground: '#ffffff', background: '#111827', usage: 'Footer (sage-900)' },
  
  // Colored text on light backgrounds
  { foreground: '#15803d', background: '#f0fdf4', usage: 'Success messages (jungle-700 on jungle-50)' },
  { foreground: '#0369a1', background: '#f0f9ff', usage: 'Info messages (ocean-700 on ocean-50)' },
  { foreground: '#c2410c', background: '#fff7ed', usage: 'Warning messages (sunset-700 on sunset-50)' },
  { foreground: '#b91c1c', background: '#fef2f2', usage: 'Error messages (volcano-700 on volcano-50)' },
  
  // Secondary text
  { foreground: '#374151', background: '#ffffff', usage: 'Secondary text (sage-700)' },
  { foreground: '#4b5563', background: '#ffffff', usage: 'Placeholder text (sage-600)' },
];

console.log('🎨 Verifying Color Contrast Ratios for WCAG 2.1 AA Compliance\n');
console.log('='.repeat(80));
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

console.log('='.repeat(80));
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
