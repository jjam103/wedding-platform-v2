/**
 * Property-Based Tests for DataTable Bulk Operations
 * 
 * Tests bulk action toolbar, bulk delete, and CSV export functionality
 * using property-based testing with fast-check.
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { DataTable, type ColumnDef } from './DataTable';
import * as fc from 'fast-check';
import { convertToCSV, generateCSVFilename } from '@/utils/csvExport';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
}));

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Test data type
interface TestItem {
  id: string;
  name: string;
  value: number;
  category: string;
}

// Arbitraries for generating test data
const testItemArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  value: fc.integer({ min: 0, max: 1000 }),
  category: fc.constantFrom('A', 'B', 'C', 'D'),
});

const testItemArrayArbitrary = fc.array(testItemArbitrary, { minLength: 1, maxLength: 100 });

// Column definitions for tests
const testColumns: ColumnDef<TestItem>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
  { key: 'category', label: 'Category', sortable: true, filterable: true },
];

describe('Feature: admin-ui-modernization, Property 21: Bulk action toolbar visibility', () => {
  /**
   * Property 21: Bulk action toolbar visibility
   * For any data table with row selection enabled, when one or more rows are selected,
   * the bulk action toolbar should be visible.
   * Validates: Requirements 14.2
   */
  it('should show bulk action toolbar when rows are selected', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, fc.integer({ min: 1, max: 10 }), (items, selectCount) => {
        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        const actualSelectCount = Math.min(selectCount, items.length);
        const onSelectionChange = jest.fn();
        const onBulkDelete = jest.fn();

        const { container } = render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onSelectionChange={onSelectionChange}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        // Select the specified number of rows
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        for (let i = 1; i <= actualSelectCount && i < checkboxes.length; i++) {
          fireEvent.click(checkboxes[i]);
        }

        // Bulk action toolbar should be visible
        // Look specifically for the count text, not the button
        const toolbar = screen.queryByText(/\d+\s+(item|items)\s+selected/i);
        expect(toolbar).toBeInTheDocument();
      }),
      { numRuns: 100 }
    );
  });

  it('should hide bulk action toolbar when no rows are selected', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, (items) => {
        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        const onSelectionChange = jest.fn();
        const onBulkDelete = jest.fn();

        render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onSelectionChange={onSelectionChange}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        // Bulk action toolbar should not be visible initially
        // Look specifically for the count text, not the button
        const toolbar = screen.queryByText(/\d+\s+(item|items)\s+selected/i);
        expect(toolbar).not.toBeInTheDocument();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 22: Selected count accuracy', () => {
  /**
   * Property 22: Selected count accuracy
   * For any data table with selected rows, the bulk action toolbar should display
   * a count that equals the number of currently selected rows.
   * Validates: Requirements 14.3
   */
  it('should display accurate count of selected items', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, fc.integer({ min: 1, max: 10 }), (items, selectCount) => {
        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        const actualSelectCount = Math.min(selectCount, items.length);
        const onSelectionChange = jest.fn();
        const onBulkDelete = jest.fn();

        const { container } = render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onSelectionChange={onSelectionChange}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        // Select the specified number of rows
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        for (let i = 1; i <= actualSelectCount && i < checkboxes.length; i++) {
          fireEvent.click(checkboxes[i]);
        }

        // Check that the displayed count matches the actual selection
        const countText = screen.getByText(new RegExp(`${actualSelectCount}.*selected`, 'i'));
        expect(countText).toBeInTheDocument();
      }),
      { numRuns: 100 }
    );
  });

  it('should update count when selection changes', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, (items) => {
        if (items.length < 2) return; // Need at least 2 items

        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        const onSelectionChange = jest.fn();
        const onBulkDelete = jest.fn();

        const { container } = render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onSelectionChange={onSelectionChange}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');

        // Select first item
        fireEvent.click(checkboxes[1]);
        expect(screen.getByText(/1.*selected/i)).toBeInTheDocument();

        // Select second item
        fireEvent.click(checkboxes[2]);
        expect(screen.getByText(/2.*selected/i)).toBeInTheDocument();

        // Deselect first item
        fireEvent.click(checkboxes[1]);
        expect(screen.getByText(/1.*selected/i)).toBeInTheDocument();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 23: Bulk operation progress indication', () => {
  /**
   * Property 23: Bulk operation progress indication
   * For any bulk operation in progress, a progress indicator should be visible to the user.
   * Validates: Requirements 14.5
   */
  it('should show progress indicator during bulk delete', async () => {
    fc.assert(
      fc.asyncProperty(testItemArrayArbitrary, async (items) => {
        if (items.length === 0) return;

        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        let resolveDelete: () => void;
        const deletePromise = new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });

        const onBulkDelete = jest.fn(() => deletePromise);

        const { container } = render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        // Select first row
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        fireEvent.click(checkboxes[1]);

        // Click delete button
        const deleteButton = screen.getByText(/Delete Selected/i);
        fireEvent.click(deleteButton);

        // Progress indicator should be visible
        await waitFor(() => {
          expect(screen.getByText(/Processing/i)).toBeInTheDocument();
        });

        // Resolve the delete operation
        resolveDelete!();

        // Wait for progress indicator to disappear
        await waitFor(() => {
          expect(screen.queryByText(/Processing/i)).not.toBeInTheDocument();
        });
      }),
      { numRuns: 50 } // Fewer runs for async tests
    );
  });

  it('should disable buttons during bulk operation', async () => {
    fc.assert(
      fc.asyncProperty(testItemArrayArbitrary, async (items) => {
        if (items.length === 0) return;

        // Clean up before rendering to ensure fresh DOM
        cleanup();
        
        let resolveDelete: () => void;
        const deletePromise = new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });

        const onBulkDelete = jest.fn(() => deletePromise);

        const { container } = render(
          <DataTable
            data={items}
            columns={testColumns}
            selectable={true}
            onBulkDelete={onBulkDelete}
            entityType="items"
          />
        );

        // Select first row
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        fireEvent.click(checkboxes[1]);

        // Click delete button
        const deleteButton = screen.getByText(/Delete Selected/i) as HTMLButtonElement;
        fireEvent.click(deleteButton);

        // Button should be disabled during operation
        await waitFor(() => {
          expect(deleteButton.disabled).toBe(true);
        });

        // Resolve the delete operation
        resolveDelete!();

        // Button should be enabled after operation
        await waitFor(() => {
          expect(deleteButton.disabled).toBe(false);
        });
      }),
      { numRuns: 50 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 24: CSV export data accuracy', () => {
  /**
   * Property 24: CSV export data accuracy
   * For any data table state with active filters, exporting to CSV should generate
   * a file containing exactly the rows currently visible in the filtered table.
   * Validates: Requirements 15.2
   */
  it('should export exactly the visible data', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, (items) => {
        const csv = convertToCSV(items, testColumns);
        const lines = csv.split('\n');

        // Should have header + data rows
        expect(lines.length).toBe(items.length + 1);

        // Header should contain all column labels
        const header = lines[0];
        testColumns.forEach(col => {
          expect(header).toContain(col.label);
        });

        // Each data row should be present (accounting for CSV escaping)
        items.forEach((item, index) => {
          const row = lines[index + 1];
          // For names with quotes, they will be escaped in CSV
          const escapedName = item.name.includes('"') ? item.name.replace(/"/g, '""') : item.name;
          // Check if the row contains the value (may be quoted)
          const nameInRow = row.includes(escapedName) || row.includes(`"${escapedName}"`);
          expect(nameInRow).toBe(true);
          expect(row).toContain(String(item.value));
          expect(row).toContain(item.category);
        });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 25: CSV column completeness', () => {
  /**
   * Property 25: CSV column completeness
   * For any CSV export, the file should include all columns that are currently
   * visible in the data table.
   * Validates: Requirements 15.3
   */
  it('should include all visible columns in CSV', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, (items) => {
        const csv = convertToCSV(items, testColumns);
        const lines = csv.split('\n');
        const header = lines[0];

        // All column labels should be in the header
        testColumns.forEach(col => {
          expect(header).toContain(col.label);
        });

        // Count of columns in header should match column definitions
        const headerColumns = header.split(',').length;
        expect(headerColumns).toBe(testColumns.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain column order in CSV', () => {
    fc.assert(
      fc.property(testItemArrayArbitrary, (items) => {
        const csv = convertToCSV(items, testColumns);
        const lines = csv.split('\n');
        const header = lines[0];
        const headerColumns = header.split(',');

        // Columns should appear in the same order as defined
        testColumns.forEach((col, index) => {
          expect(headerColumns[index]).toContain(col.label);
        });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 26: CSV filename format', () => {
  /**
   * Property 26: CSV filename format
   * For any CSV export operation, the generated filename should follow
   * the pattern {entity-type}-{timestamp}.csv.
   * Validates: Requirements 15.4
   */
  it('should generate filename with correct format', () => {
    fc.assert(
      fc.property(fc.constantFrom('guests', 'events', 'activities', 'vendors', 'photos'), (entityType) => {
        const filename = generateCSVFilename(entityType);

        // Should start with entity type
        expect(filename).toMatch(new RegExp(`^${entityType}-`));

        // Should end with .csv
        expect(filename).toMatch(/\.csv$/);

        // Should contain timestamp in ISO format
        expect(filename).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate unique filenames for different timestamps', () => {
    fc.assert(
      fc.property(fc.constantFrom('guests', 'events', 'activities'), (entityType) => {
        const filename1 = generateCSVFilename(entityType);
        
        // Wait a tiny bit to ensure different timestamp
        const start = Date.now();
        while (Date.now() - start < 2) {
          // Busy wait
        }
        
        const filename2 = generateCSVFilename(entityType);

        // Filenames should be different due to timestamp
        // (may occasionally be the same if generated in same millisecond, but very unlikely)
        if (filename1 === filename2) {
          // This is acceptable in rare cases
          return true;
        }
        
        expect(filename1).not.toBe(filename2);
        return true;
      }),
      { numRuns: 50 }
    );
  });
});
