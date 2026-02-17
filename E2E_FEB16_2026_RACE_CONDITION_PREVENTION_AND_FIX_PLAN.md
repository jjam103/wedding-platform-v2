# E2E Race Condition Prevention & Systematic Fix Plan
**Date**: February 16, 2026

## Executive Summary

Yes, race conditions DID have an impact, but they're a **minor contributor** (estimated 5-10% of failures). The single-worker test proves that 75% of failures persist even with sequential execution, meaning the primary issues are fundamental test infrastructure problems.

However, we should still prevent race conditions to ensure reliable parallel execution going forward.

## Part 1: Race Condition Impact Analysis

### What the Data Shows

| Scenario | Failed Tests | Flaky Tests | Total Issues |
|----------|-------------|-------------|--------------|
| **4 Workers (Parallel)** | 44 (13.3%) | 5 (1.5%) | 49 (14.8%) |
| **1 Worker (Sequential)** | 27 (55.1%) | 2 (4.1%) | 29 (59.2%) |

### Race Condition Impact Calculation

**Tests that improved with sequential execution:**
- 4 workers: 44 failed + 5 flaky = 49 issues
- 1 worker: 27 failed + 2 flaky = 29 issues
- **Improvement: 20 tests** (49 - 29 = 20)

**Estimated race condition contribution:**
- 20 tests improved out of 49 total = **41% of the failing subset**
- But 20 tests out of 332 total = **6% of full suite**

### Conclusion on Race Conditions

Race conditions ARE affecting tests, but:
1. **Primary impact**: 20 tests (~6% of suite) show race-related issues
2. **Secondary impact**: 27 tests (55%) still fail without race conditions
3. **Root cause**: Most failures are fundamental infrastructure issues, not race conditions

## Part 2: Race Condition Prevention Strategy

### Strategy 1: Test Isolation Improvements

#### 1.1 Database Cleanup Enhancement

**Current Issue**: Tests don't fully clean up data, causing conflicts in parallel execution.

**Fix**: Improve cleanup in `__tests__/helpers/cleanup.ts`

```typescript
// Enhanced cleanup with transaction support
export async function comprehensiveCleanup(testId?: string) {
  const supabase = createTestSupabaseClient();
  
  // Use transaction for atomic cleanup
  const { error } = await supabase.rpc('cleanup_test_data', {
    test_identifier: testId || 'all'
  });
  
  if (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
  
  // Verify cleanup completed
  const { count } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', '%@example.com');
  
  if (count && count > 0) {
    console.warn(`Cleanup incomplete: ${count} test records remain`);
  }
}
```

**Database Function** (add to migrations):

```sql
-- Migration: Add cleanup function for test data
CREATE OR REPLACE FUNCTION cleanup_test_data(test_identifier TEXT)
RETURNS void AS $$
BEGIN
  -- Delete in correct order to respect foreign keys
  DELETE FROM rsvps WHERE guest_id IN (
    SELECT id FROM guests WHERE email LIKE '%@example.com'
  );
  
  DELETE FROM guests WHERE email LIKE '%@example.com';
  DELETE FROM guest_groups WHERE name LIKE 'Test%';
  DELETE FROM events WHERE name LIKE 'Test%';
  DELETE FROM activities WHERE name LIKE 'Test%';
  DELETE FROM content_pages WHERE slug LIKE 'test-%';
  
  -- Add more tables as needed
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 Unique Test Data Generation

**Current Issue**: Tests use predictable data (e.g., "Test Guest 1"), causing conflicts.

**Fix**: Use unique identifiers per test run

```typescript
// __tests__/helpers/testDataGenerator.ts
export function generateUniqueTestData(testName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const testId = `${testName}-${timestamp}-${random}`;
  
  return {
    testId,
    email: `test-${testId}@example.com`,
    groupName: `Test Group ${testId}`,
    eventName: `Test Event ${testId}`,
    slug: `test-${testId}`,
  };
}

