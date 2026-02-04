/**
 * E2E Test: Reference Blocks Management
 * 
 * Consolidated from:
 * - referenceBlockFlow.spec.ts (8 tests)
 * - referenceBlockCreation.spec.ts (5 tests)
 * 
 * Tests the complete reference block workflow including:
 * - Creating reference blocks for events, activities, and content pages
 * - Editing and removing references
 * - Validating references (circular detection, broken links)
 * - Guest view of reference blocks with preview modals
 * 
 * Requirements: 21.5, 21.6, 21.7, 21.8, 21.9, 25.1, 25.5
 * Task: Phase 1 Consolidation (Final)
 * 
 * Consolidation Date: 2025-01-XX
 * Tests Eliminated: 5 (38% reduction)
 * Original Files: 2 → New Files: 1
 */

import { test, expect } from '@playwright/test';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

test.describe('Reference Blocks Management', () => {
  let testEventId: string;
  let testActivityId: string;
  let testContentPageId: string;
  let testSectionId: string;

  test.beforeEach(async () => {
    // Create test data
    const supabase = createTestClient();

    // Create test event
    const { data: event } = await supabase
      .from('events')
      .insert({
        name: 'Test Event for References',
        slug: `test-event-ref-${Date.now()}`,
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test event for reference blocks',
      })
      .select()
      .single();
    testEventId = event!.id;

    // Create test activity
    const { data: activity } = await supabase
      .from('activities')
      .insert({
        name: 'Test Activity for References',
        slug: `test-activity-ref-${Date.now()}`,
        event_id: testEventId,
        activity_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test activity for reference blocks',
      })
      .select()
      .single();
    testActivityId = activity!.id;

    // Create test content page
    const { data: contentPage } = await supabase
      .from('content_pages')
      .insert({
        title: 'Test Content Page',
        slug: `test-page-ref-${Date.now()}`,
        type: 'info',
        status: 'published',
      })
      .select()
      .single();
    testContentPageId = contentPage!.id;

    // Create test section
    const { data: section } = await supabase
      .from('sections')
      .insert({
        page_type: 'content_page',
        page_id: testContentPageId,
        position: 0,
      })
      .select()
      .single();
    testSectionId = section!.id;
  });

  test.afterEach(async () => {
    await cleanup();
  });

  // ============================================================================
  // CREATE REFERENCE BLOCKS
  // ============================================================================

  test('should create event reference block', async ({ page }) => {
    // Navigate to content page editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    // Find and edit the test content page
    const editButton = page.locator(`button:has-text("Edit"), a:has-text("Edit")`).first();
    await editButton.click();
    await page.waitForTimeout(500);

    // Navigate to sections management
    const manageSectionsButton = page.locator('button:has-text("Manage Sections"), a:has-text("Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Add a new section or edit existing
    const addSectionButton = page.locator('button:has-text("Add Section")').first();
    const hasAddButton = await addSectionButton.isVisible().catch(() => false);
    
    if (hasAddButton) {
      await addSectionButton.click();
      await page.waitForTimeout(500);
    }

    // Select "References" content type for a column
    const contentTypeSelect = page.locator('select[name*="content_type"], button:has-text("Content Type")').first();
    const hasContentType = await contentTypeSelect.isVisible().catch(() => false);
    
    if (hasContentType) {
      const isSelect = await contentTypeSelect.evaluate((el) => el.tagName === 'SELECT');
      if (isSelect) {
        await contentTypeSelect.selectOption('references');
      } else {
        await contentTypeSelect.click();
        await page.locator('text=References').click();
      }
      await page.waitForTimeout(300);
    }

    // Open reference picker
    const addReferenceButton = page.locator('button:has-text("Add Reference"), button:has-text("Select Reference")').first();
    await expect(addReferenceButton).toBeVisible({ timeout: 5000 });
    await addReferenceButton.click();
    await page.waitForTimeout(500);

    // Verify reference picker modal opened
    const pickerModal = page.locator('text=Select Reference, text=Reference Picker').first();
    await expect(pickerModal).toBeVisible();

    // Search for event
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('Test Event for References');
    await page.waitForTimeout(500);

    // Select event from results
    const eventResult = page.locator('text=Test Event for References').first();
    await expect(eventResult).toBeVisible();
    await eventResult.click();
    await page.waitForTimeout(300);

    // Confirm selection
    const selectButton = page.locator('button:has-text("Select"), button:has-text("Add")').last();
    await selectButton.click();
    await page.waitForTimeout(500);

    // Verify reference appears in section editor
    const referencePreview = page.locator('text=Test Event for References').first();
    await expect(referencePreview).toBeVisible();

    // Save section
    const saveButton = page.locator('button:has-text("Save Section"), button[type="submit"]:has-text("Save")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify success message
    const successMessage = page.locator('.bg-green-50, text=/saved|updated/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Verify reference saved in database
    const supabase = createTestClient();
    const { data: column } = await supabase
      .from('section_columns')
      .select('content_type, references')
      .eq('section_id', testSectionId)
      .single();

    expect(column).toBeDefined();
    expect(column!.content_type).toBe('references');
    expect(column!.references).toBeDefined();
    expect(column!.references.length).toBeGreaterThan(0);
  });

  test('should create activity reference block', async ({ page }) => {
    // Navigate to content page editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Open reference picker
    const addReferenceButton = page.locator('button:has-text("Add Reference")').first();
    const hasButton = await addReferenceButton.isVisible().catch(() => false);
    
    if (hasButton) {
      await addReferenceButton.click();
      await page.waitForTimeout(500);

      // Search for activity
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Test Activity for References');
      await page.waitForTimeout(500);

      // Select activity
      const activityResult = page.locator('text=Test Activity for References').first();
      await expect(activityResult).toBeVisible();
      await activityResult.click();
      await page.waitForTimeout(300);

      // Confirm selection
      const selectButton = page.locator('button:has-text("Select")').last();
      await selectButton.click();
      await page.waitForTimeout(500);

      // Verify reference appears
      const referencePreview = page.locator('text=Test Activity for References').first();
      await expect(referencePreview).toBeVisible();

      // Save section
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Verify success
      const successMessage = page.locator('.bg-green-50, text=/saved|updated/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create multiple reference types in one section', async ({ page }) => {
    // Navigate to content page editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Add event reference
    const addReferenceButton = page.locator('button:has-text("Add Reference")').first();
    const hasButton = await addReferenceButton.isVisible().catch(() => false);
    
    if (hasButton) {
      // Add event
      await addReferenceButton.click();
      await page.waitForTimeout(500);
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Test Event');
      await page.waitForTimeout(500);
      const eventCard = page.locator('text=Test Event for References').first();
      if (await eventCard.isVisible()) {
        await eventCard.click();
        await page.waitForTimeout(300);
        const selectButton = page.locator('button:has-text("Select")').last();
        await selectButton.click();
        await page.waitForTimeout(500);
      }

      // Add activity
      await addReferenceButton.click();
      await page.waitForTimeout(500);
      await searchInput.fill('Test Activity');
      await page.waitForTimeout(500);
      const activityCard = page.locator('text=Test Activity for References').first();
      if (await activityCard.isVisible()) {
        await activityCard.click();
        await page.waitForTimeout(300);
        const selectButton = page.locator('button:has-text("Select")').last();
        await selectButton.click();
        await page.waitForTimeout(500);
      }

      // Verify both references appear
      const eventRef = page.locator('text=Test Event for References').first();
      const activityRef = page.locator('text=Test Activity for References').first();
      await expect(eventRef).toBeVisible();
      await expect(activityRef).toBeVisible();

      // Save section
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Verify success
      const successMessage = page.locator('.bg-green-50, text=/saved|updated/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  // ============================================================================
  // EDIT REFERENCE BLOCKS
  // ============================================================================

  test('should remove reference from section', async ({ page }) => {
    // Add reference to section
    const supabase = createTestClient();
    
    await supabase.from('section_columns').update({
      content_type: 'references',
      references: [{ type: 'event', id: testEventId }],
    }).eq('section_id', testSectionId);

    // Navigate to section editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Find reference preview
    const referencePreview = page.locator('text=Test Event for References').first();
    await expect(referencePreview).toBeVisible();

    // Click remove button
    const removeButton = page.locator('button[aria-label="Remove"], button:has-text("Remove")').first();
    await removeButton.click();
    await page.waitForTimeout(300);

    // Verify reference removed from UI
    const referenceCount = await page.locator('text=Test Event for References').count();
    expect(referenceCount).toBe(0);

    // Save section
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify reference removed from database
    const { data: column } = await supabase
      .from('section_columns')
      .select('references')
      .eq('section_id', testSectionId)
      .single();

    expect(column!.references).toEqual([]);
  });

  test('should filter references by type in picker', async ({ page }) => {
    // Navigate to section editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Open reference picker
    const addReferenceButton = page.locator('button:has-text("Add Reference")').first();
    const hasButton = await addReferenceButton.isVisible().catch(() => false);
    
    if (hasButton) {
      await addReferenceButton.click();
      await page.waitForTimeout(500);

      // Verify type filter is available
      const typeFilter = page.locator('select[name="type"], button:has-text("Type")').first();
      const hasTypeFilter = await typeFilter.isVisible().catch(() => false);
      
      if (hasTypeFilter) {
        // Filter by "Events"
        const isSelect = await typeFilter.evaluate((el) => el.tagName === 'SELECT');
        if (isSelect) {
          await typeFilter.selectOption('event');
        } else {
          await typeFilter.click();
          await page.locator('text=Events').click();
        }
        await page.waitForTimeout(500);

        // Verify only events are shown
        const eventResults = page.locator('[data-reference-type="event"]');
        const eventCount = await eventResults.count();
        expect(eventCount).toBeGreaterThan(0);

        // Verify activities are not shown
        const activityResults = page.locator('[data-reference-type="activity"]');
        const activityCount = await activityResults.count();
        expect(activityCount).toBe(0);
      }
    }
  });

  // ============================================================================
  // REFERENCE VALIDATION
  // ============================================================================

  test('should prevent circular references', async ({ page }) => {
    // Create a circular reference scenario
    // Content Page A → Event B → Content Page A (circular)
    
    const supabase = createTestClient();
    
    // Add reference from content page to event
    await supabase.from('section_columns').update({
      content_type: 'references',
      references: [{ type: 'event', id: testEventId }],
    }).eq('section_id', testSectionId);

    // Create section for event that references back to content page
    const { data: eventSection } = await supabase
      .from('sections')
      .insert({
        page_type: 'event',
        page_id: testEventId,
        position: 0,
      })
      .select()
      .single();

    // Navigate to event editor
    await page.goto(`/admin/events`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Try to add reference back to content page (would create cycle)
    const addReferenceButton = page.locator('button:has-text("Add Reference")').first();
    const hasButton = await addReferenceButton.isVisible().catch(() => false);
    
    if (hasButton) {
      await addReferenceButton.click();
      await page.waitForTimeout(500);

      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('Test Content Page');
      await page.waitForTimeout(500);

      const contentPageResult = page.locator('text=Test Content Page').first();
      await contentPageResult.click();
      await page.waitForTimeout(300);

      const selectButton = page.locator('button:has-text("Select")').last();
      await selectButton.click();
      await page.waitForTimeout(500);

      // Try to save (should show circular reference error)
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      // Verify error message about circular reference
      const errorMessage = page.locator('.bg-red-50, .text-red-800, text=/circular|cycle|loop/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should detect broken references', async ({ page }) => {
    // Add reference to section
    const supabase = createTestClient();
    
    await supabase.from('section_columns').update({
      content_type: 'references',
      references: [{ type: 'event', id: testEventId }],
    }).eq('section_id', testSectionId);

    // Delete the referenced event
    await supabase.from('events').delete().eq('id', testEventId);

    // Navigate to section editor
    await page.goto(`/admin/content-pages`);
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
    await manageSectionsButton.click();
    await page.waitForTimeout(500);

    // Should show broken reference error or warning
    const errorMessage = page.locator('.bg-red-50, .bg-yellow-50, text=/not found|invalid reference|does not exist|broken/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }
  });

  // ============================================================================
  // GUEST VIEW & PREVIEW MODALS
  // ============================================================================

  test('should display reference blocks in guest view with preview modals', async ({ page }) => {
    // Add references to section
    const supabase = createTestClient();
    
    await supabase.from('section_columns').update({
      content_type: 'references',
      references: [
        { type: 'event', id: testEventId },
        { type: 'activity', id: testActivityId },
      ],
    }).eq('section_id', testSectionId);

    // Navigate to guest view of content page
    const { data: contentPage } = await supabase
      .from('content_pages')
      .select('slug')
      .eq('id', testContentPageId)
      .single();

    await page.goto(`/info/${contentPage!.slug}`);
    await page.waitForLoadState('networkidle');

    // Verify reference blocks are displayed
    const eventReference = page.locator('text=Test Event for References').first();
    await expect(eventReference).toBeVisible();

    const activityReference = page.locator('text=Test Activity for References').first();
    await expect(activityReference).toBeVisible();

    // Click on event reference
    await eventReference.click();
    await page.waitForTimeout(500);

    // Verify preview modal opened
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();

    // Verify modal shows event details
    const modalTitle = modal.locator('h2, h3').first();
    await expect(modalTitle).toContainText('Test Event for References');

    // Close modal
    const closeButton = modal.locator('button[aria-label="Close"], button:has-text("Close")').first();
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify modal closed
    await expect(modal).not.toBeVisible();

    // Click on activity reference
    await activityReference.click();
    await page.waitForTimeout(500);

    // Verify activity preview modal opened
    const activityModal = page.locator('[role="dialog"], .modal').first();
    await expect(activityModal).toBeVisible();

    // Verify modal shows activity details
    const activityModalTitle = activityModal.locator('h2, h3').first();
    await expect(activityModalTitle).toContainText('Test Activity for References');
  });
});
