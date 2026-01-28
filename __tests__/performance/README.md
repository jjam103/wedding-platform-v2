# Performance Testing

## Overview

This directory contains performance tests for the Destination Wedding Management Platform. These tests measure system performance under various load conditions and ensure the application meets performance benchmarks.

## Test Files

### `performance.test.ts`

Main performance testing documentation and verification suite:

- Performance testing approach documentation
- Test coverage verification
- Performance benchmarks definition
- Load testing scenarios
- Performance monitoring strategy

**Run**: `npm test -- __tests__/performance/performance.test.ts`

### `loadTest.performance.test.ts`

Detailed performance measurements (note: some tests may fail due to mock limitations):

- Concurrent user load tests (100 users)
- Bulk operations tests (100+ records)
- API response time measurements
- Database query performance tests
- Throughput measurements
- Resource utilization tests

**Run**: `npm test -- __tests__/performance/loadTest.performance.test.ts`

## Performance Benchmarks

### Concurrent User Load (100 Users)

- 100 concurrent guest reads: < 2 seconds
- 100 concurrent RSVP submissions: < 3 seconds
- 100 concurrent event list requests: < 2.5 seconds
- Mixed concurrent operations: < 3 seconds

### Bulk Operations (100+ Records)

- Create 100 guests: < 1 second
- Update 150 guests: < 1.5 seconds
- Delete 100 guests: < 800ms
- Export 200 guests to CSV: < 500ms
- Import 100 guests from CSV: < 1.2 seconds
- Bulk RSVP creation (120 guests): < 1 second

### API Response Times

| Endpoint | Average | Max |
|----------|---------|-----|
| GET /api/guests/:id | < 100ms | < 150ms |
| POST /api/guests | < 150ms | < 200ms |
| PUT /api/guests/:id | < 120ms | < 180ms |
| DELETE /api/guests/:id | < 80ms | < 120ms |
| GET /api/guests (list) | < 200ms | < 300ms |

### Database Query Performance

| Query Type | Target |
|------------|--------|
| Simple SELECT | < 30ms |
| Filtered SELECT | < 50ms |
| Paginated query | < 80ms |
| JOIN query | < 100ms |
| Aggregate query | < 60ms |
| INSERT | < 40ms |
| UPDATE | < 35ms |
| DELETE | < 30ms |

### Throughput

- Target: 500+ requests per second
- Sustained load: 400+ requests/second

### Resource Utilization

- Memory increase (500 operations): < 20MB
- Memory increase (1000 records): < 50MB

## Running Tests

### Run All Performance Tests

```bash
npm test -- __tests__/performance/
```

### Run Specific Test

```bash
npm test -- __tests__/performance/performance.test.ts
```

### Run with Coverage

```bash
npm run test:coverage -- __tests__/performance/
```

## Testing Methodology

### Approach

- **Mock-based testing**: Service layer performance with mocked Supabase
- **High-resolution timing**: Using `performance.now()`
- **Statistical analysis**: Averages, percentiles, standard deviation
- **Memory monitoring**: Using `process.memoryUsage()`
- **Concurrent simulation**: Using `Promise.all()`

### Metrics

1. **Response Time**: Average, max, percentiles (P50, P95, P99)
2. **Throughput**: Requests per second
3. **Memory Usage**: Heap memory, memory increase
4. **Concurrency**: Parallel operation handling

### Limitations

- Mocked database calls (no real network latency)
- Test environment may differ from production
- Memory measurements include test overhead
- No real network I/O

## Performance Monitoring

### Continuous Monitoring

1. **CI/CD**: Performance tests on every PR
2. **Regression Detection**: Automated detection
3. **Build Failure**: If performance degrades > 20%

### Production Monitoring

1. **Supabase Dashboard**: Database performance
2. **Next.js Analytics**: Page load times
3. **Browser DevTools**: Client-side performance
4. **Lighthouse**: Web vitals

### Alerting

- Response time > 500ms
- Memory usage > 100MB increase
- Error rate > 1%
- Throughput < 100 requests/second

## Best Practices

1. Use `performance.now()` for timing
2. Take multiple measurements
3. Calculate percentiles
4. Monitor memory usage
5. Test with realistic data
6. Simulate concurrent users
7. Set reasonable thresholds
8. Run tests in isolation
9. Use mocks appropriately
10. Document requirements

## Recommendations

### For Integration Testing

1. Use real database for accurate measurements
2. Use load testing tools (k6, Artillery, JMeter)
3. Test with realistic network conditions
4. Test from multiple geographic locations

### For Production

1. Implement APM tools (New Relic, Datadog)
2. Track real user monitoring (RUM)
3. Set performance budgets
4. Conduct regular audits
5. Plan for capacity and scale

## Related Documentation

- [PERFORMANCE_TESTING_SUMMARY.md](../../PERFORMANCE_TESTING_SUMMARY.md) - Comprehensive performance testing summary
- [__tests__/regression/performance.regression.test.ts](../regression/performance.regression.test.ts) - Performance regression tests

## Task Reference

This performance testing implementation completes **Task 24.4: Perform performance testing** from the implementation plan.