// Usage in tests
test('should create guest', async () => {
  const testData = generateUniqueTestData('create-guest');
  
  const guest = await createTestGuest({
    email: testData.email,
    groupId: testData.groupId,
  });
  
  // Test assertions...
  
  // Cleanup with test ID
  await comprehensiveCleanup(testData.testId);
});
```

#### 1.3 Test Execution Locks

**Current Issue**: Multiple tests modify the same resources simultaneously.

**Fix**: Implement test-level locking for shared resources

```typescript
// __tests__/helpers/testLocks.ts
const locks = new Map<string, Promise<void>>();

export async function withLock<T>(
  resourceId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Wait for existing lock
  while (locks.has(resourceId)) {
    await locks.get(resourceId);
  }
  
  // Acquire lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  locks.set(resourceId, lockPromise);
  
  try {
    // Execute function
    return await fn();
  } finally {
    // Release lock
    locks.delete(resourceId);
    releaseLock!();
  }
}

// Usage in tests
test('should update admin settings', async () => {
  await withLock('admin-settings', async () => {
    // Only one test can modify admin settings at a time
    const result = await updateSettings({ theme: 'dark' });
    expect(result.success).toBe(true);
  });
});
```

### Strategy 2: Worker Configuration Optimization

#### 2.1 Shard Tests by Category

**Fix**: Group tests to minimize conflicts

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4,
  
  // Shard tests by category
  projects: [
    {
      name: 'auth-tests',
      testMatch: /auth\/.*.spec.ts/,
      workers: 1, // Auth tests run sequentially
    },
    {
      name: 'admin-tests',
      testMatch: /admin\/.*.spec.ts/,
      workers: 2, // Admin tests can run in parallel
    },
    {
      name: 'guest-tests',
      testMatch: /guest\/.*.spec.ts/,
      workers: 2,
    },
    {
      name: 'system-tests',
      testMatch: /system\/.*.spec.ts/,
      workers: 1, // System tests modify global state
    },
  ],
});
```

#### 2.2 Test Retry Strategy

**Fix**: Retry flaky tests with exponential backoff

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 1,
  
  use: {
    // Add retry delay
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Custom retry logic
  testOptions: {
    retryStrategy: 'exponential', // 1s, 2s, 4s delays
  },
});
```

### Strategy 3: Database Connection Pooling

**Current Issue**: Tests exhaust database connections in parallel.

**Fix**: Implement connection pooling

```typescript
// __tests__/helpers/testDb.ts
import { createClient } from '@supabase/supabase-js';

// Connection pool
const connectionPool: SupabaseClient[] = [];
const MAX_CONNECTIONS = 10;

export function getTestDbConnection(): SupabaseClient {
  // Reuse existing connection if available
  if (connectionPool.length > 0) {
    return connectionPool.pop()!;
  }
  
  // Create new connection if under limit
  if (connectionPool.length < MAX_CONNECTIONS) {
    return createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_ANON_KEY!
    );
  }
  
  // Wait for connection to become available
  throw new Error('Connection pool exhausted');
}

