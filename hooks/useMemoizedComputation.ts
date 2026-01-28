import { useMemo } from 'react';

/**
 * Custom hook for memoizing expensive computations
 * 
 * Examples:
 * - Sorting large arrays
 * - Filtering large datasets
 * - Complex calculations
 * - Data transformations
 */

/**
 * Memoize sorted data
 */
export function useSortedData<T>(
  data: T[],
  sortKey: keyof T | null,
  sortDirection: 'asc' | 'desc'
): T[] {
  return useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);
}

/**
 * Memoize filtered data
 */
export function useFilteredData<T>(
  data: T[],
  filters: Record<string, any>
): T[] {
  return useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        const itemValue = item[key as keyof T];
        
        // Handle array filters (e.g., multiple selections)
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        // Exact match for all other types
        return itemValue === value;
      });
    });
  }, [data, filters]);
}

/**
 * Memoize searched data
 */
export function useSearchedData<T>(
  data: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] {
  return useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);
}

/**
 * Memoize paginated data
 */
export function usePaginatedData<T>(
  data: T[],
  page: number,
  pageSize: number
): { paginatedData: T[]; totalPages: number } {
  return useMemo(() => {
    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return { paginatedData, totalPages };
  }, [data, page, pageSize]);
}

/**
 * Memoize grouped data
 */
export function useGroupedData<T>(
  data: T[],
  groupBy: keyof T | null
): Map<any, T[]> {
  return useMemo(() => {
    if (!groupBy) return new Map();

    const groups = new Map<any, T[]>();

    data.forEach((item) => {
      const key = item[groupBy];
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, item]);
    });

    return groups;
  }, [data, groupBy]);
}

/**
 * Memoize aggregated statistics
 */
export function useAggregatedStats<T>(
  data: T[],
  numericFields: (keyof T)[]
): Record<string, { sum: number; avg: number; min: number; max: number }> {
  return useMemo(() => {
    const stats: Record<string, { sum: number; avg: number; min: number; max: number }> = {};

    numericFields.forEach((field) => {
      const values = data
        .map((item) => item[field])
        .filter((val): val is number => typeof val === 'number');

      if (values.length === 0) {
        stats[String(field)] = { sum: 0, avg: 0, min: 0, max: 0 };
        return;
      }

      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      stats[String(field)] = { sum, avg, min, max };
    });

    return stats;
  }, [data, numericFields]);
}

/**
 * Memoize unique values for a field
 */
export function useUniqueValues<T>(
  data: T[],
  field: keyof T
): any[] {
  return useMemo(() => {
    const uniqueSet = new Set(data.map((item) => item[field]));
    return Array.from(uniqueSet).filter((val) => val !== null && val !== undefined);
  }, [data, field]);
}

/**
 * Memoize data transformation
 */
export function useTransformedData<T, R>(
  data: T[],
  transformer: (item: T) => R
): R[] {
  return useMemo(() => {
    return data.map(transformer);
  }, [data, transformer]);
}
