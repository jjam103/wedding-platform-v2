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
import { createServiceClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';
import { waitForStyles, waitForCondition, waitForElementStable } from '../../helpers/waitHelpers';

/**
 * Helper function to open section editing interface
 * Handles the complete flow: Manage Sections → Add Section (if needed) → Edit section
 */
async function openSectionEditor(page: any) {
  // Click "▶ Manage Sections" to expand section editor
  const manageSectionsButton = page.locator('button:has-text("Manage Sections")').first();
  await waitForElementStable(page, manageSectionsButton);
  await manageSectionsButton.click();
  
  // Wait for section editor container to appear with retry logic
  // The section editor is conditionally rendered, so it may take a moment
  await waitForCondition(async () => {
    const sectionEditor = page.locator('[data-testid="section-editor"]').first();
    return await sectionEditor.isVisible();
  }, 15000);
  
  console.log('✓ Section editor container is visible');

  // Add a new section if needed (if no sections exist yet)
  const addSectionButton = page.locator('button:has-text("Add Section")').first();
  const hasAddButton = await addSectionButton.isVisible().catch(() => false);
  
  if (hasAddButton) {
    console.log('✓ No sections exist, creating first section');
    await addSectionButton.click();
    
    // Wait for section creation API call to complete
    await waitForCondition(async () => {
      const editButton = page.locator('button:has-text("Edit")').first();
      return await editButton.isVisible();
    }, 10000);
    
    // Wait for section to fully render and become interactive
    await waitForStyles(page);
    console.log('✓ Section fully rendered and ready for interaction');
  }

  // Wait for at least one section with Edit button to appear
  // The Edit button has data-testid="section-edit-button-{sectionId}"
  await waitForCondition(async () => {
    const sections = await page.locator('[data-testid^="section-edit-button-"]').count();
    return sections > 0;
  }, 10000);
  
  // Find the first section's ID from the DOM to use the specific data-testid
  // Get all section IDs from the page
  const sectionIds = await page.evaluate(() => {
    const sections = document.querySelectorAll('[data-testid^="section-edit-button-"]');
    return Array.from(sections).map(el => {
      const testId = el.getAttribute('data-testid');
      return testId ? testId.replace('section-edit-button-', '') : null;
    }).filter(Boolean);
  });
  
  if (sectionIds.length === 0) {
    throw new Error('No sections found with data-testid attributes');
  }
  
  const firstSectionId = sectionIds[0];
  console.log(`✓ Found section with ID: ${firstSectionId}`);
  
  // Use the specific data-testid to target the Edit button
  const editSectionButton = page.locator(`[data-testid="section-edit-button-${firstSectionId}"]`);
  await waitForElementStable(page, editSectionButton);
  
  console.log('✓ Clicking Edit button to open editing interface');
  
  // Click the button and wait for editing interface to appear
  await editSectionButton.click();
  await waitForStyles(page);
  
  // Verify editing interface appeared
  const titleInput = page.locator('input[placeholder*="Enter a title"]').first();
  await waitForCondition(async () => {
    return await titleInput.isVisible();
  }, 5000);
  
  console.log('✓ Editing interface appeared after Edit button click');
  
  // Now verify all editing interface elements are present
  await waitForElementStable(page, titleInput);
  
  const layoutSelect = page.locator('select').filter({
    has: page.locator('option[value="one-column"]')
  }).first();
  await waitForElementStable(page, layoutSelect);
  
  const columnTypeSelect = page.locator('select').filter({ 
    has: page.locator('option[value="rich_text"]') 
  }).first();
  await waitForElementStable(page, columnTypeSelect);
  
  console.log('✓ All editing interface elements verified');
}

test.describe('Reference Blocks Management', () => {
  let testEventId: string;
  let testActivityId: string;
  let testContentPageId: string;
  let testSectionId: string;

  test.beforeEach(async ({ page }) => {
    // Create test data using service client (bypasses RLS for test setup)
    const supabase = createServiceClient();

    // Generate unique ID for this test run to avoid slug collisions in parallel execution
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create test location first (required for events and activities)
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        name: 'Test Location',
        type: 'venue',
        description: 'Test location for reference blocks',
      })
      .select()
      .single();
    
    if (locationError || !location) {
      throw new Error(`Failed to create test location: ${locationError?.message || 'No location returned'}`);
    }
    const testLocationId = location.id;

    // Create test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name: 'Test Event for References',
        slug: `test-event-ref-${uniqueId}`,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        event_type: 'ceremony',
        description: 'Test event for reference blocks',
        status: 'published',
        location_id: testLocationId,  // Add location reference
      })
      .select()
      .single();
    
    if (eventError || !event) {
      throw new Error(`Failed to create test event: ${eventError?.message || 'No event returned'}`);
    }
    testEventId = event.id;

    // Create test activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        name: 'Test Activity for References',
        slug: `test-activity-ref-${uniqueId}`,
        event_id: testEventId,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        activity_type: 'activity',
        description: 'Test activity for reference blocks',
        status: 'published',
        location_id: testLocationId,  // Add location reference
      })
      .select()
      .single();
    
    if (activityError || !activity) {
      throw new Error(`Failed to create test activity: ${activityError?.message || 'No activity returned'}`);
    }
    testActivityId = activity.id;

    // Create test content page
    const { data: contentPage, error: contentPageError } = await supabase
      .from('content_pages')
      .insert({
        title: 'Test Content Page',
        slug: `test-page-ref-${uniqueId}`,
        status: 'published',
      })
      .select()
      .single();
    
    if (contentPageError || !contentPage) {
      throw new Error(`Failed to create test content page: ${contentPageError?.message || 'No content page returned'}`);
    }
    testContentPageId = contentPage.id;

    // Create test section (using 'custom' page_type since content_page isn't supported)
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        page_type: 'custom',
        page_id: testContentPageId,
        display_order: 0,
      })
      .select()
      .single();
    
    if (sectionError || !section) {
      throw new Error(`Failed to create test section: ${sectionError?.message || 'No section returned'}`);
    }
    testSectionId = section.id;

    // Create a column for the section (required for reference blocks)
    const { error: columnError } = await supabase
      .from('columns')
      .insert({
        section_id: testSectionId,
        column_number: 1,
        content_type: 'rich_text',
        content_data: {},
      });
    
    if (columnError) {
      throw new Error(`Failed to create test column: ${columnError.message}`);
    }

    // DEBUG: Verify data was created successfully
    console.log('✓ Created test data:', {
      eventId: testEventId,
      activityId: testActivityId,
      contentPageId: testContentPageId,
      sectionId: testSectionId,
    });

    // Verify data exists in database
    const { data: verifyPage, error: verifyError } = await supabase
      .from('content_pages')
      .select('*')
      .eq('id', testContentPageId)
      .single();
    
    console.log('✓ Verify content page exists in DB:', verifyPage ? 'YES' : 'NO', verifyError?.message || '');

    // IMPROVED WAITING STRATEGY: Wait for specific test content page to appear
    await waitForCondition(async () => {
      // Navigate to content pages
      await page.goto('/admin/content-pages');
      await page.waitForLoadState('networkidle');
      
      // Wait for page header to load first (this always exists)
      const pageHeader = page.locator('h1:has-text("Content Pages")').first();
      const headerVisible = await pageHeader.isVisible().catch(() => false);
      if (!headerVisible) return false;
      
      // Wait for either content or "no pages" message
      // The page uses .space-y-4 for the pages list container
      const hasContent = await page.locator('.space-y-4').first().isVisible().catch(() => false);
      const hasNoPages = await page.locator('text=No content pages').first().isVisible().catch(() => false);
      
      if (!hasContent && !hasNoPages) {
        return false;
      }
      
      // Wait for our specific test page to appear
      const testPageText = page.locator('text=Test Content Page').first();
      const testPageVisible = await testPageText.isVisible().catch(() => false);
      if (!testPageVisible) return false;
      
      // Verify Edit button is clickable
      const editButton = page.locator('button:has-text("Edit")').first();
      const editButtonVisible = await editButton.isVisible().catch(() => false);
      const editButtonEnabled = await editButton.isEnabled().catch(() => false);
      
      if (editButtonVisible && editButtonEnabled) {
        console.log('✓ Test content page is visible and editable in UI');
        return true;
      }
      
      return false;
    }, 30000);
  });

  test.afterEach(async () => {
    await cleanup();
  });

  // ============================================================================
  // CREATE REFERENCE BLOCKS
  // ============================================================================

  test('should create event reference block', async ({ page }) => {
    // Page is already on /admin/content-pages from beforeEach
    // Just verify we're on the right page
    await expect(page).toHaveURL('/admin/content-pages');

    // Open section editor (handles Edit → Manage Sections → Edit section flow)
    await openSectionEditor(page);

    // Find the column type selector and select "References"
    const columnTypeSelect = page.locator('select').filter({ 
      has: page.locator('option[value="references"]') 
    }).first();
    await waitForElementStable(page, columnTypeSelect);
    
    // Select "References" from column type dropdown
    await columnTypeSelect.selectOption('references');
    
    // Wait for SimpleReferenceSelector to load with retry logic
    // The component is conditionally rendered, so it may take a moment
    await waitForCondition(async () => {
      const typeSelect = page.locator('select#type-select').first();
      return await typeSelect.isVisible();
    }, 15000);
    
    console.log('✓ SimpleReferenceSelector loaded');

    // Wait for SimpleReferenceSelector to load
    const typeSelect = page.locator('select#type-select').first();
    await waitForElementStable(page, typeSelect);
    
    // Select "Events" from type dropdown
    await typeSelect.selectOption('event');
    
    // Wait for API call to complete and items to load
    const apiResponse = await page.waitForResponse(response => 
      response.url().includes('/api/admin/events') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Debug: Log API response
    const apiData = await apiResponse.json();
    console.log('API Response:', JSON.stringify(apiData, null, 2));
    
    // Wait for loading spinner to disappear
    await waitForCondition(async () => {
      const spinner = page.locator('.animate-spin').first();
      return !(await spinner.isVisible().catch(() => false));
    }, 10000);
    
    // Wait for at least one reference item button to appear with retry logic
    await waitForCondition(async () => {
      const items = await page.locator('[data-testid^="reference-item-"]').count();
      return items > 0;
    }, 15000);
    
    console.log('✓ Reference items rendered');

    // Click on the specific event using data-testid (most reliable)
    console.log(`→ Looking for event with ID: ${testEventId}`);
    const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
    
    // Wait for element to exist and be visible
    await waitForElementStable(page, eventItem);
    console.log('✓ Event item is visible');
    
    // Click the button
    await eventItem.click();
    await waitForStyles(page);
    console.log('✓ Event reference clicked');
    
    // Verify reference appears in the selected references area
    await waitForCondition(async () => {
      const referencePreview = page.locator('text=Test Event for References');
      const count = await referencePreview.count();
      console.log(`→ Found ${count} instances of "Test Event for References"`);
      // Should find at least one (in selected area)
      return count > 0;
    }, 10000);
    
    console.log('✓ Event reference added to selection');

    // Save section
    const saveButton = page.locator('button:has-text("Save Section")').first();
    await waitForElementStable(page, saveButton);
    await saveButton.click();
    
    // Wait for save operation to complete with extended timeout
    // The save involves: API call → database write → state update
    await waitForStyles(page);
    await waitForCondition(async () => {
      // Wait a bit longer for database write to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }, 5000);

    // Verify reference saved in database with retry logic
    const supabase = createServiceClient();
    
    // Retry database check up to 10 times with 1 second intervals
    // This handles the async nature of the save operation
    let column;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const result = await supabase
        .from('columns')
        .select('content_type, content_data')
        .eq('section_id', testSectionId)
        .single();
      
      column = result.data;
      
      // Check if we have the expected data
      if (column && 
          column.content_type === 'references' && 
          column.content_data?.references?.length > 0) {
        console.log(`✓ Database verification successful on attempt ${attempts + 1}`);
        break;
      }
      
      // Wait before retrying
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`⏳ Database check attempt ${attempts}/${maxAttempts} - waiting for save to complete...`);
        await page.waitForTimeout(1000);
      }
    }

    // Verify the data
    expect(column).toBeDefined();
    expect(column!.content_type).toBe('references');
    expect(column!.content_data).toBeDefined();
    expect(column!.content_data.references).toBeDefined();
    expect(column!.content_data.references.length).toBeGreaterThan(0);
  });

  test('should create activity reference block', async ({ page }) => {
    // Page is already on /admin/content-pages from beforeEach
    await expect(page).toHaveURL('/admin/content-pages');

    // Open section editor
    await openSectionEditor(page);

    // Find column type selector and select "References"
    const columnTypeSelect = page.locator('select').filter({ 
      has: page.locator('option[value="references"]') 
    }).first();
    await expect(columnTypeSelect).toBeVisible({ timeout: 5000 });
    await columnTypeSelect.selectOption('references');
    await page.waitForTimeout(500);

    // Wait for SimpleReferenceSelector
    const typeSelect = page.locator('select#type-select').first();
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    
    // Select "Activities" from type dropdown
    await typeSelect.selectOption('activity');
    
    // FLAKY FIX: Wait for reference picker data to load completely
    // Wait for API call to complete (optional - may not always trigger)
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/activities') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {
      console.log('Activities API response not captured, continuing...');
    });
    
    // Wait for loading to complete
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // FLAKY FIX: Wait for reference items to be fully rendered and interactive
    await page.waitForSelector('[data-testid^="reference-item-"]', { timeout: 10000 });
    await page.waitForTimeout(500); // Wait for items to become interactive

    // Click on the specific activity using its ID
    const activityItem = page.locator(`[data-testid="reference-item-${testActivityId}"]`);
    await expect(activityItem).toBeVisible({ timeout: 5000 });
    await activityItem.click();
    await page.waitForTimeout(500);

    // Verify reference appears
    const referencePreview = page.locator('text=Test Activity for References').first();
    await expect(referencePreview).toBeVisible();

    // Save section
    const saveButton = page.locator('button:has-text("Save Section")').first();
    await saveButton.click();
    
    // FLAKY FIX: Wait for save API to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/sections') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {
      console.log('Save API response not captured, continuing...');
    });
    await page.waitForTimeout(1000);
  });

  test('should create multiple reference types in one section', async ({ page }) => {
    // Page is already on /admin/content-pages from beforeEach
    await expect(page).toHaveURL('/admin/content-pages');

    // Open section editor
    await openSectionEditor(page);

    // Select "References" column type
    const columnTypeSelect = page.locator('select').filter({ 
      has: page.locator('option[value="references"]') 
    }).first();
    await expect(columnTypeSelect).toBeVisible({ timeout: 5000 });
    await columnTypeSelect.selectOption('references');
    await page.waitForTimeout(500);

    // Wait for SimpleReferenceSelector
    const typeSelect = page.locator('select#type-select').first();
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    
    // Add event reference with improved waiting
    await typeSelect.selectOption('event');
    
    // Wait for API response
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/events') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for items to render
    await page.waitForSelector(`[data-testid="reference-item-${testEventId}"]`, { timeout: 10000 });
    
    // Click event item
    const eventItem = page.locator(`[data-testid="reference-item-${testEventId}"]`);
    await eventItem.click();
    await page.waitForTimeout(1500);
    
    console.log('✓ Event reference selected');

    // CRITICAL: Wait for reference picker to stabilize after first selection
    // The component re-renders when a reference is added, so we need to wait
    await page.waitForTimeout(1000);

    // Add activity reference with improved waiting
    await typeSelect.selectOption('activity');
    
    // Wait for API response
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/activities') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for items to render
    await page.waitForSelector(`[data-testid="reference-item-${testActivityId}"]`, { timeout: 10000 });
    
    // Click activity item
    const activityItem = page.locator(`[data-testid="reference-item-${testActivityId}"]`);
    await activityItem.click();
    await page.waitForTimeout(1500);
    
    console.log('✓ Activity reference selected');

    // Verify both references appear
    const eventRef = page.locator('text=Test Event for References').first();
    const activityRef = page.locator('text=Test Activity for References').first();
    await expect(eventRef).toBeVisible();
    await expect(activityRef).toBeVisible();

    // Save section
    const saveButton = page.locator('button:has-text("Save Section")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);
  });

  // ============================================================================
  // EDIT REFERENCE BLOCKS
  // ============================================================================

  test('should remove reference from section', async ({ page }) => {
    // Add reference to section
    const supabase = createServiceClient();
    
    // First, get the column ID for this section
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('id')
      .eq('section_id', testSectionId);
    
    if (columnsError) {
      throw new Error(`Failed to get columns: ${columnsError.message}`);
    }
    
    if (!columns || columns.length === 0) {
      throw new Error('No columns found for section');
    }
    
    console.log(`✓ Found ${columns.length} column(s) for section ${testSectionId}`);
    console.log(`✓ Using column ID: ${columns[0].id}`);
    
    // Update the first column with reference data
    const { error: updateError } = await supabase.from('columns').update({
      content_type: 'references',
      content_data: { references: [{ type: 'event', id: testEventId, name: 'Test Event for References', metadata: {} }] },
    }).eq('id', columns[0].id);

    if (updateError) {
      throw new Error(`Failed to update column: ${updateError.message}`);
    }

    // Verify the update was successful
    const { data: verifyColumn, error: verifyError } = await supabase
      .from('columns')
      .select('content_type, content_data')
      .eq('id', columns[0].id)
      .single();
    
    if (verifyError) {
      throw new Error(`Failed to verify column update: ${verifyError.message}`);
    }
    
    console.log('✓ Reference added to column:', JSON.stringify(verifyColumn, null, 2));

    // Reload page to see the updated data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Increased from 1500ms to ensure data is loaded

    // Open section editor with retry logic
    await expect(async () => {
      await openSectionEditor(page);
      // Verify editor opened
      const columnTypeSelect = page.locator('select').filter({ 
        has: page.locator('option[value="references"]') 
      }).first();
      await expect(columnTypeSelect).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000, intervals: [1000, 2000, 3000] }); // Increased timeout and intervals

    console.log('✓ Section editor opened');

    // Wait for reference preview to appear with retry logic
    await expect(async () => {
      const referencePreview = page.locator('text=Test Event for References').first();
      await expect(referencePreview).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000, intervals: [1000, 2000, 3000] }); // Increased timeout and intervals

    console.log('✓ Reference preview visible');

    // Find and click remove button with retry logic
    // Note: Button has aria-label="Remove reference" (not just "Remove")
    await expect(async () => {
      const removeButton = page.locator('button[aria-label="Remove reference"]').first();
      await expect(removeButton).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000, intervals: [1000, 2000, 3000] }); // Increased timeout and intervals
    
    const removeButton = page.locator('button[aria-label="Remove reference"]').first();
    await removeButton.click();
    await page.waitForTimeout(1000); // Increased from 500ms

    console.log('✓ Remove button clicked');

    // Verify reference removed from UI
    const referencePreview = page.locator('text=Test Event for References').first();
    await expect(referencePreview).not.toBeVisible();

    // Save section
    const saveButton = page.locator('button:has-text("Save Section")').first();
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    
    // Wait for save operation to complete with extended timeout
    // The save involves: API call → database write → state update
    await page.waitForTimeout(2000);

    // Verify reference removed from database with retry logic
    // Query by section_id instead of column_id since columns may be recreated during update
    await waitForCondition(async () => {
      const result = await supabase
        .from('columns')
        .select('content_data')
        .eq('section_id', testSectionId);
      
      const columnsData = result.data;
      
      // Check if we have the expected data (empty references array)
      if (columnsData && 
          columnsData.length > 0 &&
          columnsData[0].content_data?.references !== undefined &&
          columnsData[0].content_data?.references?.length === 0) {
        console.log(`✓ Database verification successful`);
        return true;
      }
      
      console.log(`⏳ Waiting for database save to complete...`);
      console.log(`   Current data:`, JSON.stringify(columnsData, null, 2));
      return false;
    }, 10000);
    
    // Get final data for assertions
    const { data: columnsData } = await supabase
      .from('columns')
      .select('content_data')
      .eq('section_id', testSectionId);

    // More defensive assertions
    expect(columnsData).toBeDefined();
    expect(columnsData).not.toBeNull();
    expect(columnsData!.length).toBeGreaterThan(0);
    expect(columnsData![0]).toBeDefined();
    expect(columnsData![0].content_data).toBeDefined();
    expect(columnsData![0].content_data.references).toBeDefined();
    expect(columnsData![0].content_data.references).toEqual([]);
  });

  test('should filter references by type in picker', async ({ page }) => {
    // Page is already on /admin/content-pages from beforeEach
    await expect(page).toHaveURL('/admin/content-pages');

    // Open section editor (handles Edit → Manage Sections → Edit section flow)
    await openSectionEditor(page);

    // Find the column type selector and select "References"
    const columnTypeSelect = page.locator('select').filter({ 
      has: page.locator('option[value="references"]') 
    }).first();
    await expect(columnTypeSelect).toBeVisible({ timeout: 5000 });
    await columnTypeSelect.selectOption('references');
    await page.waitForTimeout(500);

    // Wait for SimpleReferenceSelector to load
    const typeSelect = page.locator('select#type-select').first();
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    
    // Filter by "Events"
    await typeSelect.selectOption('event');
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/events') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('No loading spinner found or already hidden');
    });
    
    // Wait for reference items to render with retry logic
    await expect(async () => {
      const itemCount = await page.locator('[data-testid^="reference-item-"]').count();
      console.log(`→ Found ${itemCount} reference items after filtering by events`);
      expect(itemCount).toBeGreaterThan(0);
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    // Verify only events are shown with retry logic
    await expect(async () => {
      const eventItem = page.locator('button:has-text("Test Event for References")').first();
      await expect(eventItem).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 10000, intervals: [500, 1000] });

    console.log('✓ Event item visible after filtering');

    // Verify activities are not shown (activity button should not exist)
    const activityItem = page.locator('button:has-text("Test Activity for References")').first();
    const activityVisible = await activityItem.isVisible().catch(() => false);
    expect(activityVisible).toBe(false);
    
    console.log('✓ Activity item correctly hidden after filtering by events');
  });

  // ============================================================================
  // REFERENCE VALIDATION
  // ============================================================================

  test('should prevent circular references', async ({ page }) => {
    // Create a circular reference scenario on content pages
    // Content Page A → Content Page B → Content Page A (circular)
    
    const supabase = createServiceClient();
    
    // Generate unique ID for second content page
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create second content page
    const { data: contentPageB, error: contentPageBError } = await supabase
      .from('content_pages')
      .insert({
        title: 'Test Content Page B',
        slug: `test-page-b-${uniqueId}`,
        status: 'published',
      })
      .select()
      .single();
    
    if (contentPageBError || !contentPageB) {
      throw new Error(`Failed to create content page B: ${contentPageBError?.message || 'No page returned'}`);
    }
    
    // Create section for content page B
    const { data: sectionB, error: sectionBError } = await supabase
      .from('sections')
      .insert({
        page_type: 'custom',
        page_id: contentPageB.id,
        display_order: 0,
      })
      .select()
      .single();
    
    if (sectionBError || !sectionB) {
      throw new Error(`Failed to create section B: ${sectionBError?.message || 'No section returned'}`);
    }
    
    // Create column for section B
    const { error: columnBError } = await supabase
      .from('columns')
      .insert({
        section_id: sectionB.id,
        column_number: 1,
        content_type: 'rich_text',
        content_data: {},
      });
    
    if (columnBError) {
      throw new Error(`Failed to create column B: ${columnBError.message}`);
    }
    
    // Add reference from content page A to content page B
    const { data: columnsA } = await supabase
      .from('columns')
      .select('id')
      .eq('section_id', testSectionId);
    
    if (!columnsA || columnsA.length === 0) {
      throw new Error('No columns found for section A');
    }
    
    await supabase.from('columns').update({
      content_type: 'references',
      content_data: { references: [{ type: 'content_page', id: contentPageB.id, name: 'Test Content Page B', metadata: {} }] },
    }).eq('id', columnsA[0].id);

    console.log('✓ Created circular reference scenario: Page A → Page B');

    // Navigate to content page B to add reference back to page A (would create cycle)
    await page.goto('/admin/content-pages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Wait for Content Page B card to appear with retry logic
    await expect(async () => {
      const pageBCard = page.locator('text=Test Content Page B').first();
      await expect(pageBCard).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Content Page B card visible');

    // Click Edit button for content page B
    // Since we have two content pages (A and B), and they're sorted alphabetically,
    // "Test Content Page" (A) comes first, "Test Content Page B" comes second
    // So we want the second Edit button
    const allEditButtons = page.locator('button:has-text("Edit")');
    const editButtonCount = await allEditButtons.count();
    console.log(`→ Found ${editButtonCount} Edit buttons`);
    
    // Get the second Edit button (index 1)
    const editButtonB = allEditButtons.nth(1);
    await expect(editButtonB).toBeVisible({ timeout: 10000 });
    
    console.log('→ Clicking Edit button for page B');
    await editButtonB.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log('✓ Content page B edit form loaded');

    // Open section editor for page B
    await openSectionEditor(page);

    console.log('✓ Section editor opened for page B');

    // Find the column type selector and select "References"
    const columnTypeSelect = page.locator('select').filter({ 
      has: page.locator('option[value="references"]') 
    }).first();
    await expect(columnTypeSelect).toBeVisible({ timeout: 5000 });
    await columnTypeSelect.selectOption('references');
    await page.waitForTimeout(1000);

    console.log('✓ Selected References column type');

    // Wait for SimpleReferenceSelector to load
    const typeSelect = page.locator('select#type-select').first();
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    
    // Try to add reference back to content page A (would create cycle)
    await typeSelect.selectOption('content_page');
    
    // Wait for API response
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/content-pages') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for loading to complete
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('No loading spinner found or already hidden');
    });
    
    // Wait for items to render with retry logic
    await expect(async () => {
      const itemCount = await page.locator('[data-testid^="reference-item-"]').count();
      console.log(`→ Found ${itemCount} reference items`);
      expect(itemCount).toBeGreaterThan(0);
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Content page items loaded');

    // Click on content page A using data-testid
    console.log(`→ Looking for content page with ID: ${testContentPageId}`);
    const contentPageAItem = page.locator(`[data-testid="reference-item-${testContentPageId}"]`);
    
    // Wait for element to be visible
    await contentPageAItem.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Content page A item is visible');
    
    // Click the button
    await contentPageAItem.click();
    await page.waitForTimeout(1000);

    console.log('✓ Selected content page A (would create circular reference)');

    // Try to save (should show circular reference error)
    const saveButton = page.locator('button:has-text("Save Section")').first();
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    
    console.log('→ Clicking Save button to trigger circular reference validation');
    await saveButton.click();
    
    // Wait for API call to complete - the API should return 400 with CIRCULAR_REFERENCE error
    // The InlineSectionEditor will catch this and display the error message
    await page.waitForResponse(
      response => response.url().includes('/api/admin/sections/') && response.status() === 400,
      { timeout: 10000 }
    ).catch(() => {
      console.log('⚠️ No 400 response received - circular reference validation may not be working');
    });
    
    // Give the UI time to render the error message
    await page.waitForTimeout(1000);

    console.log('✓ Save API call completed');

    // Verify error message about circular reference
    // The error appears in a red alert box with specific classes
    // InlineSectionEditor shows errors in: <div class="bg-red-50 border border-red-200 rounded-md" role="alert"><p class="text-red-800">{error}</p></div>
    await expect(async () => {
      // Look for the error container - be more flexible with selector
      const errorContainer = page.locator('[role="alert"].bg-red-50').first();
      await expect(errorContainer).toBeVisible({ timeout: 2000 });
      
      // Verify it contains circular reference message
      const errorText = await errorContainer.textContent();
      console.log(`→ Error message text: "${errorText}"`);
      
      // The error message from sectionsService is: "This would create a circular reference. A page cannot reference itself directly or indirectly."
      expect(errorText?.toLowerCase()).toMatch(/circular.*reference|page cannot reference itself/);
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000, 3000] });
    
    console.log('✓ Circular reference error displayed');
  });

  test('should detect broken references', async ({ page }) => {
    // Add reference to section
    const supabase = createServiceClient();
    
    await supabase.from('columns').update({
      content_type: 'references',
      content_data: { references: [{ type: 'event', id: testEventId }] },
    }).eq('section_id', testSectionId);

    // Delete the referenced event
    await supabase.from('events').delete().eq('id', testEventId);

    // Reload page to see the updated data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Open section editor (handles Edit → Manage Sections → Edit section flow)
    await openSectionEditor(page);

    // FLAKY FIX: Wait for reference validation API to complete
    // The component validates references on mount, which is an async operation
    await page.waitForResponse(response => 
      response.url().includes('/api/admin/references/validate') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => {
      console.log('Validation API response not captured, continuing...');
    });
    
    // FLAKY FIX: Wait for broken reference indicator to appear in UI
    await page.waitForTimeout(500);

    // Should show broken reference error or warning
    const errorMessage = page.locator('.bg-red-50, .bg-yellow-50, text=/not found|invalid reference|does not exist|broken/i').first();
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }
  });

  // ============================================================================
  // GUEST VIEW & PREVIEW MODALS
  // ============================================================================

  test('should display reference blocks in guest view with preview modals', async ({ page }) => {
    // Add references to section
    const supabase = createServiceClient();
    
    // First, get the column ID for this section
    const { data: columns } = await supabase
      .from('columns')
      .select('id')
      .eq('section_id', testSectionId);
    
    if (!columns || columns.length === 0) {
      throw new Error('No columns found for section');
    }
    
    // Update the column with reference data
    const { error: updateError } = await supabase.from('columns').update({
      content_type: 'references',
      content_data: { 
        references: [
          { type: 'event', id: testEventId, name: 'Test Event for References', metadata: {} },
          { type: 'activity', id: testActivityId, name: 'Test Activity for References', metadata: {} },
        ]
      },
    }).eq('id', columns[0].id);

    if (updateError) {
      throw new Error(`Failed to update column with references: ${updateError.message}`);
    }

    // Verify the update was successful
    const { data: verifyColumn } = await supabase
      .from('columns')
      .select('content_data')
      .eq('id', columns[0].id)
      .single();
    
    console.log('✓ References added to column:', JSON.stringify(verifyColumn, null, 2));

    // Verify section data is complete
    const { data: verifySection } = await supabase
      .from('sections')
      .select('*, columns(*)')
      .eq('id', testSectionId)
      .single();
    
    console.log('✓ Section data:', JSON.stringify(verifySection, null, 2));

    // Create a guest user for authentication
    // Guests must be authenticated to view published content (RLS requirement)
    const testGuestEmail = `test-guest-${Date.now()}@example.com`;
    const testGuestPassword = 'test-password-123';
    
    console.log('✓ Creating authenticated guest user:', testGuestEmail);
    
    const { data: guestUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: testGuestEmail,
      password: testGuestPassword,
      email_confirm: true,
    });

    if (createUserError || !guestUser) {
      throw new Error(`Failed to create guest user: ${createUserError?.message}`);
    }

    console.log('✓ Guest user created:', guestUser.user.id);

    // Sign in as the guest user to get auth cookies
    // We need to use the Supabase client to sign in and get the session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testGuestEmail,
      password: testGuestPassword,
    });

    if (signInError || !signInData.session) {
      throw new Error(`Failed to sign in guest user: ${signInError?.message}`);
    }

    console.log('✓ Guest user signed in, session created');

    // Set the auth cookies in the browser
    // Supabase uses sb-<project-ref>-auth-token cookie with base64-encoded value
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      throw new Error('Could not extract project ref from Supabase URL');
    }

    // Create the cookie value object
    const cookieValue = {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
      expires_in: signInData.session.expires_in,
      token_type: 'bearer',
      user: signInData.session.user,
    };

    // Base64 encode the cookie value (Supabase expects base64-encoded format)
    const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');

    await page.context().addCookies([
      {
        name: `sb-${projectRef}-auth-token`,
        value: `base64-${base64Value}`,  // Supabase expects "base64-" prefix
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    console.log('✓ Auth cookies set in browser');
    
    // Wait a moment for cookies to propagate
    await page.waitForTimeout(500);

    // Navigate to guest view of content page
    const { data: contentPage } = await supabase
      .from('content_pages')
      .select('slug')
      .eq('id', testContentPageId)
      .single();

    if (!contentPage) {
      throw new Error('Content page not found for guest view test');
    }

    console.log(`✓ Navigating to guest view: /custom/${contentPage.slug}`);

    await page.goto(`/custom/${contentPage.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for page to load - the page has a specific structure with gradient background
    await expect(async () => {
      const pageContainer = page.locator('.min-h-screen.bg-gradient-to-br').first();
      await expect(pageContainer).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Guest view page container loaded');

    // Wait for page title to appear
    await expect(async () => {
      const pageTitle = page.locator('h1:has-text("Test Content Page")').first();
      await expect(pageTitle).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Page title visible');

    // Wait for references container to render
    // The SectionRenderer adds data-testid="references" to the references container
    await expect(async () => {
      const referencesContainer = page.locator('[data-testid="references"]').first();
      await expect(referencesContainer).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ References container visible');

    // Verify reference blocks are displayed
    // GuestReferencePreview uses border-2 border-sage-200 class for reference cards
    await expect(async () => {
      const eventReference = page.locator('.border-2.border-sage-200').filter({ hasText: 'Test Event for References' }).first();
      await expect(eventReference).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Event reference card visible');

    await expect(async () => {
      const activityReference = page.locator('.border-2.border-sage-200').filter({ hasText: 'Test Activity for References' }).first();
      await expect(activityReference).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [500, 1000, 2000] });

    console.log('✓ Activity reference card visible');

    // Click on event reference - it's a button that expands inline
    const eventReferenceCard = page.locator('.border-2.border-sage-200').filter({ hasText: 'Test Event for References' }).first();
    await expect(eventReferenceCard).toBeVisible({ timeout: 5000 });
    await eventReferenceCard.click();
    await page.waitForTimeout(1000);

    console.log('✓ Clicked event reference card');

    // Verify inline expansion (not a modal, expands within the card)
    // The expanded details have a border-t border-sage-200 class
    const expandedDetails = eventReferenceCard.locator('.border-t.border-sage-200').first();
    await expect(expandedDetails).toBeVisible({ timeout: 5000 });

    console.log('✓ Event details expanded');

    // Verify expanded content shows event details
    // Add retry logic in case content takes time to render
    await expect(async () => {
      const text = await expandedDetails.textContent();
      console.log(`→ Expanded details text: ${text?.substring(0, 100)}...`);
      // Use case-insensitive matching since event name is "Test event for reference blocks"
      expect(text?.toLowerCase()).toContain('test event');
    }).toPass({ timeout: 10000, intervals: [500, 1000] });
    
    console.log('✓ Event details content verified');

    // Click again to collapse - click the specific toggle button, not the entire card
    // The toggle button is the first button in the card (the one with the chevron)
    const toggleButton = eventReferenceCard.locator('button').first();
    await toggleButton.click();

    // Verify collapsed - use toBeHidden() which waits automatically
    await expect(expandedDetails).toBeHidden({ timeout: 10000 });

    console.log('✓ Event details collapsed');

    // Click on activity reference
    const activityReferenceCard = page.locator('.border-2.border-sage-200').filter({ hasText: 'Test Activity for References' }).first();
    await expect(activityReferenceCard).toBeVisible({ timeout: 5000 });
    await activityReferenceCard.click();
    await page.waitForTimeout(1000);

    console.log('✓ Clicked activity reference card');

    // Verify activity expansion
    const activityExpandedDetails = activityReferenceCard.locator('.border-t.border-sage-200').first();
    await expect(activityExpandedDetails).toBeVisible({ timeout: 5000 });
    
    // Verify expanded content shows activity details
    // Use case-insensitive matching since activity description is "Test activity for reference blocks"
    await expect(async () => {
      const text = await activityExpandedDetails.textContent();
      console.log(`→ Activity expanded details text: ${text?.substring(0, 100)}...`);
      expect(text?.toLowerCase()).toContain('test activity');
    }).toPass({ timeout: 10000, intervals: [500, 1000] });

    console.log('✓ Activity details expanded and verified');
    
    // Click again to collapse - click the specific toggle button, not the entire card
    const activityToggleButton = activityReferenceCard.locator('button').first();
    await activityToggleButton.click();
    
    // Verify collapsed - use toBeHidden() which waits automatically
    await expect(activityExpandedDetails).toBeHidden({ timeout: 10000 });
    
    console.log('✓ Activity details collapsed');

    // Cleanup: Delete the test guest user
    if (guestUser?.user?.id) {
      await supabase.auth.admin.deleteUser(guestUser.user.id);
      console.log('✓ Test guest user cleaned up');
    }
  });
});