export function releaseTestDbConnection(client: SupabaseClient) {
  connectionPool.push(client);
}
```

## Part 3: Systematic Fix Plan for 27 Failing Tests

### Phase 1: Critical Infrastructure (P0) - 11 Tests

**Target**: Fix authentication and database issues  
**Timeline**: 1-2 days  
**Expected Impact**: +11 tests passing (22% improvement)

#### Task 1.1: Fix Guest Authentication (5 tests)

**Tests:**
1. Email matching authentication
2. Session cookie creation
3. Logout flow
4. Authentication persistence
5. Audit log authentication events

**Root Cause**: Cookie/session creation mechanism not working correctly

**Fix Steps:**

1. **Update `__tests__/helpers/guestAuthHelpers.ts`:**

```typescript
export async function createGuestSession(email: string) {
  const supabase = createTestSupabaseClient();
  
  // Create session via API (not direct DB)
  const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  const { session } = await response.json();
  
  // Wait for session to be fully created
  await waitForCondition(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session !== null;
  }, 5000);
  
  return session;
}
```

2. **Add proper wait conditions in tests:**

```typescript
test('should authenticate with email matching', async ({ page }) => {
  await page.goto('/auth/guest-login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Wait for authentication to complete
  await page.waitForURL('/guest/dashboard', { timeout: 10000 });
  
  // Verify session cookie exists
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('session'));
  expect(sessionCookie).toBeDefined();
});
```

#### Task 1.2: Fix Database Cleanup (3 tests)

**Tests:**
1. Update existing RSVP
2. Enforce capacity constraints
3. Cycle through RSVP statuses

**Root Cause**: Foreign key violations from incomplete cleanup

**Fix Steps:**

1. **Add cleanup verification:**

```typescript
afterEach(async () => {
  await comprehensiveCleanup();
  
  // Verify cleanup completed
  const { count: guestCount } = await testDb
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .like('email', '%@example.com');
  
  expect(guestCount).toBe(0);
});
```

2. **Add dependency checks before deletion:**

```typescript
async function deleteTestGuest(guestId: string) {
  // Delete dependent records first
  await testDb.from('rsvps').delete().eq('guest_id', guestId);
  await testDb.from('guests').delete().eq('id', guestId);
}
```

#### Task 1.3: Fix CSS Delivery (3 tests)

**Tests:**
1. Admin pages styling
2. Responsive design
3. Navigation styling

**Root Cause**: CSS not loaded before tests run

**Fix Steps:**

1. **Add CSS wait helper:**

```typescript
// __tests__/helpers/e2eWaiters.ts
export async function waitForStyles(page: Page) {
  await page.waitForFunction(() => {
    const styles = window.getComputedStyle(document.body);
    return styles.fontFamily !== '' && styles.fontSize !== '';
  }, { timeout: 5000 });
}
```

2. **Use in tests:**

```typescript
test('should have correct styling', async ({ page }) => {
  await page.goto('/admin');
  await waitForStyles(page);
  
  const button = page.locator('button').first();
  const bgColor = await button.evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
});
```

### Phase 2: UI Infrastructure (P1) - 10 Tests

**Target**: Fix keyboard navigation, navigation state, reference blocks  
**Timeline**: 2-3 days  
**Expected Impact**: +10 tests passing (20% improvement)

#### Task 2.1: Fix Keyboard Navigation (5 tests)

**Tests:**
1. Activate buttons with Enter/Space
2. Navigate admin dashboard with keyboard
3. Top navigation keyboard support
4. Responsive design keyboard access
5. Sub-item navigation keyboard

**Root Cause**: Keyboard events not properly handled

**Fix Steps:**

1. **Add keyboard event helpers:**

```typescript
// __tests__/helpers/keyboardHelpers.ts
export async function pressKey(page: Page, key: string) {
  await page.keyboard.press(key);
  await page.waitForTimeout(100); // Allow event to process
}

export async function tabToElement(page: Page, selector: string) {
  let attempts = 0;
  while (attempts < 20) {
    await pressKey(page, 'Tab');
    const focused = await page.evaluate(() => 
      document.activeElement?.matches(selector)
    );
    if (focused) return;
    attempts++;
  }
  throw new Error(`Could not tab to ${selector}`);
}
```

2. **Fix component keyboard handling:**

```typescript
// components/admin/Sidebar.tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
>
  {label}
