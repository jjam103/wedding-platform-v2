import { memo } from 'react';
import type { ColumnDef } from './DataTable';

interface DataTableRowProps<T extends Record<string, any>> {
  row: T;
  columns: ColumnDef<T>[];
  selectable: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRowClick?: (row: T) => void;
  onDelete?: (row: T) => void;
  idField: keyof T;
  rowClassName?: (row: T) => string;
}

/**
 * Memoized DataTable row component
 * Prevents unnecessary re-renders when other rows change
 */
function DataTableRowComponent<T extends Record<string, any>>({
  row,
  columns,
  selectable,
  isSelected,
  onSelect,
  onRowClick,
  onDelete,
  idField,
  rowClassName,
}: DataTableRowProps<T>) {
  const rowId = String(row[idField]);

  return (
    <tr
      className={`
        border-b border-gray-200 hover:bg-gray-50 transition-colors
        ${onRowClick ? 'cursor-pointer' : ''}
        ${rowClassName ? rowClassName(row) : ''}
      `}
      onClick={() => onRowClick?.(row)}
    >
      {selectable && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(rowId);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-jungle-600 border-gray-300 rounded focus:ring-jungle-500"
            aria-label={`Select row ${rowId}`}
          />
        </td>
      )}
      
      {columns.map((column) => {
        const key = String(column.key);
        const value = row[column.key as keyof T];
        
        return (
          <td
            key={key}
            className={`
              px-4 py-3 text-sm text-gray-900
              ${column.mobileHidden ? 'hidden md:table-cell' : ''}
            `}
            style={{ width: column.width }}
          >
            {column.render ? column.render(value, row) : String(value ?? '')}
          </td>
        );
      })}
      
      {onDelete && (
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            aria-label={`Delete row ${rowId}`}
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
}

/**
 * Memoized version of DataTableRow
 * Only re-renders when props actually change
 */
export const DataTableRow = memo(DataTableRowComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.row === nextProps.row &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.columns === nextProps.columns &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onRowClick === nextProps.onRowClick &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.idField === nextProps.idField &&
    prevProps.rowClassName === nextProps.rowClassName
  );
}) as typeof DataTableRowComponent;
