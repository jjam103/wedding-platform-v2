# E2E Phase 2 Round 6 - Deep Investigation

**Date:** February 12, 2026  
**Status:** In Progress - Investigating Root Causes  
**Tests Analyzed:** #9 (Inline Section Editor Toggle), #14 (Event Creation)

## Critical Discovery

Both failing tests **PASS when run individually** in headed mode but **FAIL in full suite**.

This definitively proves: **TEST ISOLATION ISSUE**, not component bugs.

## Test #9: Inline Section Editor Toggle

### Test Location
- File: `__tests__/e2e/admin/contentManagement.spec.ts`
- Lines: 462-520
- Test: "should toggle inline section editor and add sections"

### What the Test Does
1. Goes to `/admin/home-page`
2. Clicks "Show Inline Section Editor" button
3. Waits for button text to change to "Hide Inline Section Editor"
4. Waits for `[data-testid="inline-section-editor"]` to appear
5. Clicks "Add Section" button
6. Verifies new section appears

### Current Failures
- **Button text changes** (Show → Hide) ✅
- **Component never loads** ❌
- Timeout waiting for `[data-testid="inline-section-editor"]`

### Component Analysis: InlineSectionEditor.tsx

**Key Findings:**

1. **Dynamic Import** - Component is lazy-loaded:
   ```typescript
   const InlineSectionEditor = dynamic(() => 
     import('@/components/admin/InlineSectionEditor').then(mod => ({ default: mod.InlineSectionEditor })), {
     loading: () => <div className="p-4 text-sm text-gray-600">Loading sections...</div>,
     ssr: false,
   });
   ```

2. **Loading State** - Shows "Loading sections..." during import

3. **Component Mounting** - After import, component:
   - Fetches sections from `/api/admin/sections/by-page/home/home`
   - Shows "Loading sections..." during fetch
   - Renders `<div data-testid="inline-section-editor">` after load

4. **Potential Issues:**
   - Dynamic import may be slow in test environment
   - API call may be timing out
   - Previous test may have left API in bad state
   - Component may be mounting but not rendering testid

### Why It Works Individually
- Clean browser state
- No previous API calls
- No database contention
- Fresh Next.js server state

### Why It Fails in Suite
- Previous tests may have:
  - Left API connections open
  - Caused database locks
  - Filled browser cache
  - Left React state dirty
  - Caused memory pressure

## Test #14: Event Creation

### Test Location
- File: `__tests__/e2e/admin/contentManagement.spec.ts`
- Lines: 700-850
- Test: "should create event and add as reference to content page"

### What the Test Does
1. Goes to `/admin/events`
2. Clicks "Add Event" button
3. Fills form (name, type, date, status)
4. Submits form
5. Waits for API response (POST /api/admin/events)
6. Waits 2 seconds for database write
7. Reloads page
8. Waits for GET /api/admin/events
9. Waits 1 second
10. Verifies event appears in list (20s timeout with retry)

### Current Failures
- **Event created successfully** (API returns 201) ✅
- **Event never appears in list** ❌
- Timeout waiting for event name in DOM

### Component Analysis: app/admin/events/page.tsx

**Key Findings:**

1. **Data Fetching** - Uses `fetchEvents()`:
   ```typescript
   const fetchEvents = useCallback(async () => {
     const response = await fetch('/api/admin/events');
     const result = await response.json();
     if (result.success) {
       setEvents(result.data.events || []);
     }
   }, [addToast]);
   ```

2. **After Create** - Calls `fetchEvents()` after successful create:
   ```typescript
   if (result.success) {
     await fetchEvents(); // Refresh list
     setIsFormOpen(false);
   }
   ```

3. **List Rendering** - Uses DataTable component:
   ```typescript
   <DataTable
     data={events}
     columns={columns}
     loading={loading}
     onRowClick={handleRowClick}
   />
   ```

4. **Potential Issues:**
   - `fetchEvents()` may be called before database commit completes
   - React state update may not trigger re-render
   - DataTable may not update when `events` prop changes
   - Previous test may have left stale data in state

### Why It Works Individually
- Clean database state
- No previous events in state
- Fresh React component mount
- No race conditions

### Why It Fails in Suite
- Previous tests may have:
  - Created events that interfere
  - Left database transactions open
  - Caused React state to be stale
  - Filled event list causing pagination issues
  - Left API cache dirty

## Root Cause Hypotheses

### Hypothesis 1: Database Transaction Timing
**Evidence:**
- Test #14 waits 2s after API response
- Still fails to see event in list
- Suggests database write may take longer in test suite

**Solution:**
- Increase wait time to 3-5 seconds
- Add explicit database flush between tests
- Use database transaction isolation

### Hypothesis 2: React State Not Updating
**Evidence:**
- Test #9 button changes but component doesn't load
- Test #14 API succeeds but list doesn't update
- Suggests React state updates are being batched/delayed

**Solution:**
- Force component remount between tests
- Clear React state explicitly
- Use `act()` wrapper for state updates

### Hypothesis 3: Dynamic Import Caching
**Evidence:**
- Test #9 uses dynamic import
- Component may be cached from previous test
- Cache may be stale or corrupted

