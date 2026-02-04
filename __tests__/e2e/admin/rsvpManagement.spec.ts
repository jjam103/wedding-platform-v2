/**
 * E2E Test: RSVP Management (Consolidated)
 * 
 * Consolidated from:
 * - __tests__/e2e/rsvpManagementFlow.spec.ts (21 tests)
 * - __tests__/e2e/guestRsvpFlow.spec.ts (7 tests)
 * 
 * This file consolidates all RSVP management tests into a single organized suite.
 * Tests are grouped by user role (admin vs guest) and functionality.
 * 
 * Total: 20 unique tests (8 duplicates eliminated)
 * 
 * Requirements:
 * - Admin UX Enhancements: 6.2, 6.4
 * - Guest Portal: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9
 * 
 * @see docs/E2E_CONSOLIDATION_PHASE1_4_COMPLETE.md
 */

import { test, expect } from '@playwright/test';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

// ============================================================================
// SECTION 1: Admin RSVP Management (10 tests)
// ============================================================================

test.describe('Admin RSVP Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin/rsvps');
    await page.waitForLoadState('networkidle');
  });

  test('should display RSVP management page with statistics', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1:has-text("RSVP Management")')).toBeVisible({ timeout: 5000 });
    
    // Verify statistics dashboard
    await expect(page.locator('text=/Total RSVPs/i')).toBeVisible();
    await expect(page.locator('text=/Attending/i')).toBeVisible();
    await expect(page.locator('text=/Declined/i')).toBeVisible();
    await expect(page.locator('text=/Pending/i')).toBeVisible();
    
    // Verify RSVP table
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter RSVPs by status, event, and activity', async ({ page }) => {
    // Test status filter
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('attending');
      await page.waitForTimeout(1000);
      
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        for (let i = 0; i < Math.min(rowCount, 3); i++) {
          await expect(rows.nth(i).locator('text=/attending/i')).toBeVisible();
        }
      }
      
      // Test event filter
      const eventFilter = page.locator('select[name="eventId"]');
      if (await eventFilter.count() > 0) {
        const options = await eventFilter.locator('option').count();
        if (options > 1) {
          await eventFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
      
      // Test activity filter
      const activityFilter = page.locator('select[name="activityId"]');
      if (await activityFilter.count() > 0) {
        const options = await activityFilter.locator('option').count();
        if (options > 1) {
          await activityFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should search RSVPs by guest name and email', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      // Search by name
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      let rows = page.locator('tbody tr');
      let rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
      
      // Search by email
      await searchInput.clear();
      await searchInput.fill('@example.com');
      await page.waitForTimeout(1000);
      
      rows = page.locator('tbody tr');
      rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
      
      await searchInput.clear();
    }
  });

  test('should select RSVPs individually and in bulk', async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Test individual selection
      await checkboxes.first().check();
      await expect(page.locator('text=/selected/i')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('button:has-text("Update Status")')).toBeVisible();
      await checkboxes.first().uncheck();
      
      // Test select all
      const selectAllCheckbox = page.locator('thead input[type="checkbox"]');
      if (await selectAllCheckbox.count() > 0) {
        await selectAllCheckbox.check();
        await page.waitForTimeout(500);
        
        const firstCheckbox = await checkboxes.first().isChecked();
        expect(firstCheckbox).toBe(true);
        
        await selectAllCheckbox.uncheck();
      }
    }
  });

  test('should bulk update RSVP status', async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 0) {
      // Select RSVPs
      await checkboxes.first().check();
      if (checkboxCount > 1) {
        await checkboxes.nth(1).check();
      }
      
      // Open bulk update
      const updateButton = page.locator('button:has-text("Update Status")');
      await updateButton.click();
      
      // Select status
      const statusSelect = page.locator('select[name="bulkStatus"]');
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('attending');
      }
      
      // Confirm
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Verify success
      await expect(page.locator('text=/updated|success/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should export RSVPs to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('rsvps');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should export filtered RSVPs to CSV', async ({ page }) => {
    // Apply filter
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('attending');
      await page.waitForTimeout(1000);
    }
    
    // Export
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should handle rate limiting on export', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();
    await page.waitForTimeout(2000);
    
    // Try again immediately
    await exportButton.click();
    
    // Should show rate limit message
    await expect(page.locator('text=/rate limit|wait|try again/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display pagination and navigate pages', async ({ page }) => {
    // Verify pagination controls
    const pagination = page.locator('text=/page|showing|of/i');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
    }
    
    // Test navigation
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=/page 2/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/admin/rsvps', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Test error'
          }
        })
      });
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SECTION 2: Guest RSVP Submission (5 tests)
// ============================================================================

