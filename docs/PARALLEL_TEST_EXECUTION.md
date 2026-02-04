# Parallel Test Execution Guide

## Overview

Jest runs tests in parallel by default using multiple worker processes. This guide explains how our test suite is optimized for parallel execution and how to write tests that are safe to run in parallel.

## Configuration

### Jest Configuration (`jest.config.js`)

```javascript
{
  // Use 75% of available CPU cores
  maxWorkers: '75%',
  
  // 30 second timeout for slower tests
  testTimeout: 30000,
  
  // Cache test results
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Fail fast in CI
  bail: process.env.CI ? 1 : 0,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
}
```

### Performance Metrics

**Before Optimization:**
- Execution Time: 118 seconds
- Tests: 3,389 tests
- Workers: Default (50% of cores = 4 workers)

**After Optimization:**
- Target: <90 seconds (25% improvement)
- Workers: 75% of cores (6 workers on 8-core machine)
- Improved test isolation
- Better resource cleanup

## Writing Parallel-Safe Tests

### 1. Use Unique Identifiers

**❌ BAD - Hardcoded values cause collisions:**
```typescript
it('should create guest', async () => {
  const guest = await createGuest({
    email: 'test@example.com', // Collision!
    firstName: 'Test'
  });
});
```

**✅ GOOD - Unique identifiers per worker:**
```typescript
import { generateTestEmail, generateTestId } from '@/__tests__/helpers/testIsolation';

it('should create guest', async () => {
  const guest = await createGuest({
    email: generateTestEmail('guest'), // Unique per worker
    firstName: generateTestId('user')
  });
});
```

### 2. Clean Up Test Data

**❌ BAD - No cleanup:**
```typescript
it('should create guest', async () => {
  const guest = await createGuest({ email: 'test@example.com' });
  expect(guest.id).toBeDefined();
  // Data left in database!
});
```

**✅ GOOD - Automatic cleanup:**
```typescript
import { createCleanupTracker } from '@/__tests__/helpers/testIsolation';

describe('Guest Service', () => {
  const cleanup = createCleanupTracker();
  
  afterEach(async () => {
    await cleanup.cleanupAll(supabase);
  });
  
  it('should create guest', async () => {
    const guest = await createGuest({ email: generateTestEmail() });
    cleanup.track('guests', guest.id);
    
    expect(guest.id).toBeDefined();
  });
});
```

### 3. Use Test Namespaces

**✅ GOOD - Namespace for related entities:**
```typescript
import { createTestNamespace } from '@/__tests__/helpers/testIsolation';

it('should create guest group with guests', async () => {
  const ns = createTestNamespace('guest-flow');
  
  // All entities share the same namespace
  const group = await createGroup({ 
    name: ns.name('Family Group') 
  });
  
  const guest1 = await createGuest({ 
    email: ns.email('john'),
    groupId: group.id 
  });
  
  const guest2 = await createGuest({ 
    email: ns.email('jane'),
    groupId: group.id 
  });
  
  // Easy to identify related test data
  expect(guest1.email).toContain(ns.id);
  expect(guest2.email).toContain(ns.id);
});
```

### 4. Avoid Shared State

**❌ BAD - Shared state between tests:**
```typescript
let sharedGuest: Guest;

it('should create guest', async () => {
  sharedGuest = await createGuest({ email: 'test@example.com' });
});

it('should update guest', async () => {
  // Depends on previous test!
  await updateGuest(sharedGuest.id, { firstName: 'Updated' });
});
```

**✅ GOOD - Self-contained tests:**
```typescript
it('should update guest', async () => {
  // Create guest in this test
  const guest = await createGuest({ 
    email: generateTestEmail() 
  });
  
  // Update it
  const result = await updateGuest(guest.id, { 
    firstName: 'Updated' 
  });
  
  expect(result.success).toBe(true);
});
```

### 5. Handle Async Operations

**✅ GOOD - Wait for conditions:**
```typescript
import { waitFor } from '@/__tests__/helpers/testIsolation';

it('should process async operation', async () => {
  const operation = startAsyncOperation();
  
  // Wait for completion
  await waitFor(() => operation.isComplete(), 5000);
  
  expect(operation.result).toBeDefined();
});
```

**✅ GOOD - Retry flaky operations:**
```typescript
import { retry } from '@/__tests__/helpers/testIsolation';

it('should handle external API', async () => {
  // Retry up to 3 times with exponential backoff
  const result = await retry(
    () => fetchExternalData(),
    3,
    100
  );
  
  expect(result).toBeDefined();
});
```

## Test Isolation Utilities

### `generateTestId(prefix)`
Generate unique test identifier with worker ID.

```typescript
const id = generateTestId('guest');
// Returns: 'guest-abc123-1234567890-w1'
```

### `generateTestEmail(prefix)`
Generate unique email address for test users.

```typescript
const email = generateTestEmail('admin');
// Returns: 'admin-abc123-1234567890-w1@test.example.com'
```