**Solution:**
- Clear Next.js cache between tests
- Force fresh import on each test
- Disable dynamic import caching in test mode

### Hypothesis 4: API Response Caching
**Evidence:**
- Test #14 reloads page but still doesn't see event
- GET /api/admin/events may return cached response
- Previous test data may be in cache

**Solution:**
- Add cache-busting query params
- Clear API cache between tests
- Disable API caching in test mode

### Hypothesis 5: Browser State Pollution
**Evidence:**
- Both tests work individually
- Both fail in suite
- Suggests cumulative browser state issues

**Solution:**
- Clear localStorage/sessionStorage between tests
- Clear cookies between tests
- Use fresh browser context for each test

## Recommended Investigation Steps

### Step 1: Add Diagnostic Logging
Add console.log statements to components:

```typescript
// InlineSectionEditor.tsx
useEffect(() => {
  console.log('[InlineSectionEditor] Mounting, fetching sections...');
  fetchSections();
}, [pageType, pageId]);

const fetchSections = useCallback(async () => {
  console.log('[InlineSectionEditor] Fetching sections from API...');
  const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
  console.log('[InlineSectionEditor] API response:', response.status);
  const result = await response.json();
  console.log('[InlineSectionEditor] Sections loaded:', result.data?.length);
}, [pageType, pageId]);
```

```typescript
// app/admin/events/page.tsx
const fetchEvents = useCallback(async () => {
  console.log('[EventsPage] Fetching events from API...');
  const response = await fetch('/api/admin/events');
  console.log('[EventsPage] API response:', response.status);
  const result = await response.json();
  console.log('[EventsPage] Events loaded:', result.data?.events?.length);
  setEvents(result.data.events || []);
}, [addToast]);
```

### Step 2: Run Tests in Headed Mode with Logging
```bash
npm run test:e2e -- --headed --grep "should toggle inline section editor"
npm run test:e2e -- --headed --grep "should create event and add as reference"
```

Watch console output to see:
- When components mount
- When API calls are made
- What data is returned
- Where the flow breaks

### Step 3: Check Database State Between Tests
Add database inspection between tests:

```typescript
test.afterEach(async () => {
  // Check database state
  const events = await testDb.from('events').select('*');
  console.log('Events in DB after test:', events.data?.length);
  
  const sections = await testDb.from('sections').select('*');
  console.log('Sections in DB after test:', sections.data?.length);
});
```

### Step 4: Add Explicit Cleanup
Add cleanup hooks to clear state:

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear browser state
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Wait for previous test cleanup
  await page.waitForTimeout(2000);
  
  // Clear API cache
  await page.route('**/api/**', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  });
});
```

### Step 5: Increase Isolation Waits
If Steps 1-4 don't reveal the issue, increase waits:

```typescript
test.beforeEach(async ({ page }) => {
  // Increase from 500ms to 3000ms
  await page.waitForTimeout(3000);
  
  await page.goto('http://localhost:3000/admin/home-page');
  await page.waitForLoadState('networkidle');
  
  // Add extra wait after networkidle
  await page.waitForTimeout(2000);
});
```

## Alternative Approaches

### Approach A: Split Test Files
Run problematic tests in separate files:
- `contentManagement.part1.spec.ts` (Tests 1-8)
- `contentManagement.part2.spec.ts` (Test 9 only)
- `contentManagement.part3.spec.ts` (Tests 10-13)
- `contentManagement.part4.spec.ts` (Test 14 only)

**Pros:** Guarantees isolation  
**Cons:** Slower test execution, more files to maintain

### Approach B: Use Test Fixtures
Create database fixtures that reset between tests:

```typescript
test.beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});
```

**Pros:** Clean state guaranteed  
**Cons:** Slower tests, requires fixture maintenance

### Approach C: Use Separate Browser Contexts
Give each test its own browser context:

```typescript
test('should toggle inline section editor', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test code...
  
  await context.close();
});
```

**Pros:** Complete isolation  
**Cons:** Much slower, more resource intensive

## Next Actions

1. **Immediate:** Add diagnostic logging (Step 1)
2. **Run:** Tests in headed mode with logging (Step 2)
3. **Analyze:** Console output to identify where flow breaks
4. **Implement:** Targeted fix based on findings
5. **Verify:** Run full suite to confirm fix

## Success Criteria

- Test #9 passes on first try (no retries)
- Test #14 passes on first try (no retries)
- Both tests pass in full suite
- No increase in test execution time
- No component code changes needed (isolation fix only)

## Timeline Estimate

- **Diagnostic logging:** 15 minutes
- **Headed mode testing:** 30 minutes
- **Analysis:** 30 minutes
- **Fix implementation:** 30 minutes
- **Verification:** 15 minutes

**Total:** ~2 hours

## Risk Assessment

**Low Risk:**
- Adding logging (non-invasive)
- Increasing wait times (safe fallback)
- Adding cleanup hooks (improves isolation)

**Medium Risk:**
- Modifying component code (may introduce bugs)
- Changing test structure (may break other tests)

**High Risk:**
- Disabling caching (may affect production behavior)
- Modifying database schema (may cause data loss)

**Recommendation:** Start with low-risk approaches (logging, waits, cleanup) before considering medium/high-risk changes.
