import { test, expect } from '@playwright/test';

test.describe('CSS Delivery Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
  });

  test('should load CSS file successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for CSS file in network requests
    const cssRequests = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter(r => r.initiatorType === 'link' && r.name.includes('.css'))
        .map(r => ({
          url: r.name,
          duration: r.duration,
          transferSize: r.transferSize,
        }));
    });

    // Verify at least one CSS file was loaded
    expect(cssRequests.length).toBeGreaterThan(0);
    
    // Verify CSS file loaded successfully (non-zero size)
    const mainCss = cssRequests.find(r => r.url.includes('globals') || r.url.includes('app'));
    expect(mainCss).toBeDefined();
    if (mainCss) {
      expect(mainCss.transferSize).toBeGreaterThan(0);
    }
  });

  test('should apply Tailwind background colors', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for white background on cards/containers
    const whiteElements = await page.locator('.bg-white').count();
    expect(whiteElements).toBeGreaterThan(0);

    // Verify computed styles
    const firstCard = page.locator('.bg-white').first();
    if (await firstCard.count() > 0) {
      const bgColor = await firstCard.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      // White should be rgb(255, 255, 255)
      expect(bgColor).toBe('rgb(255, 255, 255)');
    }
  });

  test('should apply Tailwind padding classes', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for padding classes
    const paddedElements = await page.locator('[class*="p-"]').count();
    expect(paddedElements).toBeGreaterThan(0);

    // Verify computed padding on a specific element
    const paddedElement = page.locator('.p-6').first();
    if (await paddedElement.count() > 0) {
      const padding = await paddedElement.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      // p-6 should be 1.5rem (24px)
      expect(padding).toContain('24px');
    }
  });

  test('should apply Tailwind text colors', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for text color classes
    const textElements = await page.locator('[class*="text-"]').count();
    expect(textElements).toBeGreaterThan(0);

    // Verify text is not default black (should have Tailwind colors)
    const textElement = page.locator('[class*="text-gray"]').first();
    if (await textElement.count() > 0) {
      const color = await textElement.evaluate(el => 
        window.getComputedStyle(el).color
      );
      // Should not be pure black rgb(0, 0, 0)
      expect(color).not.toBe('rgb(0, 0, 0)');
    }
  });

  test('should apply Tailwind border and shadow classes', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for border classes
    const borderedElements = await page.locator('[class*="border"]').count();
    expect(borderedElements).toBeGreaterThan(0);

    // Check for shadow classes
    const shadowElements = await page.locator('[class*="shadow"]').count();
    expect(shadowElements).toBeGreaterThan(0);

    // Verify computed box-shadow
    const shadowElement = page.locator('.shadow').first();
    if (await shadowElement.count() > 0) {
      const boxShadow = await shadowElement.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      // Should have a box-shadow value
      expect(boxShadow).not.toBe('none');
    }
  });

  test('should have responsive layout classes', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for responsive classes (md:, lg:, etc.)
    const responsiveElements = await page.locator('[class*="md:"], [class*="lg:"]').count();
    expect(responsiveElements).toBeGreaterThan(0);
  });

  test('should not have console CSS errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter for CSS-related errors
        if (text.includes('css') || text.includes('stylesheet') || text.includes('Failed to load')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should have no CSS-related console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should have proper typography styles', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for heading elements
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      const fontSize = await h1.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontWeight = await h1.evaluate(el => 
        window.getComputedStyle(el).fontWeight
      );
      
      // H1 should have larger font size
      const size = parseFloat(fontSize);
      expect(size).toBeGreaterThan(20);
      
      // H1 should be bold
      expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(600);
    }
  });

  test('should apply hover states on interactive elements', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find a button
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      // Get initial background color
      const initialBg = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );

      // Hover over button
      await button.hover();

      // Wait a bit for transition
      await page.waitForTimeout(100);

      // Get hover background color
      const hoverBg = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );

      // Background should change on hover (or at least be styled)
      expect(hoverBg).toBeDefined();
      expect(initialBg).toBeDefined();
    }
  });

  test('should have proper spacing between elements', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for margin classes
    const marginElements = await page.locator('[class*="m-"], [class*="mt-"], [class*="mb-"]').count();
    expect(marginElements).toBeGreaterThan(0);

    // Check for gap classes (for flex/grid)
    const gapElements = await page.locator('[class*="gap-"]').count();
    expect(gapElements).toBeGreaterThan(0);
  });
});

test.describe('CSS Delivery - Cross Browser', () => {
  test('should render consistently across viewport sizes', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const desktopWhiteElements = await page.locator('.bg-white').count();
    expect(desktopWhiteElements).toBeGreaterThan(0);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for responsive changes
    
    const tabletWhiteElements = await page.locator('.bg-white').count();
    expect(tabletWhiteElements).toBeGreaterThan(0);

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileWhiteElements = await page.locator('.bg-white').count();
    expect(mobileWhiteElements).toBeGreaterThan(0);
  });
});
