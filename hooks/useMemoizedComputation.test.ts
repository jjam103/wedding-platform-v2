/**
 * Tests for memoized computation hooks
 * 
 * Validates that:
 * - Computations are memoized correctly
 * - Results are accurate
 * - Performance is optimized
 */

import { renderHook } from '@testing-library/react';
import {
  useSortedData,
  useFilteredData,
  useSearchedData,
  usePaginatedData,
  useGroupedData,
  useAggregatedStats,
  useUniqueValues,
  useTransformedData,
} from './useMemoizedComputation';

describe('useMemoizedComputation hooks', () => {
  describe('useSortedData', () => {
    it('should sort data in ascending order', () => {
      const data = [
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 },
      ];

      const { result } = renderHook(() => useSortedData(data, 'name', 'asc'));

      expect(result.current).toEqual([
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 },
        { id: 1, name: 'Charlie', age: 30 },
      ]);
    });

    it('should sort data in descending order', () => {
      const data = [
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
        { id: 3, name: 'Bob', age: 35 },
      ];

      const { result } = renderHook(() => useSortedData(data, 'age', 'desc'));

      expect(result.current).toEqual([
        { id: 3, name: 'Bob', age: 35 },
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
      ]);
    });

    it('should return original data when sortKey is null', () => {
      const data = [
        { id: 1, name: 'Charlie', age: 30 },
        { id: 2, name: 'Alice', age: 25 },
      ];

      const { result } = renderHook(() => useSortedData(data, null, 'asc'));

      expect(result.current).toEqual(data);
    });

    it('should memoize result when inputs do not change', () => {
      const data = [{ id: 1, name: 'Alice' }];

      const { result, rerender } = renderHook(
        ({ d, k, dir }) => useSortedData(d, k, dir),
        { initialProps: { d: data, k: 'name' as const, dir: 'asc' as const } }
      );

      const firstResult = result.current;
      rerender({ d: data, k: 'name' as const, dir: 'asc' as const });
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult); // Same reference
    });
  });

  describe('useFilteredData', () => {
    it('should filter data by single criterion', () => {
      const data = [
        { id: 1, name: 'Alice', status: 'active' },
        { id: 2, name: 'Bob', status: 'inactive' },
        { id: 3, name: 'Charlie', status: 'active' },
      ];

      const { result } = renderHook(() => useFilteredData(data, { status: 'active' }));

      expect(result.current).toEqual([
        { id: 1, name: 'Alice', status: 'active' },
        { id: 3, name: 'Charlie', status: 'active' },
      ]);
    });

    it('should filter data by multiple criteria', () => {
      const data = [
        { id: 1, name: 'Alice', status: 'active', age: 25 },
        { id: 2, name: 'Bob', status: 'active', age: 30 },
        { id: 3, name: 'Charlie', status: 'inactive', age: 25 },
      ];

      const { result } = renderHook(() =>
        useFilteredData(data, { status: 'active', age: 25 })
      );

      expect(result.current).toEqual([{ id: 1, name: 'Alice', status: 'active', age: 25 }]);
    });

    it('should return all data when filters are empty', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const { result } = renderHook(() => useFilteredData(data, {}));

      expect(result.current).toEqual(data);
    });

    it('should handle array filters', () => {
      const data = [
        { id: 1, status: 'active' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'inactive' },
      ];

      const { result } = renderHook(() =>
        useFilteredData(data, { status: ['active', 'pending'] })
      );

      expect(result.current).toHaveLength(2);
    });
  });

  describe('useSearchedData', () => {
    it('should search across multiple fields', () => {
      const data = [
        { id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
        { id: 2, firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com' },
        { id: 3, firstName: 'Charlie', lastName: 'Smith', email: 'charlie@example.com' },
      ];

      const { result } = renderHook(() =>
        useSearchedData(data, 'smith', ['firstName', 'lastName', 'email'])
      );

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([
        { id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
        { id: 3, firstName: 'Charlie', lastName: 'Smith', email: 'charlie@example.com' },
      ]);
    });

    it('should be case-insensitive', () => {
      const data = [{ id: 1, name: 'Alice' }];

      const { result } = renderHook(() => useSearchedData(data, 'ALICE', ['name']));

      expect(result.current).toHaveLength(1);
    });

    it('should return all data when search query is empty', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const { result } = renderHook(() => useSearchedData(data, '', ['name']));

      expect(result.current).toEqual(data);
    });
  });

  describe('usePaginatedData', () => {
    it('should paginate data correctly', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

      const { result } = renderHook(() => usePaginatedData(data, 1, 10));

      expect(result.current.paginatedData).toHaveLength(10);
      expect(result.current.paginatedData[0]).toEqual({ id: 1 });
      expect(result.current.totalPages).toBe(3);
    });

    it('should return correct page', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

      const { result } = renderHook(() => usePaginatedData(data, 2, 10));

      expect(result.current.paginatedData).toHaveLength(10);
      expect(result.current.paginatedData[0]).toEqual({ id: 11 });
    });

    it('should handle last page with fewer items', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

      const { result } = renderHook(() => usePaginatedData(data, 3, 10));

      expect(result.current.paginatedData).toHaveLength(5);
      expect(result.current.paginatedData[0]).toEqual({ id: 21 });
    });
  });

  describe('useGroupedData', () => {
    it('should group data by field', () => {
      const data = [
        { id: 1, category: 'A', value: 10 },
        { id: 2, category: 'B', value: 20 },
        { id: 3, category: 'A', value: 30 },
      ];

      const { result } = renderHook(() => useGroupedData(data, 'category'));

      expect(result.current.size).toBe(2);
      expect(result.current.get('A')).toHaveLength(2);
      expect(result.current.get('B')).toHaveLength(1);
    });

    it('should return empty map when groupBy is null', () => {
      const data = [{ id: 1, category: 'A' }];

      const { result } = renderHook(() => useGroupedData(data, null));

      expect(result.current.size).toBe(0);
    });
  });

  describe('useAggregatedStats', () => {
    it('should calculate statistics for numeric fields', () => {
      const data = [
        { id: 1, value: 10, score: 5 },
        { id: 2, value: 20, score: 10 },
        { id: 3, value: 30, score: 15 },
      ];

      const { result } = renderHook(() => useAggregatedStats(data, ['value', 'score']));

      expect(result.current.value).toEqual({
        sum: 60,
        avg: 20,
        min: 10,
        max: 30,
      });

      expect(result.current.score).toEqual({
        sum: 30,
        avg: 10,
        min: 5,
        max: 15,
      });
    });

    it('should handle empty data', () => {
      const data: Array<{ value: number }> = [];

      const { result } = renderHook(() => useAggregatedStats(data, ['value']));

      expect(result.current.value).toEqual({
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
      });
    });
  });

  describe('useUniqueValues', () => {
    it('should return unique values', () => {
      const data = [
        { id: 1, status: 'active' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'active' },
        { id: 4, status: 'inactive' },
      ];

      const { result } = renderHook(() => useUniqueValues(data, 'status'));

      expect(result.current).toHaveLength(3);
      expect(result.current).toContain('active');
      expect(result.current).toContain('pending');
      expect(result.current).toContain('inactive');
    });

    it('should filter out null and undefined', () => {
      const data = [
        { id: 1, value: 'A' },
        { id: 2, value: null },
        { id: 3, value: undefined },
        { id: 4, value: 'B' },
      ];

      const { result } = renderHook(() => useUniqueValues(data, 'value'));

      expect(result.current).toEqual(['A', 'B']);
    });
  });

  describe('useTransformedData', () => {
    it('should transform data', () => {
      const data = [
        { id: 1, firstName: 'Alice', lastName: 'Smith' },
        { id: 2, firstName: 'Bob', lastName: 'Jones' },
      ];

      const transformer = (item: typeof data[0]) => ({
        id: item.id,
        fullName: `${item.firstName} ${item.lastName}`,
      });

      const { result } = renderHook(() => useTransformedData(data, transformer));

      expect(result.current).toEqual([
        { id: 1, fullName: 'Alice Smith' },
        { id: 2, fullName: 'Bob Jones' },
      ]);
    });

    it('should memoize transformation', () => {
      const data = [{ id: 1, value: 10 }];
      const transformer = (item: typeof data[0]) => ({ ...item, doubled: item.value * 2 });

      const { result, rerender } = renderHook(
        ({ d, t }) => useTransformedData(d, t),
        { initialProps: { d: data, t: transformer } }
      );

      const firstResult = result.current;
      rerender({ d: data, t: transformer });
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
