/**
 * Reusable DataTable Mock Pattern
 * 
 * Use this pattern in test files to mock DataTable components.
 * Supports common props: data, columns, loading, onRowClick, onDelete
 * 
 * Usage in test files:
 * ```typescript
 * jest.mock('@/components/ui/DataTable', () => ({
 *   DataTable: mockDataTable,
 * }));
 * 
 * jest.mock('@/components/ui/DataTableWithSuspense', () => ({
 *   DataTableWithSuspense: mockDataTable,
 * }));
 * ```
 */

export const mockDataTable = ({ data, columns, loading, onRowClick, onDelete, rowClassName }: any) => {
  if (loading) return <div>Loading...</div>;
  if (data.length === 0) return <div>No items found</div>;
  
  return (
    <div data-testid="data-table">
      {data.map((item: any, index: number) => {
        const className = rowClassName ? rowClassName(item) : '';
        return (
          <div 
            key={index} 
            data-testid={`row-${item.id}`}
            role="row"
            className={className}
            onClick={() => onRowClick && onRowClick(item)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((col: any) => {
              const value = item[col.key];
              // Call render function with (value, row) signature
              const displayValue = col.render ? col.render(value, item) : value;
              return (
                <div key={col.key} data-testid={`${col.key}-${item.id}`}>
                  {displayValue}
                </div>
              );
            })}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                aria-label="Delete"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Example usage in test file:
 * 
 * ```typescript
 * import { mockDataTable } from '@/__tests__/helpers/mockDataTable';
 * 
 * jest.mock('@/components/ui/DataTable', () => ({
 *   DataTable: mockDataTable,
 * }));
 * 
 * jest.mock('@/components/ui/DataTableWithSuspense', () => ({
 *   DataTableWithSuspense: mockDataTable,
 * }));
 * ```
 * 
 * Key features:
 * - Renders all data items with proper test IDs
 * - Calls column render functions with correct signature: render(value, row)
 * - Supports onRowClick for row selection
 * - Supports onDelete for delete functionality
 * - Supports rowClassName for conditional styling
 * - Shows loading and empty states
 * 
 * Common patterns:
 * 
 * 1. Multiple element queries:
 * ```typescript
 * const elements = screen.getAllByLabelText(/group/i);
 * const targetElement = elements.find(el => el.tagName === 'SELECT');
 * ```
 * 
 * 2. Testing delete flow:
 * ```typescript
 * const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
 * fireEvent.click(deleteButtons[0]);
 * 
 * // Wait for confirmation dialog
 * await waitFor(() => {
 *   expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
 * });
 * 
 * // Confirm deletion
 * const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
 * fireEvent.click(confirmButtons[confirmButtons.length - 1]);
 * ```
 * 
 * 3. Testing row clicks:
 * ```typescript
 * const row = screen.getByTestId('row-item-1');
 * fireEvent.click(row);
 * 
 * await waitFor(() => {
 *   expect(screen.getByText(/edit/i)).toBeInTheDocument();
 * });
 * ```
 */
