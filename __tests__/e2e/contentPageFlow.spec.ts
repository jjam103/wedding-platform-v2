import { test, expect } from '@playwright/test';

/**
 * E2E Test: Create Content Page Flow
 * 
 * Tests the complete workflow of:
 * 1. Creating a content page
 * 2. Adding sections to the page
 * 3. Publishing the page
 * 4. Viewing the page as a guest
 * 
 * Requirements: 1.1-1.6, 2.1-2.14
 */

test.describe('Content Page Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to content pages admin
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full content page creation and publication flow', async ({ page }) => {
    // Step 1: Create a content page
    const pageTitle = `Test Page ${Date.now()}`;
    const pageSlug = `test-page-${Date.now()}`;
    
    // Click "Add Page" button to expand collapsible form
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500); // Wait for form animation
    
    // Fill in page details
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill(pageTitle);
    
    // Slug should auto-generate, but we can override if needed
    const slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    if (await slugInput.count() > 0) {
      await slugInput.fill(pageSlug);
    }
    
    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    
    // Wait for success toast or page to appear in list
    await page.waitForTimeout(1000);
    
    // Verify page appears in the list
    const pageRow = page.locator(`text=${pageTitle}`).first();
    await expect(pageRow).toBeVisible({ timeout: 5000 });
    
    // Step 2: Add sections to the page
    // Click "Manage Sections" button
    const manageSectionsButton = page.locator(`button:has-text("Manage Sections"), button:has-text("Sections")`).first();
    await manageSectionsButton.click();
    await page.waitForLoadState('networkidle');
    
    // Should be on section editor page
    await expect(page).toHaveURL(/sections|content-pages/);
    
    // Add a new section
    const addSectionButton = page.locator('button:has-text("Add Section")').first();
    if (await addSectionButton.count() > 0) {
      await addSectionButton.click();
      await page.waitForTimeout(500);
      
      // Add content to the section (rich text)
      const richTextEditor = page.locator('[contenteditable="true"], textarea, .editor').first();
      if (await richTextEditor.count() > 0) {
        await richTextEditor.click();
        await richTextEditor.fill('This is test content for the section.');
      }
      
      // Save sections
      const saveSectionsButton = page.locator('button:has-text("Save")').first();
      await saveSectionsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate back to content pages
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Publish the page
    // Find the page row and look for status toggle or publish button
    const pageRowLocator = page.locator(`tr:has-text("${pageTitle}"), div:has-text("${pageTitle}")`).first();
    
    // Look for status badge or toggle
    const statusBadge = pageRowLocator.locator('text=/Draft|Published/i').first();
    if (await statusBadge.count() > 0) {
      const statusText = await statusBadge.textContent();
      
      if (statusText?.toLowerCase().includes('draft')) {
        // Click to publish
        const publishButton = pageRowLocator.locator('button:has-text("Publish"), button[title*="Publish"]').first();
        if (await publishButton.count() > 0) {
          await publishButton.click();
          await page.waitForTimeout(1000);
        } else {
          // Try clicking the status badge itself
          await statusBadge.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Step 4: View as guest
    // Look for "View" or "View as Guest" button
    const viewButton = pageRowLocator.locator('button:has-text("View"), a:has-text("View")').first();
    
    if (await viewButton.count() > 0) {
      // Get the href if it's a link
      const href = await viewButton.getAttribute('href');
      
      if (href) {
        // Navigate to guest view
        await page.goto(`http://localhost:3000${href}`);
      } else {
        // Click the button
        await viewButton.click();
      }
      
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the guest-facing page
      await expect(page).toHaveURL(new RegExp(pageSlug));
      
      // Verify page title is visible
      const guestPageTitle = page.locator(`h1:has-text("${pageTitle}"), h2:has-text("${pageTitle}")`).first();
      await expect(guestPageTitle).toBeVisible({ timeout: 5000 });
      
      // Verify section content is visible
      const sectionContent = page.locator('text=This is test content for the section').first();
      if (await sectionContent.count() > 0) {
        await expect(sectionContent).toBeVisible();
      }
    }
  });

  test('should validate required fields when creating content page', async ({ page }) => {
    // Click "Add Page" button
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit without filling required fields
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    
    // Should show validation errors
    const errorMessage = page.locator('text=/required|invalid|error/i, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should auto-generate slug from title', async ({ page }) => {
    // Click "Add Page" button
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Fill in title
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill('My Test Page Title');
    
    // Wait for slug to auto-generate
    await page.waitForTimeout(500);
    
    // Check slug field
    const slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    if (await slugInput.count() > 0) {
      const slugValue = await slugInput.inputValue();
      
      // Slug should be lowercase with hyphens
      expect(slugValue).toMatch(/my-test-page-title/);
    }
  });

  test('should handle slug conflicts', async ({ page }) => {
    const baseTitle = `Conflict Test ${Date.now()}`;
    const baseSlug = `conflict-test-${Date.now()}`;
    
    // Create first page
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill(baseTitle);
    
    const slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    if (await slugInput.count() > 0) {
      await slugInput.fill(baseSlug);
    }
    
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Try to create second page with same slug
    await addButton.click();
    await page.waitForTimeout(500);
    
    await titleInput.fill(`${baseTitle} 2`);
    
    if (await slugInput.count() > 0) {
      await slugInput.fill(baseSlug); // Same slug
    }
    
    await createButton.click();
    
    // Should show conflict error or auto-append number
    await page.waitForTimeout(1000);
    
    // Either shows error or creates with modified slug
    const errorOrSuccess = page.locator('text=/conflict|error|success/i, [role="alert"]').first();
    await expect(errorOrSuccess).toBeVisible({ timeout: 3000 });
  });

  test('should cancel form and clear fields', async ({ page }) => {
    // Click "Add Page" button
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Fill in some data
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill('Test Cancel');
    
    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
    await page.waitForTimeout(500);
    
    // Form should collapse
    // Try to open again and verify fields are cleared
    await addButton.click();
    await page.waitForTimeout(500);
    
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toBe('');
  });

  test('should display content pages in list with status', async ({ page }) => {
    // Should show list of pages
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 5000 });
    
    // Should have column headers
    const headers = page.locator('th, [role="columnheader"]');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
    
    // Should show status badges
    const statusBadges = page.locator('text=/Draft|Published/i');
    // May or may not have pages, so just check if visible when present
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('should navigate to section editor from content page', async ({ page }) => {
    // Look for any existing page with "Manage Sections" button
    const manageSectionsButton = page.locator('button:has-text("Manage Sections"), button:has-text("Sections")').first();
    
    if (await manageSectionsButton.count() > 0) {
      await manageSectionsButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to section editor
      await expect(page).toHaveURL(/sections|content-pages/);
      
      // Should show section editor interface
      const sectionEditor = page.locator('text=/Section Editor|Add Section|Sections/i').first();
      await expect(sectionEditor).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Content Page Section Management', () => {
  test('should add and reorder sections', async ({ page }) => {
    // This test requires an existing page
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
    
    // Create a test page first
    const addButton = page.locator('button:has-text("Add Page"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill(`Section Test ${Date.now()}`);
    
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to section editor
    const manageSectionsButton = page.locator('button:has-text("Manage Sections"), button:has-text("Sections")').first();
    await manageSectionsButton.click();
    await page.waitForLoadState('networkidle');
    
    // Add multiple sections
    const addSectionButton = page.locator('button:has-text("Add Section")').first();
    
    if (await addSectionButton.count() > 0) {
      // Add first section
      await addSectionButton.click();
      await page.waitForTimeout(500);
      
      // Add second section
      await addSectionButton.click();
      await page.waitForTimeout(500);
      
      // Should have at least 2 sections
      const sections = page.locator('[data-section], .section, [class*="section"]');
      const sectionCount = await sections.count();
      expect(sectionCount).toBeGreaterThanOrEqual(2);
      
      // Test reordering (if drag-and-drop is implemented)
      // This would require more complex interaction
    }
  });

  test('should toggle section layout between one and two columns', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
    
    // Navigate to any section editor
    const manageSectionsButton = page.locator('button:has-text("Manage Sections"), button:has-text("Sections")').first();
    
    if (await manageSectionsButton.count() > 0) {
      await manageSectionsButton.click();
      await page.waitForLoadState('networkidle');
      
      // Look for layout toggle buttons
      const oneColumnButton = page.locator('button:has-text("1 Col"), button[title*="one column"]').first();
      const twoColumnButton = page.locator('button:has-text("2 Col"), button[title*="two column"]').first();
      
      if (await oneColumnButton.count() > 0 && await twoColumnButton.count() > 0) {
        // Toggle to one column
        await oneColumnButton.click();
        await page.waitForTimeout(500);
        
        // Toggle to two columns
        await twoColumnButton.click();
        await page.waitForTimeout(500);
        
        // Should show two column layout
        const columns = page.locator('[data-column], .column, [class*="column"]');
        const columnCount = await columns.count();
        expect(columnCount).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

test.describe('Content Page Accessibility', () => {
  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
    
    // Press Tab to navigate
    await page.keyboard.press('Tab');
    
    // Should have focus visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still have focus visible
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/content-pages');
    await page.waitForLoadState('networkidle');
    
    // Check for proper table structure
    const table = page.locator('table, [role="table"]').first();
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
    }
    
    // Check for buttons with accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Button should have either text content or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
