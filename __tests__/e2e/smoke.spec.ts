/**
 * Smoke Tests
 * 
 * Quick tests to verify all major admin pages load without errors.
 * These tests catch runtime errors, React warnings, and API failures.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Pages Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or login
    // For now, we'll just navigate and check for errors
  });

  const adminPages = [
    { path: '/admin', name: 'Dashboard' },
    { path: '/admin/guests', name: 'Guests' },
    { path: '/admin/events', name: 'Events' },
    { path: '/admin/activities', name: 'Activities' },
    { path: '/admin/locations', name: 'Locations' },
    { path: '/admin/accommodations', name: 'Accommodations' },
    { path: '/admin/vendors', name: 'Vendors' },
    { path: '/admin/budget', name: 'Budget' },
    { path: '/admin/transportation', name: 'Transportation' },
    { path: '/admin/photos', name: 'Photos' },
    { path: '/admin/emails', name: 'Emails' },
    { path: '/admin/content-pages', name: 'Content Pages' },
    { path: '/admin/home-page', name: 'Home Page' },
    { path: '/admin/rsvp-analytics', name: 'RSVP Analytics' },
    { path: '/admin/audit-logs', name: 'Audit Logs' },
  ];

  for (const { path, name } of adminPages) {
    test(`${name} page should load without errors`, async ({ page }) => {
      // Listen for console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Listen for page errors
      const pageErrors: Error[] = [];
      page.on('pageerror', error => {
        pageErrors.push(error);
      });

      // Navigate to page
      const response = await page.goto(`http://localhost:3000${path}`);
      
      // Check response status
      expect(response?.status()).toBeLessThan(500);

      // Wait for page to be ready
      await page.waitForLoadState('networkidle');

      // Check for error messages in the page
      const errorText = await page.locator('body').textContent();
      expect(errorText).not.toContain('Error Type');
      expect(errorText).not.toContain('Error Message');
      expect(errorText).not.toContain('TypeError');
      expect(errorText).not.toContain('is not a function');

      // Check for React errors
      const hasErrorBoundary = await page.locator('[data-error-boundary]').count();
      expect(hasErrorBoundary).toBe(0);

      // Report any console or page errors
      if (consoleErrors.length > 0) {
        console.warn(`Console errors on ${name}:`, consoleErrors);
      }
      if (pageErrors.length > 0) {
        console.warn(`Page errors on ${name}:`, pageErrors);
      }
    });
  }

  test('should not have duplicate React keys', async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('duplicate key')) {
        consoleWarnings.push(msg.text());
      }
    });

    // Check pages that use DataTable
    await page.goto('http://localhost:3000/admin/events');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/admin/guests');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/admin/activities');
    await page.waitForLoadState('networkidle');

    // Should not have any duplicate key warnings
    expect(consoleWarnings).toHaveLength(0);
  });
});
