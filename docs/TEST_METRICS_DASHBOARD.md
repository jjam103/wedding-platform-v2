# Test Metrics Dashboard Guide

Complete guide to using the automated test metrics dashboard for monitoring test suite health and performance.

## Overview

The test metrics dashboard automatically collects, analyzes, and reports on test execution metrics to help maintain a healthy, fast, and reliable test suite.

### Key Features

- **Automatic Collection**: Metrics collected on every test run
- **Historical Tracking**: Last 30 runs stored for trend analysis
- **Flaky Test Detection**: Identifies tests with intermittent failures
- **Performance Monitoring**: Tracks slow tests and execution time
- **Coverage Tracking**: Monitors code coverage trends
- **CI/CD Integration**: Automatic reporting in GitHub Actions
- **Actionable Insights**: Prioritized recommendations for improvements

## Quick Start

### View Current Metrics

```bash
# View quick dashboard
npm run test:dashboard

# Generate comprehensive report
npm run test:metrics

# Run tests (metrics collected automatically)
npm test
```

### Access Reports

1. **Dashboard**: `test-results/metrics/DASHBOARD.md`
   - Quick overview of latest run
   - Slow and flaky tests
   - Historical trends

2. **Comprehensive Report**: `test-results/metrics/COMPREHENSIVE_REPORT.md`
   - Detailed analysis
   - Problem areas
   - Recommendations

3. **Raw Metrics**: `test-results/metrics/latest.json`
   - Complete test results
   - Suite-level data
   - Individual test timings

## Metrics Explained

### 1. Execution Time

**What it measures**: Time to run tests

**Components**:
- **Total Duration**: Full test suite execution time
- **Suite Duration**: Time per test file
- **Test Duration**: Time per individual test
- **Slow Tests**: Tests taking >5 seconds

**Targets**:
- Full suite: <5 minutes
- Integration tests: <2 minutes
- Unit tests: <30 seconds
- Individual test: <1 second

**Why it matters**:
- Fast tests = faster feedback
- Slow tests block CI/CD pipeline
- Developer productivity impact

**How to improve**:
```bash
# Identify slow tests
npm run test:dashboard

# Run tests in parallel
npm test -- --maxWorkers=50%

# Run only changed tests
npm run test:changed
```

### 2. Pass Rate

**What it measures**: Percentage of tests passing

**Formula**: `(Passed Tests / Total Tests) × 100`

**Targets**:
- Overall: 95%+
- Critical paths: 100%
- New features: 100%

**Status Indicators**:
- ✅ 95-100%: Excellent
- ⚠️ 90-95%: Needs attention
- ❌ <90%: Critical issue

**Why it matters**:
- Indicates test suite reliability
- Reflects code quality
- Affects developer confidence

**How to improve**:
```bash
# View failed tests
npm run test:dashboard

# Run only failed tests
npm run test:failed

# Fix and verify
npm test -- --testNamePattern="failing test name"
```

### 3. Flaky Tests

**What it measures**: Tests with intermittent failures

**Detection**: Tests that both pass and fail in last 10 runs

**Metrics**:
- **Flaky Rate**: `(Failures / Total Runs) × 100`
- **Pass Count**: Number of times test passed
- **Fail Count**: Number of times test failed

**Target**: 0 flaky tests

**Why it matters**:
- Reduces developer confidence
- Wastes time investigating
- Masks real issues
- Blocks CI/CD pipeline

**Common causes**:
1. **Timing Issues**: Race conditions, async operations
2. **Test Isolation**: Shared state between tests
3. **External Dependencies**: Network, database, APIs
4. **Random Data**: Non-deterministic test data

**How to fix**:
```typescript
// ❌ BAD: Race condition
it('should update state', () => {
  updateState();
  expect(state).toBe('updated'); // May fail
});

// ✅ GOOD: Proper async handling
it('should update state', async () => {
  await updateState();
  expect(state).toBe('updated');
});

// ❌ BAD: Shared state
let userId;
it('creates user', async () => {
  userId = await createUser();
});
it('updates user', async () => {
  await updateUser(userId); // Fails if previous test skipped
});

// ✅ GOOD: Self-contained
it('updates user', async () => {
  const userId = await createUser();
  await updateUser(userId);
});
```