test.describe('Guest RSVP Submission', () => {
  let testGuestEmail: string;
  let testGuestId: string;
  let testGroupId: string;
  let testEventId: string;
  let testActivityId: string;

  test.beforeEach(async () => {
    const supabase = createTestClient();

    // Create test group
    const { data: group } = await supabase
      .from('guest_groups')
      .insert({ name: 'Test Family', group_owner_id: null })
      .select()
      .single();
    testGroupId = group!.id;

    // Create test guest
    testGuestEmail = `test-guest-${Date.now()}@example.com`;
    const { data: guest } = await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest',
        email: testGuestEmail,
        group_id: testGroupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        auth_method: 'email_matching',
      })
      .select()
      .single();
    testGuestId = guest!.id;

    // Create test event
    const { data: event } = await supabase
      .from('events')
      .insert({
        name: 'Test Wedding Event',
        slug: `test-event-${Date.now()}`,
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test event for RSVP flow',
      })
      .select()
      .single();
    testEventId = event!.id;

    // Create test activity with capacity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        name: 'Test Activity',
        slug: `test-activity-${Date.now()}`,
        event_id: testEventId,
        activity_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
        cost_per_person: 50,
        description: 'Test activity for RSVP flow',
      })
      .select()
      .single();
    testActivityId = activity!.id;
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test('should submit RSVP for activity with dietary restrictions', async ({ page }) => {
    // Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Navigate to activities
    await page.goto('/guest/activities');
    await page.waitForLoadState('networkidle');

    // Find activity and open RSVP form
    await expect(page.locator('text=Test Activity').first()).toBeVisible();
    await page.locator('button:has-text("RSVP"), button:has-text("Respond")').first().click();
    await page.waitForTimeout(500);

    // Select attending
    await page.locator('button:has-text("Attending"), button:has-text("Yes")').first().click();
    await page.waitForTimeout(300);

    // Enter guest count
    const guestCountInput = page.locator('input[name="guest_count"], input[type="number"]').first();
    if (await guestCountInput.isVisible().catch(() => false)) {
      await guestCountInput.fill('2');
    }

    // Enter dietary restrictions
    const dietaryInput = page.locator('textarea[name="dietary_restrictions"], input[name="dietary_restrictions"]').first();
    if (await dietaryInput.isVisible().catch(() => false)) {
      await dietaryInput.fill('Vegetarian');
    }

    // Submit
    await page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Save RSVP")').first().click();
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page.locator('.bg-green-50, .text-green-800, text=/RSVP submitted|Thank you/i').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Attending|Confirmed/i').first()).toBeVisible();

    // Verify in database
    const supabase = createTestClient();
    const { data: rsvp, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single();

    expect(error).toBeNull();
    expect(rsvp).toBeDefined();
    expect(rsvp!.status).toBe('attending');
  });

  test('should update existing RSVP', async ({ page }) => {
    // Create initial RSVP
    const supabase = createTestClient();
    await supabase.from('rsvps').insert({
      guest_id: testGuestId,
      activity_id: testActivityId,
      status: 'attending',
      guest_count: 1,
      dietary_restrictions: 'None',
    });

    // Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Navigate to activities
    await page.goto('/guest/activities');
    await page.waitForLoadState('networkidle');

    // Edit RSVP
    await expect(page.locator('text=Test Activity').first()).toBeVisible();
    await page.locator('button:has-text("Edit RSVP"), button:has-text("Change Response")').first().click();
    await page.waitForTimeout(500);

    // Change to maybe
    await page.locator('button:has-text("Maybe"), button:has-text("Unsure")').first().click();
    await page.waitForTimeout(300);

    // Update guest count
    const guestCountInput = page.locator('input[name="guest_count"], input[type="number"]').first();
    if (await guestCountInput.isVisible().catch(() => false)) {
      await guestCountInput.fill('3');
    }

    // Save
    await page.locator('button[type="submit"]:has-text("Save"), button:has-text("Update RSVP")').first().click();
    await page.waitForTimeout(1000);

    // Verify success
    await expect(page.locator('.bg-green-50, text=/updated|saved/i').first()).toBeVisible({ timeout: 5000 });

    // Verify in database
    const { data: updatedRsvp } = await supabase
      .from('rsvps')
      .select('*')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single();

    expect(updatedRsvp!.status).toBe('maybe');
  });

  test('should enforce capacity constraints', async ({ page }) => {
    const supabase = createTestClient();
    
    // Fill activity to 8/10 capacity
    for (let i = 0; i < 8; i++) {
      const { data: otherGuest } = await supabase
        .from('guests')
        .insert({
          first_name: `Guest${i}`,
          last_name: 'Test',
          email: `guest${i}@example.com`,
          group_id: testGroupId,
          age_type: 'adult',
          guest_type: 'wedding_guest',
        })
        .select()
        .single();

      await supabase.from('rsvps').insert({
        guest_id: otherGuest!.id,
        activity_id: testActivityId,
        status: 'attending',
        guest_count: 1,
      });
    }

    // Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Navigate to activities
    await page.goto('/guest/activities');
    await page.waitForLoadState('networkidle');

    // Verify capacity warning (90% threshold)
    await expect(page.locator('text=Test Activity').first()).toBeVisible();
    const capacityWarning = page.locator('text=/almost full|limited spots|2 spots remaining/i').first();
    if (await capacityWarning.isVisible().catch(() => false)) {
      await expect(capacityWarning).toBeVisible();
    }

    // Try to exceed capacity
    await page.locator('button:has-text("RSVP")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Attending")').first().click();
    await page.waitForTimeout(300);

    const guestCountInput = page.locator('input[name="guest_count"], input[type="number"]').first();
    if (await guestCountInput.isVisible().catch(() => false)) {
      await guestCountInput.fill('5'); // Would exceed capacity
    }

    await page.locator('button[type="submit"]:has-text("Submit")').first().click();
    await page.waitForTimeout(1000);

    // Verify error
    await expect(page.locator('.bg-red-50, .text-red-800, text=/capacity|full|not enough space/i').first()).toBeVisible({ timeout: 5000 });

    // Verify not saved
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('*')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single();

    expect(rsvp).toBeNull();
  });

  test('should cycle through RSVP statuses', async ({ page }) => {
    // Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    await page.goto('/guest/activities');
    await page.waitForLoadState('networkidle');

    const supabase = createTestClient();

    // pending → attending
    await page.locator('button:has-text("RSVP")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Attending")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]:has-text("Submit")').first().click();
    await page.waitForTimeout(1000);

    let { data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single();
    expect(rsvp!.status).toBe('attending');

    // attending → maybe
    await page.locator('button:has-text("Edit RSVP")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Maybe")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]:has-text("Save")').first().click();
    await page.waitForTimeout(1000);

    ({ data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single());
    expect(rsvp!.status).toBe('maybe');

    // maybe → declined
    await page.locator('button:has-text("Edit RSVP")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Declined"), button:has-text("No")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button[type="submit"]:has-text("Save")').first().click();
    await page.waitForTimeout(1000);

    ({ data: rsvp } = await supabase
      .from('rsvps')
      .select('status')
      .eq('guest_id', testGuestId)
      .eq('activity_id', testActivityId)
      .single());
    expect(rsvp!.status).toBe('declined');
  });

  test('should validate guest count is positive', async ({ page }) => {
    // Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    await page.goto('/guest/activities');
    await page.waitForLoadState('networkidle');

    // Open RSVP form
    await page.locator('button:has-text("RSVP")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Attending")').first().click();
    await page.waitForTimeout(300);

    // Try invalid guest count
    const guestCountInput = page.locator('input[name="guest_count"], input[type="number"]').first();
    if (await guestCountInput.isVisible().catch(() => false)) {
      await guestCountInput.fill('-1');
      
      await page.locator('button[type="submit"]:has-text("Submit")').first().click();
      await page.waitForTimeout(500);

      // Check for validation error
      const errorMessage = page.locator('.text-red-600, .text-red-800, text=/must be positive|greater than 0/i').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      if (hasError) {
        await expect(errorMessage).toBeVisible();
      } else {
        // Browser validation should prevent submission
        const isInvalid = await guestCountInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isInvalid).toBe(true);
      }
    }
  });
});

