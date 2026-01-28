/**
 * Tests for query optimization utilities
 * 
 * Validates:
 * - Pagination calculations
 * - Field selection
 * - Query performance monitoring
 */

import {
  calculatePaginationRange,
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  startQueryMonitoring,
  endQueryMonitoring,
  getQueryMetrics,
  getAverageQueryDuration,
  clearQueryMetrics,
} from './queryOptimization';

describe('Query Optimization Utilities', () => {
  describe('calculatePaginationRange', () => {
    it('should calculate correct range for first page', () => {
      const result = calculatePaginationRange(1, 50);
      
      expect(result).toEqual({ from: 0, to: 49 });
    });

    it('should calculate correct range for second page', () => {
      const result = calculatePaginationRange(2, 50);
      
      expect(result).toEqual({ from: 50, to: 99 });
    });

    it('should calculate correct range for third page', () => {
      const result = calculatePaginationRange(3, 50);
      
      expect(result).toEqual({ from: 100, to: 149 });
    });

    it('should use default page size when not provided', () => {
      const result = calculatePaginationRange(1);
      
      expect(result).toEqual({ from: 0, to: DEFAULT_PAGE_SIZE - 1 });
    });

    it('should handle page size of 25', () => {
      const result = calculatePaginationRange(1, 25);
      
      expect(result).toEqual({ from: 0, to: 24 });
    });

    it('should handle page size of 100', () => {
      const result = calculatePaginationRange(1, 100);
      
      expect(result).toEqual({ from: 0, to: 99 });
    });

    it('should constrain page size to maximum', () => {
      const result = calculatePaginationRange(1, 200);
      
      expect(result).toEqual({ from: 0, to: MAX_PAGE_SIZE - 1 });
    });

    it('should handle invalid page numbers', () => {
      const result = calculatePaginationRange(0, 50);
      
      expect(result).toEqual({ from: 0, to: 49 });
    });

    it('should handle negative page numbers', () => {
      const result = calculatePaginationRange(-5, 50);
      
      expect(result).toEqual({ from: 0, to: 49 });
    });

    it('should handle invalid page sizes', () => {
      const result = calculatePaginationRange(1, 0);
      
      expect(result).toEqual({ from: 0, to: 0 });
    });
  });

  describe('buildPaginatedResult', () => {
    it('should build correct pagination metadata for first page', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const result = buildPaginatedResult(data, 150, 1, 50);

      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 50,
        totalCount: 150,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should build correct pagination metadata for middle page', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 51 }));
      const result = buildPaginatedResult(data, 150, 2, 50);

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 50,
        totalCount: 150,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should build correct pagination metadata for last page', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 101 }));
      const result = buildPaginatedResult(data, 150, 3, 50);

      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 50,
        totalCount: 150,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle partial last page', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 101 }));
      const result = buildPaginatedResult(data, 125, 3, 50);

      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 50,
        totalCount: 125,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle single page', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const result = buildPaginatedResult(data, 25, 1, 50);

      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 50,
        totalCount: 25,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle empty results', () => {
      const result = buildPaginatedResult([], 0, 1, 50);

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should use default page size when not provided', () => {
      const data = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => ({ id: i + 1 }));
      const result = buildPaginatedResult(data, 100);

      expect(result.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });

    it('should constrain page size to maximum', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const result = buildPaginatedResult(data, 200, 1, 200);

      expect(result.pagination.pageSize).toBe(MAX_PAGE_SIZE);
    });
  });

  describe('Query Performance Monitoring', () => {
    beforeEach(() => {
      clearQueryMetrics();
    });

    it('should track query duration', () => {
      const startTime = startQueryMonitoring('test-query');
      
      // Simulate some work
      const sum = Array.from({ length: 1000 }, (_, i) => i).reduce((a, b) => a + b, 0);
      
      endQueryMonitoring('test-query', startTime, 100);

      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].queryName).toBe('test-query');
      expect(metrics[0].recordCount).toBe(100);
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should track multiple queries', () => {
      const start1 = startQueryMonitoring('query-1');
      endQueryMonitoring('query-1', start1, 50);

      const start2 = startQueryMonitoring('query-2');
      endQueryMonitoring('query-2', start2, 75);

      const start3 = startQueryMonitoring('query-3');
      endQueryMonitoring('query-3', start3, 100);

      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(3);
      expect(metrics[0].queryName).toBe('query-1');
      expect(metrics[1].queryName).toBe('query-2');
      expect(metrics[2].queryName).toBe('query-3');
    });

    it('should calculate average query duration', () => {
      const start1 = startQueryMonitoring('test-query');
      endQueryMonitoring('test-query', start1, 100);

      const start2 = startQueryMonitoring('test-query');
      endQueryMonitoring('test-query', start2, 100);

      const start3 = startQueryMonitoring('test-query');
      endQueryMonitoring('test-query', start3, 100);

      const avgDuration = getAverageQueryDuration('test-query');
      expect(avgDuration).toBeGreaterThan(0);
    });

    it('should return 0 for unknown query', () => {
      const avgDuration = getAverageQueryDuration('unknown-query');
      expect(avgDuration).toBe(0);
    });

    it('should clear metrics', () => {
      const start = startQueryMonitoring('test-query');
      endQueryMonitoring('test-query', start, 100);

      expect(getQueryMetrics()).toHaveLength(1);

      clearQueryMetrics();

      expect(getQueryMetrics()).toHaveLength(0);
    });

    it('should limit metrics to 100 entries', () => {
      // Add 150 metrics
      for (let i = 0; i < 150; i++) {
        const start = startQueryMonitoring(`query-${i}`);
        endQueryMonitoring(`query-${i}`, start, 10);
      }

      const metrics = getQueryMetrics();
      expect(metrics).toHaveLength(100);
      
      // Should keep the most recent 100
      expect(metrics[0].queryName).toBe('query-50');
      expect(metrics[99].queryName).toBe('query-149');
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate pagination range in under 1ms', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculatePaginationRange(i + 1, 50);
      }
      
      const duration = performance.now() - start;
      
      // 1000 calculations should take less than 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should build paginated result in under 1ms', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        buildPaginatedResult(data, 150, 1, 50);
      }
      
      const duration = performance.now() - start;
      
      // 1000 builds should take less than 10ms
      expect(duration).toBeLessThan(10);
    });
  });
});