### 4. Coverage

**What it measures**: Percentage of code executed by tests

**Types**:
- **Lines**: Individual lines of code
- **Statements**: JavaScript statements
- **Functions**: Function definitions
- **Branches**: Conditional branches (if/else)

**Targets**:
- Overall: 85%+
- Services: 90%+
- Critical paths: 95%+
- Utilities: 95%+

**Why it matters**:
- Indicates test completeness
- Finds untested code paths
- Reduces bugs in production

**How to improve**:
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Test specific file
npm test -- --coverage --testPathPattern="services/guestService"
```

### 5. Slow Tests

**What it measures**: Tests taking >5 seconds

**Impact**:
- Slows CI/CD pipeline
- Reduces developer productivity
- Increases infrastructure costs

**Common causes**:
1. **Database Operations**: Real database queries
2. **External APIs**: Network requests
3. **Large Data Sets**: Processing too much data
4. **Inefficient Algorithms**: O(n²) operations
5. **Missing Mocks**: Not mocking slow dependencies

**How to optimize**:
```typescript
// ❌ BAD: Real database query
it('should fetch users', async () => {
  const users = await db.query('SELECT * FROM users');
  expect(users.length).toBeGreaterThan(0);
});

// ✅ GOOD: Mocked database
it('should fetch users', async () => {
  mockDb.query.mockResolvedValue([{ id: 1, name: 'Test' }]);
  const users = await userService.getAll();
  expect(users.length).toBe(1);
});

// ❌ BAD: Large data set
it('should process users', () => {
  const users = generateUsers(10000);
  const result = processUsers(users);
  expect(result).toBeDefined();
});

// ✅ GOOD: Minimal data
it('should process users', () => {
  const users = generateUsers(3);
  const result = processUsers(users);
  expect(result).toBeDefined();
});
```

## Dashboard Sections

### Executive Summary

Quick overview with status indicators:

```markdown
| Metric | Current | Status |
|--------|---------|--------|
| Total Tests | 3,355 | ✅ |
| Pass Rate | 97.2% | ✅ |
| Duration | 96s | ✅ |
| Coverage | 89% | ✅ |
| Flaky Tests | 2 | ⚠️ |
| Slow Tests | 8 | ✅ |
```

**Status Indicators**:
- ✅ Green: Meeting targets
- ⚠️ Yellow: Needs attention
- ❌ Red: Critical issue

### Trends

Historical analysis over last 10 runs:

```markdown
### Pass Rate
- Current Average: 97.2%
- Previous Average: 96.8%
- Change: +0.4%
- Trend: 📈 Improving

### Execution Time
- Current Average: 96s
- Previous Average: 102s
- Change: -6s
- Trend: ⚡ Faster
```

**Trend Indicators**:
- 📈 Improving: Positive change
- 📉 Declining: Negative change
- ⚡ Faster: Performance improved
- 🐌 Slower: Performance degraded

### Problem Areas

Issues requiring attention:

```markdown
### 🔴 Reliability (HIGH)
**Issue**: 2 flaky tests detected
**Recommendation**: Fix flaky tests to improve reliability

### 🟡 Performance (MEDIUM)
**Issue**: 8 tests taking >5 seconds
**Recommendation**: Optimize slow tests or split into smaller units
```

**Severity Levels**:
- 🔴 High: Immediate action required
- 🟡 Medium: Address soon
- 🟢 Low: Monitor and improve

### Recommendations

Prioritized action items:

```markdown
### 🔴 High Priority
1. **Fix flaky tests**
   - Reason: 2 flaky tests detected

### 🟡 Medium Priority
1. **Optimize test performance**
   - Reason: Test duration increased by 6s
