/**
 * Improved Mock DataTable Component for Testing
 * 
 * This mock properly handles the render function signature:
 * render(value, row) instead of render(row)
 */

import React from 'react';

interface MockDataTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function MockDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
}: MockDataTableProps<T>) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (data.length === 0) {
    return <div>No items found</div>;
  }

  return (
    <div data-testid="mock-data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((col) => {
                const value = item[col.key];
                const displayValue = col.render ? col.render(value, item) : value;
                return (
                  <td key={col.key}>
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Jest mock code to copy into test files
 */
export const DATATABLE_MOCK_CODE = `
// Mock DataTable components
jest.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, loading }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div key={index}>
            {columns.map((col: any) => {
              const value = item[col.key];
              const displayValue = col.render ? col.render(value, item) : value;
              return (
                <div key={col.key}>
                  {displayValue}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('@/components/ui/DataTableWithSuspense', () => ({
  DataTableWithSuspense: ({ data, columns, loading }: any) => {
    if (loading) return <div>Loading...</div>;
    if (data.length === 0) return <div>No items found</div>;
    return (
      <div data-testid="data-table">
        {data.map((item: any, index: number) => (
          <div key={index}>
            {columns.map((col: any) => {
              const value = item[col.key];
              const displayValue = col.render ? col.render(value, item) : value;
              return (
                <div key={col.key}>
                  {displayValue}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
}));
`;
