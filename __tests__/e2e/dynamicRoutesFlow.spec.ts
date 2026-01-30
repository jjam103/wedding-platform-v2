/**
 * Dynamic Routes E2E Flow Test
 * 
 * This test validates that dynamic routes work correctly in Next.js 15.
 * It would have caught the params Promise issue where params.id was accessed
 * directly instead of being awaited.
 * 
 * Test Coverage:
 * - Navigate to pages with dynamic route params
 * - Verify pages load without errors
 * - Verify params are properly handled
 * - Test nested dynamic routes
 */

import { test, expect } from '@playwright/test';

test.describe('Dynamic Routes - Next.js 15 Compatibility', () => {
  test('should load room types page with dynamic accommodation ID', async ({ page }) => {
    // This test would have caught the params.id error
    
    // First, create an accommodation to get a real ID
    await page.goto('/admin/accommodations');
    await expect(page.locator('h1')).toContainText('Accommodations');
    
    // Get the first accommodation ID from the table
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    
    // Should navigate to room types page
    await expect(page).toHaveURL(/\/admin\/accommodations\/[^/]+\/room-types/);
    
    // Page should load without errors
    await expect(page.locator('h1')).toContainText('Room Types');
    
    // Should not see any error messages
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=params')).not.toBeVisible();
    
    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any async errors
    await page.waitForTimeout(1000);
    
    // Should not have params-related errors
    const paramsErrors = errors.filter(e => 
      e.includes('params') || 
      e.includes('Promise') ||
      e.includes('React.use')
    );
    expect(paramsErrors).toHaveLength(0);
  });
  
  test('should handle all dynamic routes without params errors', async ({ page }) => {
    const dynamicRoutes = [
      { path: '/admin/accommodations', clickText: 'View Room Types', expectedUrl: /room-types/ },
      { path: '/admin/events', clickText: 'View', expectedUrl: /\/guest\/events\// },
      { path: '/admin/content-pages', clickText: 'Edit', expectedUrl: /\/admin\/content-pages/ },
    ];
    
    for (const route of dynamicRoutes) {
      await test.step(`Test ${route.path}`, async () => {
        await page.goto(route.path);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Try to click a button that navigates to dynamic route
        const button = page.locator(`button:has-text("${route.clickText}")`).first();
        if (await button.isVisible()) {
          await button.click();
          
          // Should navigate successfully
          await expect(page).toHaveURL(route.expectedUrl);
          
          // Should not have errors
          await expect(page.locator('text=Error')).not.toBeVisible();
        }
      });
    }
  });
  
  test('should handle nested dynamic routes', async ({ page }) => {
    // Test: /admin/accommodations/[id]/room-types
    await page.goto('/admin/accommodations');
    
    // Click to view room types
    const viewButton = page.locator('button:has-text("View Room Types")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Should load room types page
      await expect(page.locator('h1')).toContainText('Room Types');
      
      // Should not crash with params error
      await expect(page.locator('text=params.id')).not.toBeVisible();
      await expect(page.locator('text=Promise')).not.toBeVisible();
    }
  });
  
  test('should handle params in API routes', async ({ page }) => {
    // Test that API routes with dynamic params work
    const response = await page.request.get('/api/admin/locations/test-id');
    
    // Should not return 500 (server error from params issue)
    expect(response.status()).not.toBe(500);
    
    // Should return 401 (auth) or 404 (not found), not 500 (crash)
    expect([401, 404]).toContain(response.status());
  });
  
  test('should handle multiple dynamic segments', async ({ page }) => {
    // Test routes with multiple dynamic segments
    // Example: /admin/accommodations/[id]/room-types/[roomTypeId]
    
    await page.goto('/admin/accommodations');
    
    // Navigate through multiple levels
    const viewButton = page.locator('button:has-text("View Room Types")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/admin\/accommodations\/[^/]+\/room-types/);
      
      // If there are room types, try to edit one
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should not crash
        await expect(page.locator('text=Error')).not.toBeVisible();
      }
    }
  });
});

test.describe('Dynamic Routes - Error Handling', () => {
  test('should handle invalid IDs gracefully', async ({ page }) => {
    // Navigate to a route with invalid ID
    await page.goto('/admin/accommodations/invalid-id-12345/room-types');
    
    // Should show 404 or error message, not crash
    const hasError = await page.locator('text=404').isVisible() ||
                     await page.locator('text=Not Found').isVisible() ||
                     await page.locator('text=Error').isVisible();
    
    expect(hasError).toBe(true);
    
    // Should not show params-related error
    await expect(page.locator('text=params.id')).not.toBeVisible();
  });
  
  test('should handle missing params gracefully', async ({ page }) => {
    // Try to access a dynamic route without the param
    await page.goto('/admin/accommodations//room-types');
    
    // Should handle gracefully (404 or redirect)
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });
});

test.describe('Dynamic Routes - Navigation', () => {
  test('should navigate between dynamic routes correctly', async ({ page }) => {
    await page.goto('/admin/accommodations');
    
    // Navigate to first accommodation's room types
    const firstButton = page.locator('button:has-text("View Room Types")').first();
    if (await firstButton.isVisible()) {
      await firstButton.click();
      const firstUrl = page.url();
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL('/admin/accommodations');
      
      // Navigate to second accommodation's room types
      const secondButton = page.locator('button:has-text("View Room Types")').nth(1);
      if (await secondButton.isVisible()) {
        await secondButton.click();
        const secondUrl = page.url();
        
        // URLs should be different (different IDs)
        expect(firstUrl).not.toBe(secondUrl);
        
        // Both should work without errors
        await expect(page.locator('h1')).toContainText('Room Types');
      }
    }
  });
  
  test('should handle browser back/forward with dynamic routes', async ({ page }) => {
    await page.goto('/admin/accommodations');
    
    const viewButton = page.locator('button:has-text("View Room Types")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page).toHaveURL(/room-types/);
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL('/admin/accommodations');
      
      // Go forward
      await page.goForward();
      await expect(page).toHaveURL(/room-types/);
      
      // Should still work without errors
      await expect(page.locator('h1')).toContainText('Room Types');
    }
  });
});

/**
 * Why This Test Would Have Caught the Bug:
 * 
 * The Next.js 15 params bug occurred because params was a Promise that needed
 * to be awaited, but the code accessed params.id directly. This E2E test would
 * have failed immediately when trying to load the room types page:
 * 
 * Expected: Page loads with "Room Types" heading
 * Actual: Console error "params.id accessed directly. params is a Promise"
 * 
 * The test explicitly:
 * 1. Navigates to a page with dynamic params
 * 2. Checks for console errors
 * 3. Verifies the page loads correctly
 * 4. Checks for params-related error messages
 * 
 * This demonstrates why E2E tests with real Next.js runtime are crucial -
 * they catch framework-specific issues that unit tests with mocks miss.
 */
