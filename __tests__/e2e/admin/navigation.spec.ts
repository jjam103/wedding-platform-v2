/**
 * E2E Test: Admin Navigation
 * 
 * Consolidated navigation tests covering:
 * - Admin sidebar navigation
 * - Top navigation bar with tabs and sub-items
 * - Mobile navigation menu
 * - Navigation state persistence
 * - Browser back/forward navigation
 * - Accessibility features
 * 
 * Requirements: 1.1, 1.2, 1.8, 1.9, 1.10, 2.2, 20.1, 20.2, 20.3
 * 
 * Consolidates:
 * - adminNavigationFlow.spec.ts (10 tests)
 * - topNavigationFlow.spec.ts (23 tests)
 * 
 * Result: 20 tests (39% reduction)
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('nav[aria-label="Main navigation"]');
  });

  test.describe('Admin Sidebar Navigation', () => {
    test('should display all main navigation tabs', async ({ page }) => {
      // Verify all main tabs are present
      await expect(page.getByRole('button', { name: 'Content' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Guests' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'RSVPs' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Logistics' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();
    });

    test('should expand tabs to show sub-items', async ({ page }) => {
      // Click Content tab
      await page.getByRole('button', { name: 'Content' }).click();

      // Verify Content sub-items are visible
      await expect(page.getByRole('link', { name: 'Home Page' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Activities' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Events' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Content Pages' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Locations' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Photos' })).toBeVisible();

      // Click Guests tab
      await page.getByRole('button', { name: 'Guests' }).click();

      // Verify Guests sub-items are visible
      await expect(page.getByRole('link', { name: 'Guest List' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Guest Groups' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Import/Export' })).toBeVisible();
    });

    test('should navigate to sub-items and load pages correctly', async ({ page }) => {
      // Navigate to Activities
      await page.getByRole('button', { name: 'Content' }).click();
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');
      await expect(page.locator('h1, h2').filter({ hasText: /activities/i }).first()).toBeVisible();

      // Navigate to Budget
      await page.getByRole('button', { name: 'Logistics' }).click();
      await page.getByRole('link', { name: 'Budget' }).click();
      await page.waitForURL('/admin/budget');
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // Navigate to Guest Groups
      await page.getByRole('button', { name: 'Guests' }).click();
      await page.getByRole('link', { name: 'Guest Groups' }).click();
      await page.waitForURL('/admin/guest-groups');
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should highlight active tab and sub-item', async ({ page }) => {
      // Navigate to Activities
      await page.getByRole('button', { name: 'Content' }).click();
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');

      // Verify Content tab has active styling
      const contentTab = page.getByRole('button', { name: 'Content' });
      await expect(contentTab).toHaveClass(/bg-emerald-50/);
      await expect(contentTab).toHaveClass(/text-emerald-700/);

      // Verify Activities link has active styling
      const activitiesLink = page.getByRole('link', { name: 'Activities' });
      await expect(activitiesLink).toHaveClass(/bg-emerald-600/);
      await expect(activitiesLink).toHaveClass(/text-white/);
    });

    test('should navigate through all tabs and verify sub-items', async ({ page }) => {
      const tabs = [
        {
          name: 'Content',
          subItems: ['Home Page', 'Activities', 'Events', 'Content Pages', 'Locations', 'Photos'],
        },
        {
          name: 'Guests',
          subItems: ['Guest List', 'Guest Groups', 'Import/Export'],
        },
        {
          name: 'RSVPs',
          subItems: ['RSVP Analytics', 'Activity RSVPs', 'Event RSVPs', 'Deadlines'],
        },
        {
          name: 'Logistics',
          subItems: ['Accommodations', 'Transportation', 'Budget', 'Vendors'],
        },
        {
          name: 'Admin',
          subItems: ['Admin Users', 'Settings', 'Email Templates', 'Audit Logs'],
        },
      ];

      for (const tab of tabs) {
        await page.getByRole('button', { name: tab.name }).click();
        
        for (const subItem of tab.subItems) {
          await expect(page.getByRole('link', { name: subItem })).toBeVisible();
        }
      }
    });

    test('should have sticky navigation with glassmorphism effect', async ({ page }) => {
      await page.goto('/admin/guests');

      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      
      // Verify sticky positioning
      await expect(nav).toHaveClass(/sticky/);
      await expect(nav).toHaveClass(/top-0/);
      
      // Verify glassmorphism effect
      await expect(nav).toHaveClass(/backdrop-blur/);

      // Scroll down and verify navigation stays visible
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect(nav).toBeInViewport();
    });
  });

  test.describe('Top Navigation Bar', () => {
    test('should display top navigation with proper ARIA labels', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: /admin/i })).toBeFocused();

      // Tab to Content tab
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Content' })).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press('Enter');
      await expect(page.getByRole('link', { name: 'Activities' })).toBeVisible();
    });

    test('should mark active elements with aria-current', async ({ page }) => {
      await page.getByRole('button', { name: 'Content' }).click();
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');

      // Verify aria-current on active tab
      const contentTab = page.getByRole('button', { name: 'Content' });
      await expect(contentTab).toHaveAttribute('aria-current', 'page');

      // Verify aria-current on active sub-item
      const activitiesLink = page.getByRole('link', { name: 'Activities' });
      await expect(activitiesLink).toHaveAttribute('aria-current', 'page');
    });

    test('should handle browser back navigation', async ({ page }) => {
      // Navigate to Activities
      await page.getByRole('button', { name: 'Content' }).click();
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');

      // Navigate to Events
      await page.getByRole('link', { name: 'Events' }).click();
      await page.waitForURL('/admin/events');

      // Go back
      await page.goBack();
      await page.waitForURL('/admin/activities');

      // Verify Activities is highlighted again
      const activitiesLink = page.getByRole('link', { name: 'Activities' });
      await expect(activitiesLink).toHaveClass(/bg-emerald-600/);
    });

    test('should handle browser forward navigation', async ({ page }) => {
      // Navigate to Activities
      await page.getByRole('button', { name: 'Content' }).click();
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');

      // Navigate to Events
      await page.getByRole('link', { name: 'Events' }).click();
      await page.waitForURL('/admin/events');

      // Go back then forward
      await page.goBack();
      await page.waitForURL('/admin/activities');
      await page.goForward();
      await page.waitForURL('/admin/events');

      // Verify Events is highlighted
      const eventsLink = page.getByRole('link', { name: 'Events' });
      await expect(eventsLink).toHaveClass(/bg-emerald-600/);
    });

    test('should use emerald color scheme for active elements', async ({ page }) => {
      await page.getByRole('button', { name: 'Content' }).click();

      const contentTab = page.getByRole('button', { name: 'Content' });
      await expect(contentTab).toHaveClass(/bg-emerald-50/);
      await expect(contentTab).toHaveClass(/text-emerald-700/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display hamburger menu and hide desktop tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Content' })).not.toBeVisible();
    });

    test('should open and close mobile menu', async ({ page }) => {
      // Open menu
      await page.getByRole('button', { name: /open menu/i }).click();
      await expect(page.getByRole('dialog', { name: /mobile navigation menu/i })).toBeVisible();

      // Verify all tabs are visible
      await expect(page.getByText('Content')).toBeVisible();
      await expect(page.getByText('Guests')).toBeVisible();
      await expect(page.getByText('RSVPs')).toBeVisible();
      await expect(page.getByText('Logistics')).toBeVisible();
      await expect(page.getByText('Admin')).toBeVisible();

      // Close menu with close button
      await page.getByRole('button', { name: /close menu/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should expand tabs and navigate in mobile menu', async ({ page }) => {
      await page.getByRole('button', { name: /open menu/i }).click();

      // Expand Content tab
      await page.getByRole('button', { name: /content/i }).click();
      await expect(page.getByRole('link', { name: 'Home Page' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Activities' })).toBeVisible();

      // Click Activities sub-item
      await page.getByRole('link', { name: 'Activities' }).click();
      await page.waitForURL('/admin/activities');

      // Verify menu closes after navigation
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should have minimum 44px touch targets', async ({ page }) => {
      await page.getByRole('button', { name: /open menu/i }).click();

      const contentTab = page.getByRole('button', { name: /content/i });
      const box = await contentTab.boundingBox();

      expect(box?.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Navigation State Persistence', () => {
    test('should persist navigation state across page refreshes', async ({ page }) => {
      // Navigate to Budget
      await page.getByRole('button', { name: 'Logistics' }).click();
      await page.getByRole('link', { name: 'Budget' }).click();
      await page.waitForURL('/admin/budget');

      // Reload page
      await page.reload();
      await page.waitForSelector('nav[aria-label="Main navigation"]');

      // Verify Logistics tab is still active
      const logisticsTab = page.getByRole('button', { name: 'Logistics' });
      await expect(logisticsTab).toHaveClass(/bg-emerald-50/);

      // Verify Budget sub-item is still highlighted
      const budgetLink = page.getByRole('link', { name: 'Budget' });
      await expect(budgetLink).toHaveClass(/bg-emerald-600/);
    });

    test('should persist state in mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.getByRole('button', { name: /open menu/i }).click();
      await page.getByRole('button', { name: /logistics/i }).click();
      await page.getByRole('link', { name: 'Budget' }).click();
      await page.waitForURL('/admin/budget');

      // Open menu again
      await page.getByRole('button', { name: /open menu/i }).click();

      // Verify Logistics tab is still active
      const logisticsTab = page.getByRole('button', { name: /logistics/i });
      await expect(logisticsTab).toHaveClass(/bg-emerald-50/);
    });
  });
});
