import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('CSS Hot Reload', () => {
  const globalsCssPath = path.join(process.cwd(), 'app/globals.css');
  let originalContent: string;

  test.beforeAll(() => {
    // Save original content
    originalContent = fs.readFileSync(globalsCssPath, 'utf-8');
  });

  test.afterAll(() => {
    // Restore original content
    fs.writeFileSync(globalsCssPath, originalContent, 'utf-8');
  });

  test('should hot reload CSS changes within 2 seconds without full page reload', async ({ page }) => {
    // Navigate to home page (no auth required)
    await page.goto('http://localhost:3000/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Get initial background color
    const initialBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log('Initial background color:', initialBgColor);
    
    // Add a marker to detect if page reloads
    await page.evaluate(() => {
      (window as any).hotReloadMarker = 'test-marker-' + Date.now();
    });
    
    const markerBefore = await page.evaluate(() => (window as any).hotReloadMarker);
    
    // Make a CSS change - change body background to light blue
    const modifiedContent = originalContent.replace(
      'background-color: #f9fafb;',
      'background-color: #e0f2fe; /* Hot reload test */'
    );
    fs.writeFileSync(globalsCssPath, modifiedContent, 'utf-8');
    
    console.log('CSS file modified, waiting for hot reload...');
    
    // Wait up to 2 seconds for the change to appear
    const startTime = Date.now();
    await page.waitForFunction(
      (expectedColor) => {
        const currentColor = window.getComputedStyle(document.body).backgroundColor;
        // Convert rgb to hex or compare rgb values
        // #e0f2fe is rgb(224, 242, 254)
        return currentColor === 'rgb(224, 242, 254)' || currentColor === '#e0f2fe';
      },
      null,
      { timeout: 2000 }
    );
    const elapsedTime = Date.now() - startTime;
    
    console.log(`CSS change detected in ${elapsedTime}ms`);
    
    // Verify the change appeared within 2 seconds
    expect(elapsedTime).toBeLessThan(2000);
    
    // Get the new background color
    const newBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log('New background color:', newBgColor);
    
    // Verify the color changed
    expect(newBgColor).toBe('rgb(224, 242, 254)');
    expect(newBgColor).not.toBe(initialBgColor);
    
    // Verify no full page reload occurred by checking our marker
    const markerAfter = await page.evaluate(() => (window as any).hotReloadMarker);
    expect(markerAfter).toBe(markerBefore);
    console.log('Page state preserved - no full reload occurred');
    
    // Verify page state is preserved by checking if content is still there
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(0);
  });
});
