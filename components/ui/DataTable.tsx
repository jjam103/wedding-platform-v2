'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './Button';
import { exportToCSV } from '@/utils/csvExport';
import { TableSkeleton } from './SkeletonLoaders';

/**
 * Column definition for DataTable
 */
export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'select' | 'text' | 'date';
  filterOptions?: { label: string; value: any }[];
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  mobileHidden?: boolean;
}

/**
 * DataTable component props
 */
export interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T>[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  idField?: keyof T;
  rowClassName?: (row: T) => string;
  onBulkDelete?: (selectedIds: string[]) => Promise<void>;
  onBulkExport?: () => void;
  onBulkEmail?: (selectedIds: string[]) => void;
  entityType?: string;
  showBulkEmail?: boolean;
}

/**
 * DataTable Component
 * 
 * Reusable table with sort, filter, search, and pagination functionality.
 * Supports responsive mobile layout and loading states.
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  onFilter,
  onSearch,
  onPageChange,
  onRowClick,
  onDelete,
  loading = false,
  totalCount,
  currentPage = 1,
  pageSize = 25,
  selectable = false,
  onSelectionChange,
  idField = 'id' as keyof T,
  rowClassName,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  entityType = 'items',
  showBulkEmail = false,
}: DataTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localPageSize, setLocalPageSize] = useState(pageSize);
  const [localPage, setLocalPage] = useState(currentPage);
  const [isBulkOperationInProgress, setIsBulkOperationInProgress] = useState(false);

  // Initialize state from URL on mount
  useEffect(() => {
    const urlSort = searchParams.get('sort');
    const urlDirection = searchParams.get('direction') as 'asc' | 'desc' | null;
    const urlSearch = searchParams.get('search');
    const urlPage = searchParams.get('page');
    const urlPageSize = searchParams.get('pageSize');

    if (urlSort) setSortColumn(urlSort);
    if (urlDirection) setSortDirection(urlDirection);
    if (urlSearch) setSearchQuery(urlSearch);
    if (urlPage) setLocalPage(parseInt(urlPage));
    if (urlPageSize) setLocalPageSize(parseInt(urlPageSize));

    // Restore filters from URL
    const urlFilters: Record<string, any> = {};
    columns.forEach(col => {
      if (col.filterable) {
        const filterValue = searchParams.get(`filter_${String(col.key)}`);
        if (filterValue) {
          urlFilters[String(col.key)] = filterValue;
        }
      }
    });
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, []);

  // Update URL when state changes
  const updateURL = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    
    updateURL({
      sort: column,
      direction: newDirection,
    });

    if (onSort) {
      onSort(column, newDirection);
    }
  }, [sortColumn, sortDirection, onSort, updateURL]);

  // Handle filter change
  const handleFilterChange = useCallback((column: string, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === null) {
      delete newFilters[column];
    } else {
      newFilters[column] = value;
    }
    
    setFilters(newFilters);
    
    // Update URL with filter
    updateURL({
      [`filter_${column}`]: value || null,
    });

    if (onFilter) {
      onFilter(newFilters);
    }
  }, [filters, onFilter, updateURL]);

  // Handle search with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      updateURL({ search: query || null });
      
      if (onSearch) {
        onSearch(query);
      }
    }, 300);

    setSearchDebounce(timeout);
  }, [searchDebounce, onSearch, updateURL]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    
    // Clear all filter params from URL
    const updates: Record<string, null> = { search: null };
    columns.forEach(col => {
      if (col.filterable) {
        updates[`filter_${String(col.key)}`] = null;
      }
    });
    updateURL(updates);

    if (onFilter) {
      onFilter({});
    }
    if (onSearch) {
      onSearch('');
    }
  }, [columns, onFilter, onSearch, updateURL]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setLocalPage(page);
    updateURL({ page: page.toString() });
    
    if (onPageChange) {
      onPageChange(page);
    }
  }, [onPageChange, updateURL]);

  const handlePageSizeChange = useCallback((size: number) => {
    setLocalPageSize(size);
    setLocalPage(1);
    updateURL({ 
      pageSize: size.toString(),
      page: '1',
    });
    
    if (onPageChange) {
      onPageChange(1);
    }
  }, [onPageChange, updateURL]);

  // Handle row selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = data.map(row => String(row[idField]));
      setSelectedIds(allIds);
      if (onSelectionChange) {
        onSelectionChange(allIds);
      }
    } else {
      setSelectedIds([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  }, [data, idField, onSelectionChange]);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter(selectedId => selectedId !== id);
    
    setSelectedIds(newSelectedIds);
    if (onSelectionChange) {
      onSelectionChange(newSelectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  // Handle bulk delete with progress indication
  const handleBulkDelete = useCallback(async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    
    setIsBulkOperationInProgress(true);
    try {
      await onBulkDelete(selectedIds);
      // Clear selection after successful delete
      setSelectedIds([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } finally {
      setIsBulkOperationInProgress(false);
    }
  }, [onBulkDelete, selectedIds, onSelectionChange]);

  // Handle CSV export
  const handleExport = useCallback(() => {
    if (onBulkExport) {
      onBulkExport();
    } else {
      // Default export behavior - export current filtered data
      exportToCSV(data, columns, entityType);
    }
  }, [onBulkExport, data, columns, entityType]);

  // Calculate pagination
  const totalPages = totalCount ? Math.ceil(totalCount / localPageSize) : Math.ceil(data.length / localPageSize);
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery !== '';

  // Render loading skeleton
  if (loading) {
    return <TableSkeleton rows={pageSize} columns={columns.length} />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        {onSearch && (
          <div className="w-full">
            <label htmlFor="table-search" className="sr-only">Search {entityType}</label>
            <input
              id="table-search"
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jungle-500 min-h-[44px]"
              aria-label={`Search ${entityType}`}
            />
          </div>
        )}

        {/* Filter Controls and Export */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-2">
          {/* Filter Controls */}
          {columns.some(col => col.filterable) && (
            <div className="flex flex-col md:flex-row flex-wrap gap-2 flex-1" role="group" aria-label="Filter controls">
              {columns.filter(col => col.filterable).map(col => (
                <div key={String(col.key)} className="w-full md:min-w-[150px] md:w-auto">
                  {col.filterType === 'select' && col.filterOptions ? (
                    <>
                      <label htmlFor={`filter-${String(col.key)}`} className="sr-only">
                        Filter by {col.label}
                      </label>
                      <select
                        id={`filter-${String(col.key)}`}
                        value={filters[String(col.key)] || ''}
                        onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                        className="w-full px-3 py-3 md:py-2 border border-sage-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 min-h-[44px]"
                        aria-label={`Filter by ${col.label}`}
                      >
                        <option value="">All {col.label}</option>
                        {col.filterOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`filter-${String(col.key)}`} className="sr-only">
                        Filter by {col.label}
                      </label>
                      <input
                        id={`filter-${String(col.key)}`}
                        type="text"
                        placeholder={`Filter ${col.label}`}
                        value={filters[String(col.key)] || ''}
                        onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                        className="w-full px-3 py-3 md:py-2 border border-sage-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 min-h-[44px]"
                        aria-label={`Filter by ${col.label}`}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Export Button */}
          <div className="w-full md:w-auto">
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              className="w-full md:w-auto"
              aria-label={`Export ${entityType} to CSV`}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-sage-600">Active filters:</span>
          {searchQuery && (
            <div className="flex items-center gap-1 px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
              <span>Search: {searchQuery}</span>
              <button
                onClick={() => handleSearch('')}
                className="hover:text-ocean-900"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </div>
          )}
          {Object.entries(filters).map(([key, value]) => {
            const column = columns.find(col => String(col.key) === key);
            const label = column?.filterOptions?.find(opt => opt.value === value)?.label || value;
            return (
              <div key={key} className="flex items-center gap-1 px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                <span>{column?.label}: {label}</span>
                <button
                  onClick={() => handleFilterChange(key, null)}
                  className="hover:text-ocean-900"
                  aria-label={`Remove ${column?.label} filter`}
                >
                  ×
                </button>
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectable && selectedIds.length > 0 && (
        <div 
          className="bg-jungle-50 border border-jungle-200 rounded-lg px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4"
          role="region"
          aria-label="Bulk actions"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-jungle-900" aria-live="polite">
              {selectedIds.length} {selectedIds.length === 1 ? 'item' : entityType} selected
            </span>
            {isBulkOperationInProgress && (
              <div className="flex items-center gap-2 text-sm text-jungle-700" role="status" aria-live="polite">
                <div 
                  className="animate-spin h-4 w-4 border-2 border-jungle-500 border-t-transparent rounded-full"
                  aria-hidden="true"
                ></div>
                <span>Processing...</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Bulk action buttons">
            {showBulkEmail && onBulkEmail && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onBulkEmail(selectedIds)}
                disabled={isBulkOperationInProgress}
                aria-label={`Send email to ${selectedIds.length} selected ${entityType}`}
              >
                Send Email
              </Button>
            )}
            {onBulkExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={isBulkOperationInProgress}
                aria-label={`Export ${selectedIds.length} selected ${entityType}`}
              >
                Export
              </Button>
            )}
            {onBulkDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkOperationInProgress}
                aria-label={`Delete ${selectedIds.length} selected ${entityType}`}
              >
                {isBulkOperationInProgress ? 'Deleting...' : 'Delete Selected'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" role="table" aria-label={`${entityType} data table`}>
            <thead className="bg-sage-50 border-b border-sage-200">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-left" scope="col">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.length && data.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-sage-300 text-jungle-500 focus:ring-jungle-500"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider ${
                      col.sortable ? 'cursor-pointer hover:bg-sage-100' : ''
                    }`}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    style={{ width: col.width }}
                    aria-sort={
                      col.sortable && sortColumn === String(col.key)
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.label}</span>
                      {col.sortable && sortColumn === String(col.key) && (
                        <span className="text-jungle-500" aria-hidden="true">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {onDelete && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-sage-700 uppercase tracking-wider" scope="col">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (onDelete ? 1 : 0)}
                    className="px-6 py-8 text-center text-sage-500"
                  >
                    No {entityType} found
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const rowId = String(row[idField]);
                  const isSelected = selectedIds.includes(rowId);
                  const customClassName = rowClassName ? rowClassName(row) : '';
                  
                  return (
                    <tr
                      key={rowId || rowIndex}
                      className={`hover:bg-sage-50 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${isSelected ? 'bg-jungle-50' : ''} ${customClassName}`}
                      onClick={() => onRowClick && onRowClick(row)}
                      aria-selected={isSelected}
                    >
                      {selectable && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                            className="rounded border-sage-300 text-jungle-500 focus:ring-jungle-500"
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}
                      {columns.map(col => (
                        <td
                          key={String(col.key)}
                          className="px-6 py-4 text-sm text-sage-900"
                        >
                          {col.render
                            ? col.render(row[col.key as keyof T], row)
                            : String(row[col.key as keyof T] ?? '')}
                        </td>
                      ))}
                      {onDelete && (
                        <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(row)}
                            aria-label={`Delete ${entityType.slice(0, -1)} ${rowIndex + 1}`}
                          >
                            Delete
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-sage-100">
          {data.length === 0 ? (
            <div className="px-4 py-8 text-center text-sage-500">
              No {entityType} found
            </div>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = String(row[idField]);
              const isSelected = selectedIds.includes(rowId);
              const customClassName = rowClassName ? rowClassName(row) : '';
              
              return (
                <div
                  key={rowId || rowIndex}
                  className={`p-4 ${
                    onRowClick ? 'cursor-pointer active:bg-sage-100' : ''
                  } ${isSelected ? 'bg-jungle-50' : ''} ${customClassName}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick && onRowClick(row);
                    }
                  }}
                  aria-label={`${entityType.slice(0, -1)} ${rowIndex + 1}`}
                >
                  {/* Selection checkbox */}
                  {selectable && (
                    <div className="mb-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                        className="h-5 w-5 rounded border-sage-300 text-jungle-500 focus:ring-jungle-500"
                        aria-label={`Select ${entityType.slice(0, -1)} ${rowIndex + 1}`}
                      />
                      <span className="ml-2 text-sm text-sage-600">Select</span>
                    </div>
                  )}
                  
                  {/* Stacked columns */}
                  <div className="space-y-2">
                    {columns.filter(col => !col.mobileHidden).map(col => (
                      <div key={String(col.key)} className="flex flex-col">
                        <span className="text-xs font-medium text-sage-600 uppercase tracking-wider">
                          {col.label}
                        </span>
                        <span className="mt-1 text-sm text-sage-900">
                          {col.render
                            ? col.render(row[col.key as keyof T], row)
                            : String(row[col.key as keyof T] ?? '')}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  {onDelete && (
                    <div className="mt-3 pt-3 border-t border-sage-200" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(row)}
                        className="w-full min-h-[44px]"
                        aria-label={`Delete ${entityType.slice(0, -1)} ${rowIndex + 1}`}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div 
            className="px-4 md:px-6 py-4 border-t border-sage-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
            role="navigation"
            aria-label="Pagination"
          >
            <div className="flex items-center justify-center md:justify-start gap-2">
              <label htmlFor="page-size-select" className="text-sm text-sage-600">Rows per page:</label>
              <select
                id="page-size-select"
                value={localPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 border border-sage-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-jungle-500 min-h-[44px]"
                aria-label="Select number of rows per page"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              <span className="text-sm text-sage-600 text-center" aria-live="polite" aria-atomic="true">
                Page {localPage} of {totalPages}
              </span>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(localPage - 1)}
                  disabled={localPage === 1}
                  className="flex-1 md:flex-none"
                  aria-label="Go to previous page"
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(localPage + 1)}
                  disabled={localPage === totalPages}
                  className="flex-1 md:flex-none"
                  aria-label="Go to next page"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