### `generateTestSlug(prefix)`
Generate unique slug for test content.

```typescript
const slug = generateTestSlug('page');
// Returns: 'page-abc123-1234567890-w1'
```

### `createCleanupTracker()`
Track and cleanup test resources.

```typescript
const cleanup = createCleanupTracker();

// Track resources
cleanup.track('guests', guestId);
cleanup.track('events', eventId);

// Cleanup all tracked resources
await cleanup.cleanupAll(supabase);
```

### `createTestNamespace(prefix)`
Create namespace for related test entities.

```typescript
const ns = createTestNamespace('flow');

const name = ns.name('Test Group');
const email = ns.email('john');
const slug = ns.slug('page');
const id = ns.subId('item');
```

### `waitFor(condition, timeout, interval)`
Wait for async condition with timeout.

```typescript
await waitFor(() => data.length > 0, 5000, 100);
```

### `retry(fn, maxRetries, baseDelay)`
Retry function with exponential backoff.

```typescript
const result = await retry(() => fetchData(), 3, 100);
```

## Running Tests

### Parallel Execution (Default)
```bash
npm test
# Uses 75% of CPU cores (6 workers on 8-core machine)
```

### Serial Execution (Debugging)
```bash
npm test -- --runInBand
# Runs tests one at a time (useful for debugging)
```

### Specific Worker Count
```bash
npm test -- --maxWorkers=4
# Use exactly 4 workers
```

### Watch Mode
```bash
npm run test:watch
# Runs only changed tests in parallel
```

## Debugging Parallel Test Issues

### Symptom: Tests pass individually but fail in parallel

**Cause:** Shared state or data collisions

**Solution:**
1. Use `generateTestId()` for unique identifiers
2. Add cleanup in `afterEach()`
3. Check for hardcoded test data

### Symptom: Intermittent test failures

**Cause:** Race conditions or timing issues

**Solution:**
1. Use `waitFor()` instead of fixed delays
2. Add `retry()` for flaky operations
3. Increase `testTimeout` if needed

### Symptom: Database errors in parallel tests

**Cause:** Data collisions or missing cleanup

**Solution:**
1. Use `createTestNamespace()` for related entities
2. Use `createCleanupTracker()` for automatic cleanup
3. Check RLS policies allow test operations

### Symptom: Worker process crashes

**Cause:** Memory leaks or unhandled errors

**Solution:**
1. Check for memory leaks in tests
2. Add proper error handling
3. Reduce `maxWorkers` if needed

## Performance Tips

### 1. Group Related Tests
```typescript
describe('Guest Service', () => {
  // All guest tests in one file
  // Jest can optimize worker distribution
});
```

### 2. Use Test Factories
```typescript
// Reuse test data creation
const guest = createTestGuest({ 
  email: generateTestEmail() 
});
```

### 3. Mock External Services
```typescript
// Don't make real API calls in tests
jest.mock('@/services/emailService');
```

### 4. Skip Slow Tests in Watch Mode
```typescript
describe.skip('Slow Integration Tests', () => {
  // Skip in watch mode, run in CI
});
```

### 5. Use Coverage Selectively
```bash
# Full coverage (slower)
npm run test:coverage

# Quick test without coverage
npm run test:quick
```

## CI/CD Configuration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm test
  env:
    CI: true
    # Fail fast in CI
    # Uses bail: 1 from jest.config.js
```

### Performance Monitoring
```bash
# Check test execution time
npm test 2>&1 | grep "Time:"

# Identify slow tests
npm test -- --verbose 2>&1 | grep "PASS\|FAIL"
```

## Best Practices

### ✅ DO
- Use unique identifiers for all test data
- Clean up test data in `afterEach()`
- Make tests independent and self-contained
- Use test isolation utilities
- Mock external services
- Add proper timeouts for async operations

### ❌ DON'T
- Use hardcoded test data (emails, IDs, slugs)
- Share state between tests
- Depend on test execution order
- Leave test data in database
- Make real external API calls
- Use fixed delays (use `waitFor()` instead)

## Troubleshooting

### Check Worker ID
```typescript
import { getWorkerId } from '@/__tests__/helpers/testIsolation';

console.log('Running in worker:', getWorkerId());
```

### Check Test Mode
```typescript
import { getTestMode } from '@/__tests__/helpers/testIsolation';

if (getTestMode() === 'parallel') {
  // Running in parallel
} else {
  // Running serially
}
```

### Debug Specific Test
```bash
# Run single test file serially
npm test -- path/to/test.test.ts --runInBand

# Run with verbose output
npm test -- path/to/test.test.ts --verbose
```

## References

- [Jest Parallel Execution](https://jestjs.io/docs/cli#--maxworkersnumstring)
- [Test Isolation Utilities](../__tests__/helpers/testIsolation.ts)
- [Testing Standards](./testing-standards.md)
- [Test Suite Health Check](./.kiro/specs/test-suite-health-check/design.md)