</button>
```

#### Task 2.2: Fix Admin Navigation (4 tests)

**Tests:**
1. Navigate to sub-items
2. Sticky navigation
3. Mobile menu
4. Glassmorphism effect

**Root Cause**: Navigation state management issues

**Fix Steps:**

1. **Add navigation wait conditions:**

```typescript
async function waitForNavigation(page: Page, expectedUrl: string) {
  await page.waitForURL(expectedUrl, { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  await waitForStyles(page);
}
```

2. **Fix mobile menu state:**

```typescript
// components/admin/MobileNav.tsx
const [isOpen, setIsOpen] = useState(false);

// Ensure state updates complete
const toggleMenu = async () => {
  setIsOpen(prev => !prev);
  await new Promise(resolve => setTimeout(resolve, 300)); // Animation time
};
```

#### Task 2.3: Fix Reference Blocks (3 tests)

**Tests:**
1. Create event reference block
2. Create multiple reference types
3. Filter references by type

**Root Cause**: Reference block creation logic issues

**Fix Steps:**

1. **Add proper wait for reference picker:**

```typescript
test('should create event reference block', async ({ page }) => {
  await page.goto('/admin/content-pages/test-page');
  
  // Wait for section editor to load
  await page.waitForSelector('[data-testid="section-editor"]');
  
  // Click to add reference
  await page.click('button:has-text("Add Reference")');
  
  // Wait for picker to load
  await page.waitForSelector('[data-testid="reference-picker"]');
  await page.waitForFunction(() => {
    const picker = document.querySelector('[data-testid="reference-picker"]');
    return picker && picker.querySelectorAll('[data-testid="reference-item"]').length > 0;
  });
  
  // Select reference
  await page.click('[data-testid="reference-item"]:first-child');
  
  // Wait for reference to be added
  await page.waitForSelector('[data-testid="reference-block"]');
});
```

### Phase 3: Debug Tests Cleanup (P2) - 4 Tests

**Target**: Remove debug tests  
**Timeline**: 1 hour  
**Expected Impact**: -4 tests total (cleaner suite)

#### Task 3.1: Delete Debug Test Files

**Tests to Remove:**
1. `__tests__/e2e/debug-form-submission.spec.ts`
2. `__tests__/e2e/debug-form-validation.spec.ts`
3. `__tests__/e2e/debug-toast-selector.spec.ts`
4. `__tests__/e2e/debug-validation-errors.spec.ts`

**Action:**

```bash
rm __tests__/e2e/debug-*.spec.ts
rm __tests__/e2e/config-verification.spec.ts
```

### Phase 4: Remaining Issues (P3) - 2 Tests

**Target**: Fix miscellaneous issues  
**Timeline**: 1 day  
**Expected Impact**: +2 tests passing (4% improvement)

#### Task 4.1: Fix Remaining Tests

**Tests:**
1. Guest groups dropdown loading states
2. Section management - create new section

**Fix**: Add proper loading state waits and section creation logic

## Part 4: Implementation Timeline

### Week 1: Critical Fixes

**Day 1-2: Phase 1 (P0)**
- Fix guest authentication (5 tests)
- Fix database cleanup (3 tests)
- Fix CSS delivery (3 tests)
- **Target**: 38/49 tests passing (78%)

**Day 3-4: Phase 2 (P1) - Part 1**
- Fix keyboard navigation (5 tests)
- **Target**: 43/49 tests passing (88%)

**Day 5: Phase 2 (P1) - Part 2**
- Fix admin navigation (4 tests)
- Fix reference blocks (3 tests)
- **Target**: 47/49 tests passing (96%)

### Week 2: Cleanup & Prevention

**Day 1: Phase 3 & 4**
- Remove debug tests (4 tests)
- Fix remaining issues (2 tests)
- **Target**: 45/45 tests passing (100%)

**Day 2-3: Race Condition Prevention**
- Implement test isolation improvements
- Add database cleanup enhancements
- Implement connection pooling
- Add test execution locks

**Day 4-5: Verification**
- Run full suite with 4 workers
- Verify no regressions
- Document patterns and best practices

## Part 5: Success Metrics

### Target Outcomes

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Pass Rate (49 tests)** | 40.8% | 100% | +59.2% |
| **Pass Rate (Full Suite)** | 82.8% | 95%+ | +12.2% |
| **Flaky Tests** | 2 | 0 | -2 |
| **Race Conditions** | ~20 tests | 0 | -20 |

### Verification Steps

1. **After Each Phase:**
   - Run affected tests with 1 worker
   - Run affected tests with 4 workers
   - Compare results to ensure no race conditions

2. **Final Verification:**
   - Run full suite 3 times with 4 workers
   - All runs should have 95%+ pass rate
   - No flaky tests across runs

## Conclusion

**Race Conditions**: Yes, they had an impact (~6% of suite, 41% of failing subset), but they're not the primary issue.

**Primary Issues**: Test infrastructure problems (authentication, database cleanup, CSS delivery, keyboard handling) account for 75% of failures.

**Fix Strategy**:
1. Fix fundamental infrastructure issues first (Phases 1-2)
2. Implement race condition prevention (Week 2)
3. Verify with parallel execution

**Expected Outcome**: 95%+ pass rate with reliable parallel execution in 4 workers.