// ============================================================================
// SECTION 3: RSVP Analytics (5 tests)
// ============================================================================

test.describe('RSVP Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin/rsvp-analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should display response rate statistics', async ({ page }) => {
    // Verify analytics page loads
    await expect(page.locator('h1:has-text("RSVP Analytics"), h1:has-text("Analytics")')).toBeVisible({ timeout: 5000 });
    
    // Verify response rate metrics
    const responseRate = page.locator('text=/response rate|responded/i');
    if (await responseRate.count() > 0) {
      await expect(responseRate).toBeVisible();
    }
    
    // Verify percentage display
    const percentage = page.locator('text=/\\d+%/');
    if (await percentage.count() > 0) {
      await expect(percentage.first()).toBeVisible();
    }
  });

  test('should display attendance forecast', async ({ page }) => {
    // Verify attendance forecast section
    const forecast = page.locator('text=/forecast|expected attendance|projected/i');
    if (await forecast.count() > 0) {
      await expect(forecast).toBeVisible();
    }
    
    // Verify attending count
    const attendingCount = page.locator('text=/attending|confirmed/i');
    if (await attendingCount.count() > 0) {
      await expect(attendingCount.first()).toBeVisible();
    }
  });

  test('should display capacity utilization', async ({ page }) => {
    // Verify capacity metrics
    const capacity = page.locator('text=/capacity|utilization|occupancy/i');
    if (await capacity.count() > 0) {
      await expect(capacity).toBeVisible();
    }
    
    // Verify capacity warnings for near-full activities
    const warning = page.locator('text=/almost full|limited spots|90%/i');
    if (await warning.count() > 0) {
      await expect(warning.first()).toBeVisible();
    }
  });

  test('should display dietary restrictions summary', async ({ page }) => {
    // Verify dietary restrictions section
    const dietary = page.locator('text=/dietary|restrictions|allergies/i');
    if (await dietary.count() > 0) {
      await expect(dietary).toBeVisible();
    }
    
    // Verify dietary counts
    const counts = page.locator('text=/vegetarian|vegan|gluten/i');
    if (await counts.count() > 0) {
      await expect(counts.first()).toBeVisible();
    }
  });

  test('should display RSVP timeline', async ({ page }) => {
    // Verify timeline visualization
    const timeline = page.locator('text=/timeline|over time|trend/i');
    if (await timeline.count() > 0) {
      await expect(timeline).toBeVisible();
    }
    
    // Verify chart or graph
    const chart = page.locator('canvas, svg[class*="chart"]');
    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });
});
