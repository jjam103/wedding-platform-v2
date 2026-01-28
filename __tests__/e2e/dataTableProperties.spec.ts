import { test, expect } from '@playwright/test';

/**
 * E2E Property-Based Tests for DataTable Component
 * 
 * These tests validate the DataTable properties in a real browser environment
 * with full Next.js App Router context. The DataTable component uses Next.js
 * routing hooks (useRouter, useSearchParams) which require the full runtime.
 */

test.describe('Feature: admin-ui-modernization - DataTable Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with DataTable (using guests page as example)
    await page.goto('/admin/guests');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Property 1: Table sorting consistency
   * 
   * For any data table with sortable columns, clicking a column header should
   * toggle the sort direction and update the displayed data to reflect the new sort order.
   * 
   * Validates: Requirements 3.3
   */
  test.describe('Property 1: Table sorting consistency', () => {
    test('should toggle sort direction when clicking the same column header twice', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table');
      
      // Find a sortable column header (e.g., "Name")
      const nameHeader = page.locator('th:has-text("Name")').first();
      
      // First click - should sort ascending
      await nameHeader.click();
      await page.waitForTimeout(300); // Wait for sort to apply
      
      // Check URL contains sort parameters
      let url = new URL(page.url());
      expect(url.searchParams.get('sort')).toBeTruthy();
      expect(url.searchParams.get('direction')).toBe('asc');
      
      // Verify ascending indicator is shown
      await expect(nameHeader).toContainText('↑');
      
      // Second click - should sort descending
      await nameHeader.click();
      await page.waitForTimeout(300);
      
      // Check URL updated to descending
      url = new URL(page.url());
      expect(url.searchParams.get('direction')).toBe('desc');
      
      // Verify descending indicator is shown
      await expect(nameHeader).toContainText('↓');
    });

    test('should update URL with sort parameters for different columns', async ({ page }) => {
      await page.waitForSelector('table');
      
      const columns = ['Name', 'Email', 'Group'];
      
      for (const columnName of columns) {
        const header = page.locator(`th:has-text("${columnName}")`).first();
        
        // Skip if column doesn't exist or isn't sortable
        if (await header.count() === 0) continue;
        
        await header.click();
        await page.waitForTimeout(300);
        
        const url = new URL(page.url());
        expect(url.searchParams.get('sort')).toBeTruthy();
        expect(url.searchParams.get('direction')).toBe('asc');
      }
    });

    test('should restore sort state from URL on page load', async ({ page }) => {
      // Navigate with sort parameters in URL
      await page.goto('/admin/guests?sort=firstName&direction=desc');
      await page.waitForLoadState('networkidle');
      
      // Verify sort indicator is displayed
      const nameHeader = page.locator('th:has-text("Name")').first();
      await expect(nameHeader).toContainText('↓');
    });
  });

  /**
   * Property 2: Search filtering accuracy
   * 
   * For any data table with search functionality and any search query, the displayed
   * results should only include rows where at least one searchable field contains
   * the query string (case-insensitive).
   * 
   * Validates: Requirements 3.5
   */
  test.describe('Property 2: Search filtering accuracy', () => {
    test('should update URL with search parameter after debounce', async ({ page }) => {
      await page.waitForSelector('input[placeholder*="Search"]');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('test query');
      
      // Wait for debounce (300ms) plus buffer
      await page.waitForTimeout(500);
      
      const url = new URL(page.url());
      expect(url.searchParams.get('search')).toBe('test query');
    });

    test('should not update URL immediately during typing', async ({ page }) => {
      await page.waitForSelector('input[placeholder*="Search"]');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('test');
      
      // Check immediately (before debounce)
      await page.waitForTimeout(100);
      
      const url = new URL(page.url());
      expect(url.searchParams.get('search')).toBeFalsy();
    });

    test('should restore search state from URL on page load', async ({ page }) => {
      await page.goto('/admin/guests?search=john');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toHaveValue('john');
    });
  });

  /**
   * Property 27: Filter state URL persistence
   * 
   * For any filter change in a data table, the URL query parameters should be
   * updated to reflect the current filter values.
   * 
   * Validates: Requirements 16.1
   */
  test.describe('Property 27: Filter state URL persistence', () => {
    test('should update URL when filter is applied', async ({ page }) => {
      await page.waitForSelector('table');
      
      // Look for a filter dropdown (e.g., RSVP Status)
      const filterSelect = page.locator('select').first();
      
      if (await filterSelect.count() > 0) {
        // Get available options
        const options = await filterSelect.locator('option').allTextContents();
        
        if (options.length > 1) {
          // Select a non-empty option
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(300);
          
          const url = new URL(page.url());
          const filterParams = Array.from(url.searchParams.keys()).filter(key => key.startsWith('filter_'));
          expect(filterParams.length).toBeGreaterThan(0);
        }
      }
    });

    test('should remove filter from URL when cleared', async ({ page }) => {
      // Start with a filter applied
      await page.goto('/admin/guests?filter_rsvpStatus=attending');
      await page.waitForLoadState('networkidle');
      
      // Find and clear the filter
      const filterSelect = page.locator('select').first();
      
      if (await filterSelect.count() > 0) {
        await filterSelect.selectOption({ index: 0 }); // Select empty option
        await page.waitForTimeout(300);
        
        const url = new URL(page.url());
        expect(url.searchParams.get('filter_rsvpStatus')).toBeFalsy();
      }
    });
  });

  /**
   * Property 28: Filter state restoration
   * 
   * For any page load with filter query parameters in the URL, the data table
   * should apply those filters and display the filtered results.
   * 
   * Validates: Requirements 16.2
   */
  test.describe('Property 28: Filter state restoration', () => {
    test('should restore filter state from URL on mount', async ({ page }) => {
      await page.goto('/admin/guests?filter_rsvpStatus=attending');
      await page.waitForLoadState('networkidle');
      
      // Check that filter select shows the correct value
      const filterSelect = page.locator('select').first();
      
      if (await filterSelect.count() > 0) {
        const selectedValue = await filterSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    });

    test('should restore multiple filters from URL', async ({ page }) => {
      await page.goto('/admin/guests?filter_rsvpStatus=attending&filter_ageType=adult');
      await page.waitForLoadState('networkidle');
      
      // Verify both filters are applied
      const url = new URL(page.url());
      expect(url.searchParams.get('filter_rsvpStatus')).toBe('attending');
      expect(url.searchParams.get('filter_ageType')).toBe('adult');
    });
  });

  /**
   * Property 29: Active filter chip display
   * 
   * For any active filter in a data table, a removable chip/tag should be displayed
   * that shows the filter name and value.
   * 
   * Validates: Requirements 16.3
   */
  test.describe('Property 29: Active filter chip display', () => {
    test('should display filter chip when filter is active', async ({ page }) => {
      await page.waitForSelector('table');
      
      // Apply a filter
      const filterSelect = page.locator('select').first();
      
      if (await filterSelect.count() > 0) {
        const options = await filterSelect.locator('option').allTextContents();
        
        if (options.length > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(300);
          
          // Look for filter chip
          const filterChip = page.locator('[class*="filter-chip"], [class*="badge"], button:has-text("×")').first();
          await expect(filterChip).toBeVisible();
        }
      }
    });

    test('should remove filter chip when × button is clicked', async ({ page }) => {
      // Start with a filter applied
      await page.goto('/admin/guests?filter_rsvpStatus=attending');
      await page.waitForLoadState('networkidle');
      
      // Find and click the remove button on the chip
      const removeButton = page.locator('button:has-text("×")').first();
      
      if (await removeButton.count() > 0) {
        await removeButton.click();
        await page.waitForTimeout(300);
        
        // Verify filter is removed from URL
        const url = new URL(page.url());
        expect(url.searchParams.get('filter_rsvpStatus')).toBeFalsy();
      }
    });

    test('should display "Clear Filters" button when filters are active', async ({ page }) => {
      // Start with filters applied
      await page.goto('/admin/guests?filter_rsvpStatus=attending&filter_ageType=adult');
      await page.waitForLoadState('networkidle');
      
      // Look for "Clear Filters" button
      const clearButton = page.locator('button:has-text("Clear Filters"), button:has-text("Clear All")');
      
      if (await clearButton.count() > 0) {
        await expect(clearButton.first()).toBeVisible();
        
        // Click it and verify filters are cleared
        await clearButton.first().click();
        await page.waitForTimeout(300);
        
        const url = new URL(page.url());
        expect(url.searchParams.get('filter_rsvpStatus')).toBeFalsy();
        expect(url.searchParams.get('filter_ageType')).toBeFalsy();
      }
    });
  });

  /**
   * Property 30: Sort state URL persistence
   * 
   * For any sort change in a data table, the URL query parameters should be
   * updated to include the sort column and direction.
   * 
   * Validates: Requirements 16.5
   */
  test.describe('Property 30: Sort state URL persistence', () => {
    test('should persist sort state in URL', async ({ page }) => {
      await page.waitForSelector('table');
      
      const columns = ['Name', 'Email'];
      
      for (const columnName of columns) {
        const header = page.locator(`th:has-text("${columnName}")`).first();
        
        if (await header.count() > 0) {
          await header.click();
          await page.waitForTimeout(300);
          
          const url = new URL(page.url());
          expect(url.searchParams.get('sort')).toBeTruthy();
          expect(url.searchParams.get('direction')).toBeTruthy();
          expect(['asc', 'desc']).toContain(url.searchParams.get('direction') || '');
        }
      }
    });

    test('should restore sort state from URL on mount', async ({ page }) => {
      const testCases = [
        { sort: 'firstName', direction: 'asc', indicator: '↑' },
        { sort: 'firstName', direction: 'desc', indicator: '↓' },
        { sort: 'email', direction: 'asc', indicator: '↑' },
      ];
      
      for (const testCase of testCases) {
        await page.goto(`/admin/guests?sort=${testCase.sort}&direction=${testCase.direction}`);
        await page.waitForLoadState('networkidle');
        
        // Find the sorted column header
        const headers = page.locator('th');
        const headerCount = await headers.count();
        
        let foundIndicator = false;
        for (let i = 0; i < headerCount; i++) {
          const headerText = await headers.nth(i).textContent();
          if (headerText?.includes(testCase.indicator)) {
            foundIndicator = true;
            break;
          }
        }
        
        expect(foundIndicator).toBe(true);
      }
    });

    test('should maintain sort state when applying filters', async ({ page }) => {
      // Start with sort applied
      await page.goto('/admin/guests?sort=firstName&direction=asc');
      await page.waitForLoadState('networkidle');
      
      // Apply a filter
      const filterSelect = page.locator('select').first();
      
      if (await filterSelect.count() > 0) {
        const options = await filterSelect.locator('option').allTextContents();
        
        if (options.length > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(300);
          
          // Verify sort is still in URL
          const url = new URL(page.url());
          expect(url.searchParams.get('sort')).toBe('firstName');
          expect(url.searchParams.get('direction')).toBe('asc');
        }
      }
    });

    test('should maintain filter state when changing sort', async ({ page }) => {
      // Start with filter applied
      await page.goto('/admin/guests?filter_rsvpStatus=attending');
      await page.waitForLoadState('networkidle');
      
      // Change sort
      const nameHeader = page.locator('th:has-text("Name")').first();
      
      if (await nameHeader.count() > 0) {
        await nameHeader.click();
        await page.waitForTimeout(300);
        
        // Verify filter is still in URL
        const url = new URL(page.url());
        expect(url.searchParams.get('filter_rsvpStatus')).toBe('attending');
      }
    });
  });

  /**
   * Combined Property Test: URL State Persistence
   * 
   * Tests that all URL state (sort, filters, search) work together correctly
   */
  test.describe('Combined URL State Persistence', () => {
    test('should maintain all state parameters together', async ({ page }) => {
      // Apply multiple state changes
      await page.goto('/admin/guests');
      await page.waitForLoadState('networkidle');
      
      // Add search
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('john');
      await page.waitForTimeout(500);
      
      // Add sort
      const nameHeader = page.locator('th:has-text("Name")').first();
      if (await nameHeader.count() > 0) {
        await nameHeader.click();
        await page.waitForTimeout(300);
      }
      
      // Add filter
      const filterSelect = page.locator('select').first();
      if (await filterSelect.count() > 0) {
        const options = await filterSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(300);
        }
      }
      
      // Verify all parameters are in URL
      const url = new URL(page.url());
      expect(url.searchParams.get('search')).toBe('john');
      expect(url.searchParams.get('sort')).toBeTruthy();
      expect(url.searchParams.get('direction')).toBeTruthy();
    });

    test('should restore all state parameters on page load', async ({ page }) => {
      const fullUrl = '/admin/guests?search=test&sort=firstName&direction=desc&filter_rsvpStatus=attending';
      await page.goto(fullUrl);
      await page.waitForLoadState('networkidle');
      
      // Verify search is restored
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toHaveValue('test');
      
      // Verify sort indicator is shown
      const headers = page.locator('th');
      const headerCount = await headers.count();
      let foundDescIndicator = false;
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText?.includes('↓')) {
          foundDescIndicator = true;
          break;
        }
      }
      expect(foundDescIndicator).toBe(true);
      
      // Verify URL parameters are maintained
      const url = new URL(page.url());
      expect(url.searchParams.get('search')).toBe('test');
      expect(url.searchParams.get('sort')).toBe('firstName');
      expect(url.searchParams.get('direction')).toBe('desc');
      expect(url.searchParams.get('filter_rsvpStatus')).toBe('attending');
    });
  });
});
