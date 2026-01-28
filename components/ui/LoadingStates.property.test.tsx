/**
 * Property-Based Tests for Loading States
 * 
 * Tests universal properties of loading state behavior across the admin UI.
 * 
 * Properties tested:
 * - Property 31: Loading skeleton display
 * - Property 33: Action button loading state
 * - Property 34: No blank screens during loading
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { DataTable, type ColumnDef } from './DataTable';
import { FormModal } from './FormModal';
import { Button } from './Button';
import { TableSkeleton, GridSkeleton, DashboardSkeleton } from './SkeletonLoaders';
import { z } from 'zod';

// Mock toast context
jest.mock('./ToastContext', () => ({
  useToast: () => ({
    addToast: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
}));

describe('Feature: admin-ui-modernization, Property 31: Loading skeleton display', () => {
  /**
   * Property 31: Loading skeleton display
   * For any component in a loading state, skeleton loaders should be displayed in place of the actual content.
   * Validates: Requirements 11.1
   */
  it('should display skeleton loaders when loading is true', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
        }), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: 1, max: 10 }),
        (data, columnCount) => {
          // Define columns
          const columns: ColumnDef<any>[] = Array.from({ length: columnCount }, (_, i) => ({
            key: `col${i}`,
            label: `Column ${i}`,
            sortable: true,
          }));

          // Render DataTable in loading state
          const { container } = render(
            <DataTable
              data={data}
              columns={columns}
              loading={true}
              totalCount={data.length}
              currentPage={1}
              pageSize={25}
            />
          );

          // Should display skeleton loader
          const skeleton = container.querySelector('[role="status"][aria-label="Loading table"]');
          expect(skeleton).toBeInTheDocument();

          // Should NOT display actual data
          data.forEach(item => {
            expect(screen.queryByText(item.name)).not.toBeInTheDocument();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display TableSkeleton with correct structure', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (rows, columns) => {
          const { container } = render(<TableSkeleton rows={rows} columns={columns} />);

          // Should have status role
          const skeleton = container.querySelector('[role="status"]');
          expect(skeleton).toBeInTheDocument();

          // Should have aria-label
          expect(skeleton).toHaveAttribute('aria-label', 'Loading table');

          // Should have header row
          const header = container.querySelector('.bg-sage-50');
          expect(header).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display GridSkeleton with correct number of items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 24 }),
        fc.constantFrom(2, 3, 4, 5, 6),
        (items, columns) => {
          const { container } = render(<GridSkeleton items={items} columns={columns} />);

          // Should have status role
          const skeleton = container.querySelector('[role="status"]');
          expect(skeleton).toBeInTheDocument();

          // Should have aria-label
          expect(skeleton).toHaveAttribute('aria-label', 'Loading grid');

          // Should render correct number of grid items
          const gridItems = container.querySelectorAll('.bg-white.rounded-lg.shadow-md');
          expect(gridItems.length).toBe(items);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display DashboardSkeleton with metrics and cards', () => {
    const { container } = render(<DashboardSkeleton />);

    // Should have status role
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toBeInTheDocument();

    // Should have aria-label
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dashboard');

    // Should have metrics grid (4 metric cards)
    const metricCards = container.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div');
    expect(metricCards.length).toBe(4);

    // Should have main content cards (2 cards)
    const contentCards = container.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2 > div');
    expect(contentCards.length).toBe(2);
  });
});

describe('Feature: admin-ui-modernization, Property 33: Action button loading state', () => {
  /**
   * Property 33: Action button loading state
   * For any action button processing an operation, the button should display a loading indicator.
   * Validates: Requirements 11.4
   */
  it('should display loading state on buttons during processing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Filter out whitespace-only strings
        fc.constantFrom('primary', 'secondary', 'danger', 'ghost'),
        (label, variant) => {
          const { container, rerender, unmount } = render(
            <Button variant={variant as any} loading={false}>
              {label}
            </Button>
          );

          // Initially should show label
          expect(container.textContent).toContain(label);

          // Should not be disabled initially
          const button = container.querySelector('button');
          expect(button).not.toBeDisabled();

          // Rerender with loading state
          rerender(
            <Button variant={variant as any} loading={true}>
              {label}
            </Button>
          );

          // Should be disabled when loading
          expect(button).toBeDisabled();

          // Should have loading indicator (spinner)
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
          
          // Should still show the original label
          expect(container.textContent).toContain(label);
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should disable form submit button during submission', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (label) => {
          // Test that a button in loading state is disabled
          const { container, unmount } = render(
            <Button type="submit" loading={true}>
              {label}
            </Button>
          );

          const button = container.querySelector('button');
          
          // Should be disabled when loading
          expect(button).toBeDisabled();
          
          // Should have loading indicator
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-ui-modernization, Property 34: No blank screens during loading', () => {
  /**
   * Property 34: No blank screens during loading
   * For any page load operation, either actual content or skeleton loaders should be visible (never a blank screen).
   * Validates: Requirements 11.5
   */
  it('should never show blank screen - always show content or skeleton', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }), { minLength: 0, maxLength: 100 }),
        fc.boolean(),
        (data, loading) => {
          const columns: ColumnDef<any>[] = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
          ];

          const { container, unmount } = render(
            <DataTable
              data={data}
              columns={columns}
              loading={loading}
              totalCount={data.length}
              currentPage={1}
              pageSize={25}
              entityType="items"
            />
          );

          // Should always have some visual elements
          const hasElements = container.querySelector('*') !== null;
          expect(hasElements).toBe(true);

          if (loading) {
            // Should show skeleton
            const skeleton = container.querySelector('[role="status"]');
            expect(skeleton).toBeInTheDocument();
          } else if (data.length > 0) {
            // Should show actual data
            const table = container.querySelector('table');
            expect(table).toBeInTheDocument();
          } else {
            // Should show empty state message
            expect(container.textContent).toContain('No items found');
          }

          // Should never be completely blank (no elements at all)
          const isBlank = container.children.length === 0;
          expect(isBlank).toBe(false);
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transition from loading to content without blank screen', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }), { minLength: 1, maxLength: 20 }),
        async (data) => {
          const columns: ColumnDef<any>[] = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
          ];

          // Start with loading state
          const { container, rerender } = render(
            <DataTable
              data={[]}
              columns={columns}
              loading={true}
              totalCount={0}
              currentPage={1}
              pageSize={25}
            />
          );

          // Should show skeleton
          expect(container.querySelector('[role="status"]')).toBeInTheDocument();

          // Transition to loaded state
          rerender(
            <DataTable
              data={data}
              columns={columns}
              loading={false}
              totalCount={data.length}
              currentPage={1}
              pageSize={25}
            />
          );

          // Should show actual content
          await waitFor(() => {
            const table = container.querySelector('table');
            expect(table).toBeInTheDocument();
          });

          // Should never be blank during transition
          const hasContent = container.textContent && container.textContent.trim().length > 0;
          expect(hasContent).toBe(true);
        }
      ),
      { numRuns: 50 } // Fewer runs for async tests
    );
  });

  it('should show empty state instead of blank screen when no data', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('guests', 'events', 'activities', 'vendors', 'photos'),
        (entityType) => {
          const columns: ColumnDef<any>[] = [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
          ];

          const { container } = render(
            <DataTable
              data={[]}
              columns={columns}
              loading={false}
              totalCount={0}
              currentPage={1}
              pageSize={25}
              entityType={entityType}
            />
          );

          // Should not be blank
          const hasContent = container.textContent && container.textContent.trim().length > 0;
          expect(hasContent).toBe(true);

          // Should show empty state message with entity type
          expect(container.textContent).toContain(`No ${entityType} found`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
