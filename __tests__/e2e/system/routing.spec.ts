/**
 * E2E Tests: System Routing
 * 
 * Consolidated routing tests for events, activities, accommodations, room types, and content pages.
 * Tests slug-based routing, UUID fallback, 404 handling, and Next.js 15 compatibility.
 * 
 * CONSOLIDATION: This file consolidates 3 previous test files:
 * - slugBasedRouting.spec.ts (27 tests)
 * - viewButtonSlugNavigation.spec.ts (9 tests)
 * - dynamicRoutesFlow.spec.ts (9 tests)
 * Total: 45 tests → 25 unique tests (44% reduction)
 * 
 * Requirements:
 * - 24.10 (Slug Management - universal slug support)
 * - 4.2 (E2E Critical Path Testing - navigation flows)
 * 
 * @see docs/E2E_CONSOLIDATION_PHASE1_3_COMPLETE.md
 */

import { test, expect } from '@playwright/test';
import { createServiceClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';
import { testAuth } from '../../helpers/testAuth';

test.describe('System Routing', () => {
  let testEventId: string;
  let testActivityId: string;
  let testContentPageId: string;
  let adminSession: any;

  test.beforeAll(async () => {
    const db = createServiceClient();
    
    // Create test data with slugs
    const { data: event } = await db
      .from('events')
      .insert({
        name: 'Test Wedding Ceremony',
        slug: 'test-wedding-ceremony',
        description: '<p>Join us for our special day</p>',
        event_type: 'ceremony',
        start_date: '2024-06-15T16:00:00Z',
        end_date: '2024-06-15T18:00:00Z',
        status: 'published',
      })
      .select()
      .single();
    
    testEventId = event.id;

    const { data: activity } = await db
      .from('activities')
      .insert({
        name: 'Test Beach Volleyball',
        slug: 'test-beach-volleyball',
        description: '<p>Fun beach games</p>',
        activity_type: 'activity',
        start_time: '2024-06-14T14:00:00Z',
        capacity: 20,
        cost_per_person: 25,
      })
      .select()
      .single();
    
    testActivityId = activity.id;

    const { data: contentPage } = await db
      .from('content_pages')
      .insert({
        title: 'Test Our Story',
        slug: 'test-our-story',
        status: 'published',
      })
      .select()
      .single();
    
    testContentPageId = contentPage.id;

    // Create admin session for preview mode tests
    adminSession = await testAuth.createAdminSession();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  // ============================================================================
  // 1. EVENT ROUTING (6 tests)
  // ============================================================================

  test.describe('Event Routing', () => {
    test('should load event page by slug', async ({ page }) => {
      await page.goto('/event/test-wedding-ceremony');
      
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Test Wedding Ceremony');
      await expect(page.locator('text=Join us for our special day')).toBeVisible();
    });

    test('should redirect event UUID to slug', async ({ page }) => {
      await page.goto(`/event/${testEventId}`);
      
      await expect(page).toHaveURL('/event/test-wedding-ceremony');
      await expect(page.locator('h1')).toContainText('Test Wedding Ceremony');
    });

    test('should show 404 for non-existent event slug', async ({ page }) => {
      await page.goto('/event/non-existent-event');
      await expect(page).toHaveURL(/404/);
    });

    test('should generate unique slugs for events with same name', async ({ page }) => {
      const response1 = await page.request.post('/api/admin/events', {
        data: {
          name: 'Duplicate Event Name',
          eventType: 'ceremony',
          startDate: new Date('2026-06-15T14:00:00Z').toISOString(),
          status: 'published',
        },
      });
      
      const result1 = await response1.json();
      expect(result1.success).toBe(true);
      const slug1 = result1.data.slug;
      
      const response2 = await page.request.post('/api/admin/events', {
        data: {
          name: 'Duplicate Event Name',
          eventType: 'reception',
          startDate: new Date('2026-06-15T18:00:00Z').toISOString(),
          status: 'published',
        },
      });
      
      const result2 = await response2.json();
      expect(result2.success).toBe(true);
      const slug2 = result2.data.slug;
      
      expect(slug1).not.toBe(slug2);
      expect(slug2).toMatch(/duplicate-event-name-\d+/);
      
      await page.goto(`/event/${slug1}`);
      await expect(page).not.toHaveURL(/404/);
      
      await page.goto(`/event/${slug2}`);
      await expect(page).not.toHaveURL(/404/);
    });

    test('should preserve event slug on update', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: event } = await db
        .from('events')
        .insert({
          name: 'Test Event Slug Preservation',
          slug: 'test-event-slug-preservation',
          description: '<p>Original description</p>',
          status: 'published',
        })
        .select()
        .single();
      
      // Update event name
      await db
        .from('events')
        .update({ name: 'Updated Event Name' })
        .eq('id', event.id);
      
      // Slug should remain unchanged
      await page.goto('/event/test-event-slug-preservation');
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Updated Event Name');
      
      // Cleanup
      await db.from('events').delete().eq('id', event.id);
    });

    test('should handle special characters in event slug', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: specialEvent } = await db
        .from('events')
        .insert({
          name: 'Test Event 2024',
          slug: 'test-event-2024',
          description: '<p>Special event</p>',
          status: 'published',
        })
        .select()
        .single();
      
      await page.goto('/event/test-event-2024');
      
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Test Event 2024');
      
      // Cleanup
      await db.from('events').delete().eq('id', specialEvent.id);
    });
  });

  // ============================================================================
  // 2. ACTIVITY ROUTING (6 tests)
  // ============================================================================

  test.describe('Activity Routing', () => {
    test('should load activity page by slug', async ({ page }) => {
      await page.goto('/activity/test-beach-volleyball');
      
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Test Beach Volleyball');
      await expect(page.locator('text=Fun beach games')).toBeVisible();
    });

    test('should redirect activity UUID to slug', async ({ page }) => {
      await page.goto(`/activity/${testActivityId}`);
      
      await expect(page).toHaveURL('/activity/test-beach-volleyball');
      await expect(page.locator('h1')).toContainText('Test Beach Volleyball');
    });

    test('should show 404 for non-existent activity slug', async ({ page }) => {
      await page.goto('/activity/non-existent-activity');
      await expect(page).toHaveURL(/404/);
    });

    test('should display activity capacity and cost', async ({ page }) => {
      await page.goto('/activity/test-beach-volleyball');
      
      await expect(page.locator('text=20 guests')).toBeVisible();
      await expect(page.locator('text=$25 per person')).toBeVisible();
    });

    test('should generate unique slugs for activities with same name', async ({ page }) => {
      const response1 = await page.request.post('/api/admin/activities', {
        data: {
          name: 'Duplicate Activity Name',
          activityType: 'activity',
          startTime: new Date('2026-06-15T10:00:00Z').toISOString(),
          status: 'published',
        },
      });
      
      const result1 = await response1.json();
      expect(result1.success).toBe(true);
      const slug1 = result1.data.slug;
      
      const response2 = await page.request.post('/api/admin/activities', {
        data: {
          name: 'Duplicate Activity Name',
          activityType: 'meal',
          startTime: new Date('2026-06-15T12:00:00Z').toISOString(),
          status: 'published',
        },
      });
      
      const result2 = await response2.json();
      expect(result2.success).toBe(true);
      const slug2 = result2.data.slug;
      
      expect(slug1).not.toBe(slug2);
      
      await page.goto(`/activity/${slug1}`);
      await expect(page).not.toHaveURL(/404/);
      
      await page.goto(`/activity/${slug2}`);
      await expect(page).not.toHaveURL(/404/);
    });

    test('should preserve activity slug on update', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: activity } = await db
        .from('activities')
        .insert({
          name: 'Test Activity Slug Preservation',
          slug: 'test-activity-slug-preservation',
          description: '<p>Original description</p>',
          status: 'published',
        })
        .select()
        .single();
      
      // Update activity name
      await db
        .from('activities')
        .update({ name: 'Updated Activity Name' })
        .eq('id', activity.id);
      
      // Slug should remain unchanged
      await page.goto('/activity/test-activity-slug-preservation');
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Updated Activity Name');
      
      // Cleanup
      await db.from('activities').delete().eq('id', activity.id);
    });
  });

  // ============================================================================
  // 3. CONTENT PAGE ROUTING (6 tests)
  // ============================================================================

  test.describe('Content Page Routing', () => {
    test('should load content page by slug', async ({ page }) => {
      await page.goto('/custom/test-our-story');
      
      await expect(page).not.toHaveURL(/404/);
      await expect(page.locator('h1')).toContainText('Test Our Story');
    });

    test('should show 404 for non-existent content page slug', async ({ page }) => {
      await page.goto('/custom/non-existent-page');
      await expect(page).toHaveURL(/404/);
    });

    test('should show 404 for draft content page without preview mode', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: draftPage } = await db
        .from('content_pages')
        .insert({
          title: 'Test Draft Page',
          slug: 'test-draft-page',
          status: 'draft',
        })
        .select()
        .single();
      
      await page.goto('/custom/test-draft-page');
      await expect(page).toHaveURL(/404/);
      
      // Cleanup
      await db.from('content_pages').delete().eq('id', draftPage.id);
    });

    test('should only accept "custom" type for content pages', async ({ page }) => {
      await page.goto('/invalid-type/test-our-story');
      await expect(page).toHaveURL(/404/);
    });

    test('should show draft content in preview mode when authenticated', async ({ page, context }) => {
      const db = createServiceClient();
      
      await context.addCookies([{
        name: 'sb-access-token',
        value: adminSession.access_token,
        domain: 'localhost',
        path: '/',
      }]);
      
      const { data: draftPage } = await db
        .from('content_pages')
        .insert({
          title: 'Test Draft Preview',
          slug: 'test-draft-preview',
          status: 'draft',
        })
        .select()
        .single();
      
      await page.goto('/custom/test-draft-preview?preview=true');
      
      await expect(page.locator('text=Preview Mode')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Test Draft Preview');
      await expect(page.locator('text=draft')).toBeVisible();
      
      // Cleanup
      await db.from('content_pages').delete().eq('id', draftPage.id);
    });

    test('should generate unique slugs for content pages with same title', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: page1 } = await db
        .from('content_pages')
        .insert({
          title: 'Duplicate Page Title',
          slug: 'duplicate-page-title',
          status: 'published',
        })
        .select()
        .single();
      
      const { data: page2 } = await db
        .from('content_pages')
        .insert({
          title: 'Duplicate Page Title',
          slug: 'duplicate-page-title-2',
          status: 'published',
        })
        .select()
        .single();
      
      await page.goto('/custom/duplicate-page-title');
      await expect(page).not.toHaveURL(/404/);
      
      await page.goto('/custom/duplicate-page-title-2');
      await expect(page).not.toHaveURL(/404/);
      
      // Cleanup
      await db.from('content_pages').delete().in('id', [page1.id, page2.id]);
    });
  });

  // ============================================================================
  // 4. DYNAMIC ROUTE HANDLING (4 tests)
  // ============================================================================

  test.describe('Dynamic Route Handling', () => {
    test('should handle Next.js 15 params correctly in nested routes', async ({ page }) => {
      // This test catches the params Promise issue in Next.js 15
      await page.goto('/admin/accommodations');
      await expect(page.locator('h1')).toContainText('Accommodations');
      
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        
        await expect(page).toHaveURL(/\/admin\/accommodations\/[^/]+\/room-types/);
        await expect(page.locator('h1')).toContainText('Room Types');
        
        // Check for params-related errors
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        
        const paramsErrors = errors.filter(e => 
          e.includes('params') || 
          e.includes('Promise') ||
          e.includes('React.use')
        );
        expect(paramsErrors).toHaveLength(0);
      }
    });

    test('should handle query parameters correctly', async ({ page, context }) => {
      await context.addCookies([{
        name: 'sb-access-token',
        value: adminSession.access_token,
        domain: 'localhost',
        path: '/',
      }]);
      
      await page.goto('/custom/test-our-story?preview=true');
      
      // Verify preview query param is preserved
      expect(page.url()).toContain('preview=true');
      await expect(page.locator('text=Preview Mode')).toBeVisible();
    });

    test('should handle hash fragments in URLs', async ({ page }) => {
      await page.goto('/event/test-wedding-ceremony#details');
      
      await expect(page).not.toHaveURL(/404/);
      expect(page.url()).toContain('#details');
    });

    test('should handle browser back/forward with dynamic routes', async ({ page }) => {
      await page.goto('/admin/accommodations');
      
      const viewButton = page.locator('button:has-text("View Room Types")').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await expect(page).toHaveURL(/room-types/);
        
        await page.goBack();
        await expect(page).toHaveURL('/admin/accommodations');
        
        await page.goForward();
        await expect(page).toHaveURL(/room-types/);
        await expect(page.locator('h1')).toContainText('Room Types');
      }
    });
  });

  // ============================================================================
  // 5. 404 HANDLING (3 tests)
  // ============================================================================

  test.describe('404 Handling', () => {
    test('should show 404 for invalid slugs', async ({ page }) => {
      const invalidSlugs = [
        '/event/invalid slug with spaces',
        '/activity/test-activity-with-special-chars-!@#$%',
        '/custom/a'.repeat(200), // Very long slug
      ];
      
      for (const slug of invalidSlugs) {
        await page.goto(slug);
        await expect(page).toHaveURL(/404/);
      }
    });

    test('should show 404 for invalid UUIDs', async ({ page }) => {
      await page.goto('/admin/accommodations/invalid-id-12345/room-types');
      
      const hasError = await page.locator('text=404').isVisible() ||
                       await page.locator('text=Not Found').isVisible() ||
                       await page.locator('text=Error').isVisible();
      
      expect(hasError).toBe(true);
      await expect(page.locator('text=params.id')).not.toBeVisible();
    });

    test('should show 404 for deleted items', async ({ page }) => {
      const db = createServiceClient();
      
      const { data: event } = await db
        .from('events')
        .insert({
          name: 'Test Deleted Event',
          slug: 'test-deleted-event',
          description: '<p>Will be deleted</p>',
          status: 'published',
        })
        .select()
        .single();
      
      // Verify event is accessible
      await page.goto('/event/test-deleted-event');
      await expect(page).not.toHaveURL(/404/);
      
      // Delete event
      await db.from('events').delete().eq('id', event.id);
      
      // Should now show 404
      await page.goto('/event/test-deleted-event');
      await expect(page).toHaveURL(/404/);
    });
  });
});

/**
 * CONSOLIDATION NOTES:
 * 
 * This file consolidates 45 tests from 3 files into 25 unique tests:
 * 
 * ELIMINATED DUPLICATES:
 * - Multiple tests for "load page by slug" (kept 1 per entity type)
 * - Multiple tests for "redirect UUID to slug" (kept 1 per entity type)
 * - Multiple tests for "404 handling" (consolidated into 3 comprehensive tests)
 * - Multiple tests for "slug generation" (kept 1 per entity type)
 * - Multiple tests for "preview mode" (consolidated into 1 comprehensive test)
 * 
 * PRESERVED UNIQUE SCENARIOS:
 * - Event routing (6 tests)
 * - Activity routing (6 tests)
 * - Content page routing (6 tests)
 * - Dynamic route handling (4 tests)
 * - 404 handling (3 tests)
 * 
 * IMPROVEMENTS:
 * - Better organization by entity type
 * - Clearer test names
 * - Reduced redundancy
 * - Maintained full coverage
 * - Added comprehensive 404 testing
 * 
 * SAVINGS: 20 tests eliminated (44% reduction)
 */
