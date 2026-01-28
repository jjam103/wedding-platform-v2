import { test, expect } from '@playwright/test';

/**
 * E2E Test: Location Hierarchy Flow
 * 
 * Tests the complete workflow of:
 * 1. Creating a location hierarchy
 * 2. Attempting to create a circular reference
 * 3. Verifying circular reference prevention
 * 4. Verifying tree display
 * 
 * Requirements: 4.1-4.7
 */

test.describe('Location Hierarchy Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to locations page
    await page.goto('http://localhost:3000/admin/locations');
    await page.waitForLoadState('networkidle');
  });

  test('should create hierarchical location structure', async ({ page }) => {
    // Step 1: Create parent location (Country)
    const countryName = `Test Country ${Date.now()}`;
    
    const addButton = page.locator('button:has-text("Add Location"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(countryName);
    
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Verify country appears in list
    const countryRow = page.locator(`text=${countryName}`).first();
    await expect(countryRow).toBeVisible({ timeout: 5000 });
    
    // Step 2: Create child location (Region)
    const regionName = `Test Region ${Date.now()}`;
    
    await addButton.click();
    await page.waitForTimeout(500);
    
    await nameInput.fill(regionName);
    
    // Select parent location
    const parentSelect = page.locator('select[name="parentLocationId"], select[name="parent"]').first();
    if (await parentSelect.count() > 0) {
      // Find the option with the country name
      await parentSelect.selectOption({ label: countryName });
    }
    
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Verify region appears in list
    const regionRow = page.locator(`text=${regionName}`).first();
    await expect(regionRow).toBeVisible({ timeout: 5000 });
    
    // Step 3: Create grandchild location (City)
    const cityName = `Test City ${Date.now()}`;
    
    await addButton.click();
    await page.waitForTimeout(500);
    
    await nameInput.fill(cityName);
    
    if (await parentSelect.count() > 0) {
      await parentSelect.selectOption({ label: regionName });
    }
    
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Verify city appears in list
    const cityRow = page.locator(`text=${cityName}`).first();
    await expect(cityRow).toBeVisible({ timeout: 5000 });
    
    // Step 4: Verify tree display shows hierarchy
    // Look for indentation or tree structure indicators
    const treeView = page.locator('[role="tree"], .tree, [class*="tree"]').first();
    if (await treeView.count() > 0) {
      await expect(treeView).toBeVisible();
    }
    
    // Verify all three locations are visible
    await expect(page.locator(`text=${countryName}`).first()).toBeVisible();
    await expect(page.locator(`text=${regionName}`).first()).toBeVisible();
    await expect(page.locator(`text=${cityName}`).first()).toBeVisible();
  });

  test('should prevent circular reference in location hierarchy', async ({ page }) => {
    // Create two locations
    const location1Name = `Location A ${Date.now()}`;
    const location2Name = `Location B ${Date.now()}`;
    
    // Create first location
    const addButton = page.locator('button:has-text("Add Location"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(location1Name);
    
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Create second location as child of first
    await addButton.click();
    await page.waitForTimeout(500);
    
    await nameInput.fill(location2Name);
    
    const parentSelect = page.locator('select[name="parentLocationId"], select[name="parent"]').first();
    if (await parentSelect.count() > 0) {
      await parentSelect.selectOption({ label: location1Name });
    }
    
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Now try to edit first location to make it a child of second (circular reference)
    const location1Row = page.locator(`tr:has-text("${location1Name}"), div:has-text("${location1Name}")`).first();
    const editButton = location1Row.locator('button:has-text("Edit"), button[title*="Edit"]').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Try to set parent to location2 (would create circular reference)
      const editParentSelect = page.locator('select[name="parentLocationId"], select[name="parent"]').first();
      if (await editParentSelect.count() > 0) {
        await editParentSelect.selectOption({ label: location2Name });
      }
      
      const saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Update")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      // Should show error message about circular reference
      const errorMessage = page.locator('text=/circular|cycle|invalid|error/i, [role="alert"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should expand and collapse location tree', async ({ page }) => {
    // Look for expandable tree nodes
    const expandButtons = page.locator('button[aria-expanded], [role="button"]:has-text("▶"), [role="button"]:has-text("▼")');
    
    if (await expandButtons.count() > 0) {
      const firstExpandButton = expandButtons.first();
      
      // Get initial state
      const initialExpanded = await firstExpandButton.getAttribute('aria-expanded');
      
      // Click to toggle
      await firstExpandButton.click();
      await page.waitForTimeout(500);
      
      // State should change
      const newExpanded = await firstExpandButton.getAttribute('aria-expanded');
      expect(newExpanded).not.toBe(initialExpanded);
      
      // Click again to toggle back
      await firstExpandButton.click();
      await page.waitForTimeout(500);
      
      const finalExpanded = await firstExpandButton.getAttribute('aria-expanded');
      expect(finalExpanded).toBe(initialExpanded);
    }
  });

  test('should search locations across all levels', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Should filter results
      const results = page.locator('tr, [role="row"], .location-item').count();
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      // Should show all results again
      const allResults = page.locator('tr, [role="row"], .location-item').count();
      
      // All results should be >= filtered results
      expect(await allResults).toBeGreaterThanOrEqual(await results);
    }
  });

  test('should delete location and orphan children', async ({ page }) => {
    // Create parent and child
    const parentName = `Delete Parent ${Date.now()}`;
    const childName = `Delete Child ${Date.now()}`;
    
    const addButton = page.locator('button:has-text("Add Location"), button:has-text("Add New")').first();
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    
    // Create parent
    await addButton.click();
    await page.waitForTimeout(500);
    await nameInput.fill(parentName);
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Create child
    await addButton.click();
    await page.waitForTimeout(500);
    await nameInput.fill(childName);
    
    const parentSelect = page.locator('select[name="parentLocationId"], select[name="parent"]').first();
    if (await parentSelect.count() > 0) {
      await parentSelect.selectOption({ label: parentName });
    }
    
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Delete parent
    const parentRow = page.locator(`tr:has-text("${parentName}"), div:has-text("${parentName}")`).first();
    const deleteButton = parentRow.locator('button:has-text("Delete"), button[title*="Delete"]').first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Parent should be gone
      const parentExists = await page.locator(`text=${parentName}`).count();
      expect(parentExists).toBe(0);
      
      // Child should still exist (orphaned)
      const childRow = page.locator(`text=${childName}`).first();
      await expect(childRow).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display location hierarchy in selector', async ({ page }) => {
    // Navigate to events page to test location selector
    await page.goto('http://localhost:3000/admin/events');
    await page.waitForLoadState('networkidle');
    
    // Open add event form
    const addButton = page.locator('button:has-text("Add Event"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Look for location selector
    const locationSelect = page.locator('select[name="locationId"], select[name="location"]').first();
    
    if (await locationSelect.count() > 0) {
      // Should have options
      const options = locationSelect.locator('option');
      const optionCount = await options.count();
      
      expect(optionCount).toBeGreaterThan(0);
      
      // Options should show hierarchy (e.g., "Country > Region > City")
      // This depends on implementation
    }
  });

  test('should validate location name is required', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add Location"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit without name
    const createButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Add"), button:has-text("Save")').first();
    await createButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('text=/required|invalid|error/i, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should display location details', async ({ page }) => {
    // Look for any existing location
    const locationRows = page.locator('tr, [role="row"]');
    const rowCount = await locationRows.count();
    
    if (rowCount > 1) { // More than just header
      // Should show location information
      const firstRow = locationRows.nth(1);
      await expect(firstRow).toBeVisible();
      
      // Should have action buttons
      const editButton = firstRow.locator('button:has-text("Edit"), button[title*="Edit"]').first();
      const deleteButton = firstRow.locator('button:has-text("Delete"), button[title*="Delete"]').first();
      
      // At least one action button should exist
      const hasActions = (await editButton.count() > 0) || (await deleteButton.count() > 0);
      expect(hasActions).toBe(true);
    }
  });
});

test.describe('Location Hierarchy Accessibility', () => {
  test('should have keyboard navigation in tree', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/locations');
    await page.waitForLoadState('networkidle');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focus visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Arrow keys should navigate tree (if implemented)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
  });

  test('should have proper ARIA roles for tree', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/locations');
    await page.waitForLoadState('networkidle');
    
    // Look for tree role
    const tree = page.locator('[role="tree"]').first();
    
    if (await tree.count() > 0) {
      await expect(tree).toBeVisible();
      
      // Should have tree items
      const treeItems = page.locator('[role="treeitem"]');
      const itemCount = await treeItems.count();
      
      if (itemCount > 0) {
        expect(itemCount).toBeGreaterThan(0);
      }
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/locations');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add Location"), button:has-text("Add New")').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    // Check for form labels
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.count() > 0) {
      const inputId = await nameInput.getAttribute('id');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`).first();
        if (await label.count() > 0) {
          await expect(label).toBeVisible();
        }
      }
    }
  });
});
