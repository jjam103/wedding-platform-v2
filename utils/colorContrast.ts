/**
 * Color Contrast Utilities
 * 
 * Utilities for calculating color contrast ratios and validating
 * WCAG 2.1 AA compliance for the Costa Rica theme palette.
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
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
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getContrastRatio(color1: string, color2: string): number {
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
 * 
 * @param ratio - Contrast ratio
 * @param level - 'normal' for normal text (4.5:1), 'large' for large text (3:1)
 * @returns true if ratio meets the standard
 */
export function meetsWCAG_AA(ratio: number, level: 'normal' | 'large' = 'normal'): boolean {
  const threshold = level === 'normal' ? 4.5 : 3.0;
  return ratio >= threshold;
}

/**
 * Check if contrast ratio meets WCAG 2.1 AAA standards
 * 
 * @param ratio - Contrast ratio
 * @param level - 'normal' for normal text (7:1), 'large' for large text (4.5:1)
 * @returns true if ratio meets the standard
 */
export function meetsWCAG_AAA(ratio: number, level: 'normal' | 'large' = 'normal'): boolean {
  const threshold = level === 'normal' ? 7.0 : 4.5;
  return ratio >= threshold;
}

/**
 * Costa Rica theme color palette
 */
export const costaRicaColors = {
  jungle: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  sunset: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  volcano: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  sage: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  cloud: {
    50: '#ffffff',
    100: '#fefefe',
    200: '#fafafa',
    300: '#f5f5f5',
    400: '#efefef',
    500: '#e5e5e5',
    600: '#d4d4d4',
    700: '#a3a3a3',
    800: '#737373',
    900: '#525252',
  },
};

/**
 * Common color combinations used in the UI
 */
export const commonColorCombinations = [
  // Primary text on white backgrounds - use darker shades (700+) for AA compliance
  { foreground: costaRicaColors.jungle[700], background: costaRicaColors.cloud[50], usage: 'Primary text' },
  { foreground: costaRicaColors.ocean[700], background: costaRicaColors.cloud[50], usage: 'Links' },
  { foreground: costaRicaColors.sage[900], background: costaRicaColors.cloud[50], usage: 'Body text' },
  
  // White text on colored backgrounds - 500 shades work for large text (buttons)
  { foreground: costaRicaColors.cloud[50], background: costaRicaColors.jungle[600], usage: 'Primary buttons' },
  { foreground: costaRicaColors.cloud[50], background: costaRicaColors.ocean[600], usage: 'Info badges' },
  { foreground: costaRicaColors.cloud[50], background: costaRicaColors.sunset[600], usage: 'Warning badges' },
  { foreground: costaRicaColors.cloud[50], background: costaRicaColors.volcano[600], usage: 'Error badges' },
  { foreground: costaRicaColors.cloud[50], background: costaRicaColors.sage[900], usage: 'Footer' },
  
  // Colored text on light backgrounds - use 700+ shades for AA compliance
  { foreground: costaRicaColors.jungle[700], background: costaRicaColors.jungle[50], usage: 'Success messages' },
  { foreground: costaRicaColors.ocean[700], background: costaRicaColors.ocean[50], usage: 'Info messages' },
  { foreground: costaRicaColors.sunset[700], background: costaRicaColors.sunset[50], usage: 'Warning messages' },
  { foreground: costaRicaColors.volcano[700], background: costaRicaColors.volcano[50], usage: 'Error messages' },
  
  // Secondary text - use 600+ for AA compliance
  { foreground: costaRicaColors.sage[700], background: costaRicaColors.cloud[50], usage: 'Secondary text' },
  { foreground: costaRicaColors.sage[600], background: costaRicaColors.cloud[50], usage: 'Placeholder text' },
];