```

## CI/CD Integration

### GitHub Actions

Metrics are automatically collected and reported:

1. **On Every Test Run**:
   - Metrics collected via Jest reporter
   - Dashboard generated
   - Comprehensive report created

2. **Uploaded as Artifacts**:
   - Retention: 90 days
   - Download from Actions tab
   - View historical data

3. **PR Comments**:
   - Coverage summary
   - Pass rate
   - Duration
   - Flaky test count
   - Slow test count

### Example PR Comment

```markdown
## 🧪 Test Results

### 📊 Coverage
- Lines: 89.2% ✅
- Statements: 88.7% ✅
- Functions: 87.3% ✅
- Branches: 82.1% ✅

### 🎯 Test Metrics
- Total Tests: 3,355
- Pass Rate: 97.2% ✅
- Duration: 96s ✅
- Flaky Tests: 2 ⚠️
- Slow Tests (>5s): 8 ✅

✅ All checks passed!

📊 [View detailed metrics](../actions/runs/123456)
```

## Best Practices

### Daily Monitoring

```bash
# After running tests
npm run test:dashboard

# Check for issues
# - Pass rate <95%
# - New flaky tests
# - Increased duration
# - Failed tests
```

### Weekly Review

```bash
# Generate comprehensive report
npm run test:metrics

# Review:
# - Trends (improving or declining?)
# - Problem areas (what needs fixing?)
# - Recommendations (what to prioritize?)
# - Historical data (patterns over time?)
```

### Monthly Analysis

```bash
# Analyze historical trends
cat test-results/metrics/test-history.json

# Questions to ask:
# - Is pass rate stable or declining?
# - Is duration increasing over time?
# - Are flaky tests recurring?
# - Is coverage improving?
```

## Troubleshooting

### No Metrics Generated

**Symptoms**:
- No files in `test-results/metrics/`
- Dashboard not created
- No metrics in CI

**Solutions**:
1. Check Jest config has reporter:
   ```javascript
   reporters: [
     'default',
     '<rootDir>/jest-metrics-reporter.js',
   ]
   ```

2. Ensure metrics directory exists:
   ```bash
   mkdir -p test-results/metrics
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Inaccurate Flaky Test Detection

**Symptoms**:
- Tests marked as flaky but aren't
- Flaky tests not detected

**Solutions**:
1. Need more history (run tests 10+ times)
2. Check test isolation
3. Review test-history.json

### Slow Dashboard Generation

**Symptoms**:
- `npm run test:metrics` takes too long
- CI timeout on metrics generation

**Solutions**:
1. Reduce history retention (edit reporter)
2. Run metrics generation separately
3. Skip in CI if needed

## Advanced Usage

### Custom Metrics

Add custom metrics to reporter:

```javascript
// jest-metrics-reporter.js
onTestResult(test, testResult) {
  // Add custom metric
  this.metrics.customMetric = calculateCustomMetric(testResult);
}
```

### Alerting

Set up alerts for critical metrics:

```bash
# In CI/CD pipeline
if [ $(jq '.summary.passRate' test-results/metrics/latest.json) -lt 95 ]; then
  echo "❌ Pass rate below 95%!"
  exit 1
fi
```

### Integration with Monitoring

Export metrics to monitoring tools:

```javascript
// Export to Datadog, New Relic, etc.
const metrics = require('./test-results/metrics/latest.json');
sendToMonitoring(metrics);
```

## Related Documentation

- [Testing Standards](.kiro/steering/testing-standards.md)
- [Parallel Test Execution](./PARALLEL_TEST_EXECUTION.md)
- [Selective Test Running](./SELECTIVE_TEST_RUNNING.md)
- [Test Database Setup](../TEST_DATABASE_SETUP_COMPLETE.md)

## Support

### Questions?

1. Check [Testing Standards](.kiro/steering/testing-standards.md)
2. Review [Test Metrics README](../test-results/metrics/README.md)
3. Check GitHub Actions logs
4. Review test output

### Issues?

1. Verify Jest configuration
2. Check reporter implementation
3. Review CI/CD workflow
4. Test locally first

---

**Maintained by**: Development Team
**Last Updated**: Auto-generated
**Version**: 1.0.0
