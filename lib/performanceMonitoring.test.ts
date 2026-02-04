import {
  performanceMonitor,
  measurePerformance,
  measureApiRequest,
  measureDbQuery,
  PERFORMANCE_THRESHOLDS,
} from './performanceMonitoring';

describe('performanceMonitoring', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
    jest.clearAllMocks();
  });

  describe('performanceMonitor', () => {
    it('should record metrics', () => {
      performanceMonitor.recordMetric('test_metric', 100, { foo: 'bar' });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 100,
        metadata: { foo: 'bar' },
      });
    });

    it('should clear metrics', () => {
      performanceMonitor.recordMetric('test_metric', 100);
      expect(performanceMonitor.getMetrics()).toHaveLength(1);

      performanceMonitor.clearMetrics();
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });

    it('should calculate metrics summary', () => {
      performanceMonitor.recordMetric('api_call', 100);
      performanceMonitor.recordMetric('api_call', 200);
      performanceMonitor.recordMetric('api_call', 300);

      const summary = performanceMonitor.getSummary();
      expect(summary.api_call).toEqual({
        count: 3,
        avg: 200,
        min: 100,
        max: 300,
      });
    });

    it('should handle multiple metric types', () => {
      performanceMonitor.recordMetric('api_call', 100);
      performanceMonitor.recordMetric('db_query', 50);
      performanceMonitor.recordMetric('api_call', 200);

      const summary = performanceMonitor.getSummary();
      expect(summary.api_call.count).toBe(2);
      expect(summary.db_query.count).toBe(1);
    });
  });

  describe('measurePerformance', () => {
    it('should measure synchronous function execution', () => {
      const result = measurePerformance('sync_test', () => {
        return 'test result';
      });

      expect(result).toBe('test result');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('sync_test');
      expect(metrics[0].value).toBeGreaterThanOrEqual(0);
    });

    it('should measure asynchronous function execution', async () => {
      const result = await measurePerformance('async_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      });

      expect(result).toBe('async result');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async_test');
      expect(metrics[0].value).toBeGreaterThanOrEqual(10);
    });

    it('should include metadata in metrics', () => {
      measurePerformance('test_with_metadata', () => 'result', { userId: '123' });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual({ userId: '123' });
    });
  });

  describe('measureApiRequest', () => {
    it('should measure successful API request', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await measureApiRequest('/api/test', mockFetch);

      expect(result).toEqual({ data: 'test' });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('api_response');
      expect(metrics[0].metadata?.url).toBe('/api/test');
    });

    it('should measure failed API request', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(measureApiRequest('/api/test', mockFetch)).rejects.toThrow('API Error');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('api_error');
      expect(metrics[0].metadata?.url).toBe('/api/test');
    });
  });

  describe('measureDbQuery', () => {
    it('should measure successful database query', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1 }]);

      const result = await measureDbQuery('get_users', mockQuery);

      expect(result).toEqual([{ id: 1 }]);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('db_query');
      expect(metrics[0].metadata?.query).toBe('get_users');
    });

    it('should measure failed database query', async () => {
      const mockQuery = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(measureDbQuery('get_users', mockQuery)).rejects.toThrow('DB Error');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('db_error');
      expect(metrics[0].metadata?.query).toBe('get_users');
    });
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should define all required thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP).toBe(1500);
      expect(PERFORMANCE_THRESHOLDS.LCP).toBe(2500);
      expect(PERFORMANCE_THRESHOLDS.FID).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.CLS).toBe(0.1);
      expect(PERFORMANCE_THRESHOLDS.TTFB).toBe(600);
      expect(PERFORMANCE_THRESHOLDS.API_RESPONSE).toBe(500);
      expect(PERFORMANCE_THRESHOLDS.DB_QUERY).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.INITIAL_BUNDLE).toBe(200 * 1024);
      expect(PERFORMANCE_THRESHOLDS.TOTAL_PAGE_WEIGHT).toBe(1024 * 1024);
    });
  });
});
